/**
 * scripts/extract-pdf-exams.ts
 * Extrai questões de múltipla escolha de PDFs de provas (qualquer vestibular) em
 * "fonte de conteudo/" e salva como Question + QuestionOption via MiMo.
 *
 * Usage:
 *   npx tsx scripts/extract-pdf-exams.ts --dry-run          # só detecta blocos, sem chamar MiMo nem salvar
 *   npx tsx scripts/extract-pdf-exams.ts --all               # processa tudo, salva no banco
 *   npx tsx scripts/extract-pdf-exams.ts --file="UFT_2024"   # reprocessa um arquivo específico (match por substring)
 */

import "dotenv/config"
import { PrismaClient, Difficulty } from "@prisma/client"
import { generateMimoJSON, mimo, MIMO_MODEL_PRO } from "../src/lib/mimo"
import { discoverFiles } from "./lib/discover-files"
import { extractPdfText, md5, sleep, parseCliFlags } from "./lib/extract-text"
import { loadGabaritoForProva } from "./lib/gabarito"

const db = new PrismaClient()

const BATCH_SIZE = 5
const BATCH_DELAY_MS = 12_000
const MAX_TOKENS = 2048

// ── Guarda de saldo / falha sistêmica do MiMo ────────────────────────────────
// O saldo do MiMo pode zerar no meio de um run longo; a API passa a devolver
// 402 "Insufficient account balance". Sem esta guarda, o script engoliria o erro
// e continuaria "processando" arquivos sem salvar nada por horas.
let mimoAborted = false
let mimoAbortReason = ""

/** true se o erro for de saldo/pagamento (402) do MiMo. */
function isBalanceError(err: unknown): boolean {
  const e = err as { status?: number; message?: string } | undefined
  if (!e) return false
  if (e.status === 402) return true
  return /insufficient.*balance|saldo|payment required|402/i.test(e.message ?? "")
}

/**
 * Pré-checagem: uma chamada mínima ao MiMo antes de extrair qualquer PDF.
 * Retorna false se o saldo estiver zerado (aborta o run); true caso contrário.
 */
async function preflightMimoBalance(): Promise<boolean> {
  try {
    await mimo.chat.completions.create({
      model: MIMO_MODEL_PRO,
      messages: [{ role: "user", content: 'Responda apenas: {"ok":true}' }],
      max_tokens: 20,
      temperature: 0,
    })
    return true
  } catch (err) {
    if (isBalanceError(err)) {
      console.error(
        "\n❌  MiMo sem saldo (402 Insufficient account balance).\n" +
          "    Recarregue a conta em https://api.xiaomimimo.com antes de rodar o extract.\n" +
          "    Nenhum PDF foi processado.\n"
      )
      return false
    }
    const e = err as { status?: number; message?: string }
    console.warn(`⚠️   Pré-checagem do MiMo falhou (status ${e?.status ?? "?"}): ${e?.message ?? err}. Seguindo mesmo assim.`)
    return true
  }
}

const flags = parseCliFlags(process.argv.slice(2))
const isDryRun = flags["dry-run"] === true
const isAll = flags["all"] === true
const fileFilter = typeof flags["file"] === "string" ? flags["file"].toLowerCase() : null
// --only=termo1,termo2  → processa só arquivos cujo caminho contém algum dos termos
// --skip=termo1,termo2  → ignora arquivos cujo caminho contém algum dos termos
const onlyTerms = typeof flags["only"] === "string" ? flags["only"].toLowerCase().split(",").map((s) => s.trim()).filter(Boolean) : null
const skipTerms = typeof flags["skip"] === "string" ? flags["skip"].toLowerCase().split(",").map((s) => s.trim()).filter(Boolean) : null

if (!isDryRun && !isAll && !fileFilter && !onlyTerms) {
  console.error("❌  Passe --dry-run, --all, --file=<nome>, ou --only=<termos>")
  process.exit(1)
}

// ── Question-block splitting (tolerant to varied numbering styles) ─────────
interface RawBlock {
  number: number | null
  text: string
}

const NUMBERING_PATTERNS: RegExp[] = [
  /QUEST[ÃA]O\s*N?[ºo°]?\s*(\d{1,3})\b/gi,
  /^\s*(\d{1,3})\s*[\.\)]\s+/gm,
]

function splitIntoBlocks(text: string): RawBlock[] {
  let bestMatches: RegExpMatchArray[] = []
  let bestPattern: RegExp | null = null

  for (const pattern of NUMBERING_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags)
    const matches = [...text.matchAll(re)]
    if (matches.length > bestMatches.length) {
      bestMatches = matches
      bestPattern = re
    }
  }

  if (!bestPattern || bestMatches.length < 4) {
    return [{ number: null, text }]
  }

  const blocks: RawBlock[] = []
  for (let i = 0; i < bestMatches.length; i++) {
    const start = bestMatches[i].index ?? 0
    const end = i + 1 < bestMatches.length ? (bestMatches[i + 1].index ?? text.length) : text.length
    const raw = text.slice(start, end).trim()
    const num = parseInt(bestMatches[i][1], 10)
    blocks.push({ number: Number.isFinite(num) ? num : null, text: raw })
  }
  return blocks
}

// ENEM-style options often have no punctuation after the letter ("A texto…"),
// so we look for lines that *start* with a single option letter and require
// them to appear in strict alphabetical sequence (A, B, C, D[, E]) — this
// avoids false positives from prose sentences that happen to start with "A".
const OPTION_START_RE = /^\s*\(?([A-E])\)?[\.\)]?\s+\S/

function looksLikeQuestion(blockText: string): boolean {
  if (blockText.length < 80 || blockText.length > 6000) return false

  const lines = blockText.split("\n")
  const foundLetters: string[] = []
  for (const line of lines) {
    const m = line.match(OPTION_START_RE)
    if (m) foundLetters.push(m[1])
  }

  let runLength = 1
  let bestRun = 0
  for (let i = 1; i < foundLetters.length; i++) {
    const prevCode = foundLetters[i - 1].charCodeAt(0)
    const curCode = foundLetters[i].charCodeAt(0)
    if (curCode === prevCode + 1) {
      runLength++
    } else if (curCode !== prevCode) {
      runLength = 1
    }
    bestRun = Math.max(bestRun, runLength)
  }

  return bestRun >= 4
}

// ── MiMo structuring ─────────────────────────────────────────────────────────
interface StructuredQuestion {
  statement: string
  options: { letter: string; text: string }[]
  correctLetter: string | null
  subject: string
  sourceExam: string
  difficulty: "EASY" | "MEDIUM" | "HARD" | "VERY_HARD"
  hasImage: boolean
}

function buildPrompt(blockText: string, hint: string): string {
  return `Você extrai questões de múltipla escolha de vestibulares brasileiros a partir de texto bruto extraído de PDF (pode ter espaçamento/quebras de linha irregulares).

Localização do arquivo de origem (use para inferir o vestibular/ano): ${hint}

Texto bruto do bloco candidato a questão:
"""
${blockText.slice(0, 4000)}
"""

Retorne SOMENTE um JSON (sem markdown, sem explicação) no formato:
{
  "statement": string (enunciado completo da questão, sem o número, sem as alternativas),
  "options": [{"letter": "A", "text": string}, ...] (quantas alternativas o bloco realmente tiver, 0 se não for uma questão),
  "correctLetter": string ou null (só se o gabarito estiver explícito no texto, senão null),
  "subject": string (chute da disciplina: ex "Biologia", "Matemática", "História"),
  "sourceExam": string (nome do vestibular/prova + ano, ex "FAMEMA 2023", "UFT 2019.1", "ENEM 2020" — infira da localização do arquivo),
  "difficulty": "EASY" | "MEDIUM" | "HARD" | "VERY_HARD" (chute, ou "MEDIUM" se não for possível avaliar),
  "hasImage": boolean (true se o enunciado referenciar figura/gráfico/imagem que não está no texto)
}
Se o bloco não for uma questão real (capa, instruções, texto de apoio solto), retorne options como array vazio.`
}

function isValidStructured(data: unknown): data is StructuredQuestion {
  if (!data || typeof data !== "object") return false
  const d = data as Record<string, unknown>
  return (
    typeof d.statement === "string" &&
    Array.isArray(d.options) &&
    typeof d.subject === "string" &&
    typeof d.sourceExam === "string" &&
    typeof d.difficulty === "string"
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  let files = discoverFiles("PROVA")
  if (fileFilter) files = files.filter((f) => f.relPath.toLowerCase().includes(fileFilter))
  if (onlyTerms) files = files.filter((f) => onlyTerms.some((t) => f.relPath.toLowerCase().includes(t)))
  if (skipTerms) files = files.filter((f) => !skipTerms.some((t) => f.relPath.toLowerCase().includes(t)))

  console.log(`📄  ${files.length} arquivos PROVA encontrados\n`)

  // Aborta cedo se o MiMo já estiver sem saldo (evita extrair centenas de PDFs à toa).
  if (!isDryRun && !(await preflightMimoBalance())) {
    process.exitCode = 1
    await db.$disconnect()
    return
  }

  const topics = isDryRun ? [] : await db.topic.findMany({ select: { id: true, name: true } })

  const existingHashes = new Set<string>()
  if (!isDryRun) {
    const existing = await db.question.findMany({ select: { statement: true } })
    for (const q of existing) existingHashes.add(md5(q.statement))
  }

  let totalBlocks = 0
  let totalCandidates = 0
  let totalSaved = 0
  let totalDuplicates = 0
  let totalNoGabarito = 0
  let totalErrors = 0
  const bySource: Record<string, number> = {}

  for (const file of files) {
    let text: string
    try {
      text = await extractPdfText(file.fullPath)
    } catch (err) {
      console.error(`  ❌  ${file.relPath} — falha ao extrair PDF: ${err}`)
      totalErrors++
      continue
    }

    const blocks = splitIntoBlocks(text)
    const candidates = blocks.filter((b) => looksLikeQuestion(b.text))
    totalBlocks += blocks.length
    totalCandidates += candidates.length

    if (isDryRun) {
      console.log(`  ${file.relPath} — ${blocks.length} blocos, ${candidates.length} candidatos a questão`)
      continue
    }

    // Gabarito da prova (número→letra) — autoridade sobre a resposta certa.
    const gabarito = await loadGabaritoForProva(file.fullPath).catch(() => ({ answers: new Map<number, string>(), count: 0 }))

    for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
      const batch = candidates.slice(i, i + BATCH_SIZE)

      const results = await Promise.all(
        batch.map(async (block) => {
          try {
            const prompt = buildPrompt(block.text, file.hint)
            const structured = await generateMimoJSON<StructuredQuestion>(prompt, MAX_TOKENS)
            if (!isValidStructured(structured)) return { status: "error" as const }
            return { status: "ok" as const, structured, number: block.number }
          } catch (err) {
            if (isBalanceError(err)) {
              mimoAborted = true
              mimoAbortReason = "MiMo sem saldo (402 Insufficient account balance)"
            }
            return { status: "error" as const }
          }
        })
      )

      // Saldo zerou no meio do run — aborta em vez de rodar horas salvando nada.
      if (mimoAborted) break

      for (const r of results) {
        if (r.status === "error") {
          totalErrors++
          continue
        }
        const s = r.structured
        if (s.options.length < 4 || s.statement.length <= 50) continue

        // Resposta certa do gabarito (por número da questão) tem prioridade.
        const fromGab = r.number != null ? gabarito.answers.get(r.number) : undefined
        if (fromGab) s.correctLetter = fromGab

        const hash = md5(s.statement)
        if (existingHashes.has(hash)) {
          totalDuplicates++
          continue
        }
        existingHashes.add(hash)

        const topicMatch = topics.find((t) => s.subject.toLowerCase().includes(t.name.toLowerCase().split(" ")[0]))
        const tags = [s.sourceExam.toLowerCase(), s.subject.toLowerCase()]
        if (!s.correctLetter) tags.push("sem-gabarito")

        try {
          const created = await db.question.create({
            data: {
              topicId: topicMatch?.id ?? null,
              source: s.sourceExam,
              statement: s.statement,
              explanation: "",
              difficulty: (s.difficulty in Difficulty ? s.difficulty : "MEDIUM") as Difficulty,
              images: [],
              tags,
              options: {
                create: s.options.map((opt, idx) => ({ letter: opt.letter, text: opt.text, order: idx + 1 })),
              },
            },
            include: { options: true },
          })

          if (s.correctLetter) {
            const correct = created.options.find((o) => o.letter === s.correctLetter)
            if (correct) {
              await db.question.update({ where: { id: created.id }, data: { correctId: correct.id } })
            }
          } else {
            totalNoGabarito++
          }

          bySource[s.sourceExam] = (bySource[s.sourceExam] ?? 0) + 1
          totalSaved++
        } catch {
          totalErrors++
        }
      }

      const isLastBatch = i + BATCH_SIZE >= candidates.length
      if (!isLastBatch) await sleep(BATCH_DELAY_MS)
    }

    if (mimoAborted) break

    console.log(`  ✅  ${file.relPath} — processado (${candidates.length} candidatos)`)
  }

  console.log("\n" + "─".repeat(50))
  if (mimoAborted) {
    console.error(
      `\n🛑  ABORTADO: ${mimoAbortReason}.\n` +
        `    Salvei ${totalSaved} questões novas antes de parar.\n` +
        `    Recarregue o saldo em https://api.xiaomimimo.com e rode de novo:\n` +
        `      npx tsx scripts/extract-pdf-exams.ts --all\n` +
        `    O script é idempotente (dedup por MD5) — retoma sem duplicar.\n`
    )
    process.exitCode = 1
    await db.$disconnect()
    return
  }
  if (isDryRun) {
    console.log(`🔍  DRY RUN — nenhuma chamada à MiMo, nenhum salvamento`)
    console.log(`   Total de blocos detectados:      ${totalBlocks}`)
    console.log(`   Total de candidatos a questão:    ${totalCandidates}`)
  } else {
    console.log(`✅  Concluído!`)
    console.log(`   Questões novas salvas: ${totalSaved}`)
    console.log(`   Sem gabarito:          ${totalNoGabarito}`)
    console.log(`   Duplicadas puladas:    ${totalDuplicates}`)
    console.log(`   Erros:                 ${totalErrors}`)
    console.log(`\n   Por fonte:`)
    for (const [source, count] of Object.entries(bySource).sort((a, b) => b[1] - a[1])) {
      console.log(`     ${source}: ${count}`)
    }
  }

  await db.$disconnect()
}

main().catch((err) => {
  console.error(err)
  db.$disconnect()
  process.exit(1)
})
