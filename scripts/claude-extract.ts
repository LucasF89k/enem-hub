/**
 * scripts/claude-extract.ts
 *
 * Igual ao extract-pdf-exams.ts, mas SEM MiMo: quem estrutura as questões é o
 * Claude (assistente), dentro da conversa. Loop resumível com estado em disco:
 *
 *   npx tsx scripts/claude-extract.ts --prepare        # lista as provas em ordem de prioridade
 *   npx tsx scripts/claude-extract.ts --next=40        # entrega o próximo lote de blocos (todo.json)
 *   # (o Claude lê todo.json e escreve done.json com o JSON estruturado)
 *   npx tsx scripts/claude-extract.ts --commit         # insere done.json no Neon e avança o cursor
 *   npx tsx scripts/claude-extract.ts --status         # progresso
 *
 * Idempotente: dedup por MD5 do enunciado (igual ao extract-pdf-exams).
 */

import "dotenv/config"
import fs from "node:fs"
import path from "node:path"
import { PrismaClient, Difficulty } from "@prisma/client"
import { discoverFiles, CONTENT_ROOT } from "./lib/discover-files"
import { extractPdfText, md5, parseCliFlags } from "./lib/extract-text"
import { loadGabaritoForProva } from "./lib/gabarito"

const db = new PrismaClient()

const WORK_DIR = path.resolve(__dirname, ".claude-extract")
const STATE_FILE = path.join(WORK_DIR, "state.json")
const TODO_FILE = path.join(WORK_DIR, "todo.json")
const DONE_FILE = path.join(WORK_DIR, "done.json")

const flags = parseCliFlags(process.argv.slice(2))

// ── Detecção de blocos (copiada de extract-pdf-exams.ts) ─────────────────────
const NUMBERING_PATTERNS: RegExp[] = [
  /QUEST[ÃA]O\s*N?[ºo°]?\s*(\d{1,3})\b/gi,
  /^\s*(\d{1,3})\s*[\.\)]\s+/gm,
]

interface RawBlock {
  number: number | null
  text: string
}

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
  if (!bestPattern || bestMatches.length < 4) return [{ number: null, text }]
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
    if (curCode === prevCode + 1) runLength++
    else if (curCode !== prevCode) runLength = 1
    bestRun = Math.max(bestRun, runLength)
  }
  return bestRun >= 4
}

// ── Prioridade: provas reais primeiro, simulados privados por último ─────────
function priorityOf(relPathLower: string): number {
  if (
    relPathLower.includes("simulados bernoulli") ||
    relPathLower.includes("simu s0m0z") ||
    relPathLower.includes("censured p0l") ||
    relPathLower.includes("simulados sas") ||
    relPathLower.includes("poliedro") ||
    relPathLower.includes("somos") ||
    relPathLower.includes("somus")
  ) return 90 // simulados privados — baixa prioridade
  // UERJ/UNESP primeiro: texto limpo, gabarito com 90 respostas e ainda NÃO
  // importados (o MiMo parou antes de chegar neles).
  if (relPathLower.includes("uerj") || relPathLower.includes("unesp")) return 5
  // Demais vestibulares reais (FAMEMA/FAMERP/Exato já parcialmente no banco).
  if (
    relPathLower.includes("uft") || relPathLower.includes("famema") ||
    relPathLower.includes("famerp") || relPathLower.includes("unifesp") ||
    relPathLower.includes("einstein") || relPathLower.includes("uniceub") ||
    relPathLower.includes("exato") || relPathLower.includes("tocantins")
  ) return 10 // vestibulares reais nomeados
  if (relPathLower.includes("encceja")) return 40
  if (relPathLower.includes("enem")) return 30 // ENEM (regular já importado; PPL tem risco de numeração/cor)
  return 50
}

// ── Estado ───────────────────────────────────────────────────────────────────
interface FileProgress { offset: number; total: number; done: boolean }
interface State {
  order: string[]
  progress: Record<string, FileProgress>
  counts: { saved: number; duplicates: number; errors: number; noGabarito: number; filesDone: number }
  claimed?: Record<string, boolean>
}

function loadState(): State {
  const s = JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) as State
  if (!s.claimed) s.claimed = {}
  return s
}

const todoPath = () => (typeof flags["todo"] === "string" ? (flags["todo"] as string) : TODO_FILE)
const donePath = () => (typeof flags["done"] === "string" ? (flags["done"] as string) : DONE_FILE)
function saveState(s: State) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2))
}

// ── Estrutura que o Claude devolve ───────────────────────────────────────────
interface StructuredQuestion {
  idx: number
  statement: string
  options: { letter: string; text: string }[]
  correctLetter: string | null
  subject: string
  sourceExam: string
  difficulty: "EASY" | "MEDIUM" | "HARD" | "VERY_HARD"
}

// ── Modos ─────────────────────────────────────────────────────────────────────
async function cmdPrepare() {
  fs.mkdirSync(WORK_DIR, { recursive: true })
  const files = discoverFiles("PROVA")
  const ordered = files
    .map((f) => ({ relPath: f.relPath, p: priorityOf(f.relPath.toLowerCase()) }))
    .sort((a, b) => a.p - b.p || a.relPath.localeCompare(b.relPath))
    .map((f) => f.relPath)

  const state: State = {
    order: ordered,
    progress: {},
    counts: { saved: 0, duplicates: 0, errors: 0, noGabarito: 0, filesDone: 0 },
  }
  saveState(state)

  const byPrio: Record<number, number> = {}
  for (const f of files) {
    const p = priorityOf(f.relPath.toLowerCase())
    byPrio[p] = (byPrio[p] ?? 0) + 1
  }
  console.log(`📄  ${ordered.length} arquivos PROVA enfileirados (ordem de prioridade).`)
  console.log(`   ENEM oficial (p10):        ${byPrio[10] ?? 0}`)
  console.log(`   Vestibulares reais (p20):  ${byPrio[20] ?? 0}`)
  console.log(`   Outros (p50):              ${byPrio[50] ?? 0}`)
  console.log(`   Simulados privados (p90):  ${byPrio[90] ?? 0}`)
  await db.$disconnect()
}

function fileByRel(rel: string) {
  const all = discoverFiles("PROVA")
  return all.find((f) => f.relPath === rel)
}

async function cmdNext() {
  const n = flags["next"] ? parseInt(flags["next"] as string, 10) : 40
  const state = loadState()

  // Acha o próximo arquivo com candidatos pendentes.
  for (const rel of state.order) {
    let prog = state.progress[rel]
    if (prog?.done) continue

    const file = fileByRel(rel)
    if (!file) {
      state.progress[rel] = { offset: 0, total: 0, done: true }
      continue
    }

    let text: string
    try {
      text = await extractPdfText(file.fullPath)
    } catch {
      state.progress[rel] = { offset: 0, total: 0, done: true } // PDF ilegível (escaneado) — pula
      state.counts.filesDone++
      saveState(state)
      continue
    }

    const blocks = splitIntoBlocks(text)
    const candidates = blocks.filter((b) => looksLikeQuestion(b.text))

    if (candidates.length === 0) {
      state.progress[rel] = { offset: 0, total: 0, done: true }
      state.counts.filesDone++
      saveState(state)
      continue
    }

    prog = prog ?? { offset: 0, total: candidates.length, done: false }
    prog.total = candidates.length
    const start = prog.offset
    const batch = candidates.slice(start, start + n)

    if (batch.length === 0) {
      prog.done = true
      state.progress[rel] = prog
      state.counts.filesDone++
      saveState(state)
      continue
    }

    const items = batch.map((b, k) => ({ idx: start + k, number: b.number, text: b.text.slice(0, 4500) }))
    fs.writeFileSync(
      TODO_FILE,
      JSON.stringify({ file: rel, hint: file.hint, offset: start, total: candidates.length, items }, null, 2)
    )
    state.progress[rel] = prog
    saveState(state)

    console.log(`FILE: ${rel}`)
    console.log(`HINT: ${file.hint}`)
    console.log(`BATCH: ${items.length} blocos (offset ${start}/${candidates.length})`)
    console.log(`→ Leia ${TODO_FILE} e escreva ${DONE_FILE}`)
    await db.$disconnect()
    return
  }

  console.log("✅  FILA VAZIA — todas as provas priorizadas foram processadas.")
  await db.$disconnect()
}

async function cmdCommit() {
  const state = loadState()
  const todo = JSON.parse(fs.readFileSync(todoPath(), "utf8")) as {
    file: string; offset: number; total: number; items: { idx: number; number: number | null }[]
  }
  const done = JSON.parse(fs.readFileSync(donePath(), "utf8")) as StructuredQuestion[]

  // Gabarito da prova (mapa número→letra), autoridade sobre a resposta.
  const provaFullPath = path.join(CONTENT_ROOT, todo.file)
  const gabarito = await loadGabaritoForProva(provaFullPath).catch(() => ({ answers: new Map<number, string>(), count: 0 }))
  const numByIdx = new Map(todo.items.map((it) => [it.idx, it.number]))
  if (gabarito.count > 0) console.log(`   📑 gabarito: ${gabarito.count} respostas disponíveis para esta prova`)

  const topics = await db.topic.findMany({ select: { id: true, name: true } })
  const existing = await db.question.findMany({ select: { id: true, statement: true, correctId: true } })
  const hashes = new Map(existing.map((q) => [md5(q.statement), { id: q.id, correctId: q.correctId }]))

  let saved = 0, dup = 0, err = 0, noGab = 0, gabFilled = 0, backfilled = 0
  for (const s of done) {
    try {
      if (!s || !Array.isArray(s.options) || s.options.length < 4 || !s.statement || s.statement.length <= 50) {
        err++; continue
      }
      // Resposta certa: prioriza o gabarito (por número da questão).
      const qNum = numByIdx.get(s.idx)
      const fromGabarito = qNum != null ? gabarito.answers.get(qNum) : undefined

      const hash = md5(s.statement)
      const existingQ = hashes.get(hash)
      if (existingQ) {
        // Já existe: se estava sem resposta e agora o gabarito tem, faz backfill.
        if (!existingQ.correctId && fromGabarito) {
          const opt = await db.questionOption.findFirst({ where: { questionId: existingQ.id, letter: fromGabarito } })
          if (opt) { await db.question.update({ where: { id: existingQ.id }, data: { correctId: opt.id } }); existingQ.correctId = opt.id; backfilled++ }
        }
        dup++; continue
      }
      hashes.set(hash, { id: "", correctId: null })

      if (fromGabarito) { s.correctLetter = fromGabarito; gabFilled++ }

      const topicMatch = topics.find((t) => s.subject?.toLowerCase().includes(t.name.toLowerCase().split(" ")[0]))
      const tags = [String(s.sourceExam ?? "").toLowerCase(), String(s.subject ?? "").toLowerCase()]
      if (!s.correctLetter) tags.push("sem-gabarito")

      const created = await db.question.create({
        data: {
          topicId: topicMatch?.id ?? null,
          source: s.sourceExam ?? "Desconhecido",
          statement: s.statement,
          explanation: "",
          difficulty: ((s.difficulty as string) in Difficulty ? s.difficulty : "MEDIUM") as Difficulty,
          images: [],
          tags,
          options: { create: s.options.map((o, i) => ({ letter: o.letter, text: o.text, order: i + 1 })) },
        },
        include: { options: true },
      })
      if (s.correctLetter) {
        const correct = created.options.find((o) => o.letter === s.correctLetter)
        if (correct) await db.question.update({ where: { id: created.id }, data: { correctId: correct.id } })
      } else noGab++
      saved++
    } catch { err++ }
  }

  // Avança o cursor pelo tamanho do lote entregue (não pelo nº de resultados).
  const prog = state.progress[todo.file] ?? { offset: 0, total: todo.total, done: false }
  prog.offset = todo.offset + todo.items.length
  prog.total = todo.total
  if (prog.offset >= todo.total) { prog.done = true; state.counts.filesDone++ }
  state.progress[todo.file] = prog
  state.counts.saved += saved
  state.counts.duplicates += dup
  state.counts.errors += err
  state.counts.noGabarito += noGab
  saveState(state)

  console.log(`✅  commit: +${saved} salvas (${gabFilled} com gabarito), ${backfilled} respostas preenchidas, ${dup} dup, ${err} erro (arquivo ${prog.done ? "CONCLUÍDO" : `offset ${prog.offset}/${todo.total}`})`)
  console.log(`   Totais: ${state.counts.saved} salvas | ${state.counts.filesDone} arquivos concluídos`)
  await db.$disconnect()
}

// Reserva a próxima prova não-processada/não-reservada e escreve TODO o seu
// conteúdo num arquivo de slot (para processamento paralelo por subagentes).
async function cmdClaim() {
  const state = loadState()
  for (const rel of state.order) {
    if (state.progress[rel]?.done) continue
    if (state.claimed![rel]) continue

    const file = fileByRel(rel)
    if (!file) { state.progress[rel] = { offset: 0, total: 0, done: true }; continue }

    let text: string
    try { text = await extractPdfText(file.fullPath) }
    catch { state.progress[rel] = { offset: 0, total: 0, done: true }; state.counts.filesDone++; saveState(state); continue }

    // Alguns PDFs do INEP têm o texto cifrado (fonte com deslocamento fixo).
    // Decodificar destrói os acentos, então pulamos — quase sempre existe uma
    // cópia legível do mesmo caderno.
    if ((text.match(//g) || []).length > 50) {
      state.progress[rel] = { offset: 0, total: 0, done: true }; state.counts.filesDone++; saveState(state); continue
    }

    const blocks = splitIntoBlocks(text)
    const candidates = blocks.filter((b) => looksLikeQuestion(b.text))
    if (candidates.length === 0) {
      state.progress[rel] = { offset: 0, total: 0, done: true }; state.counts.filesDone++; saveState(state); continue
    }

    // --limit=N fatia a prova em blocos (provas grandes estouram a saída do subagente).
    const prog = state.progress[rel] ?? { offset: 0, total: candidates.length, done: false }
    prog.total = candidates.length
    const start = prog.offset
    const limit = flags["limit"] ? parseInt(flags["limit"] as string, 10) : candidates.length
    const batch = candidates.slice(start, start + limit)
    if (batch.length === 0) {
      prog.done = true; state.progress[rel] = prog; state.counts.filesDone++; saveState(state); continue
    }
    state.progress[rel] = prog
    state.claimed![rel] = true
    saveState(state)
    const items = batch.map((b, k) => ({ idx: start + k, number: b.number, text: b.text.slice(0, 4500) }))
    fs.writeFileSync(todoPath(), JSON.stringify({ file: rel, hint: file.hint, offset: start, total: candidates.length, items }, null, 2))
    console.log(`CLAIMED: ${rel}`)
    console.log(`COUNT: ${items.length} (offset ${start}/${candidates.length})`)
    console.log(`TODO: ${todoPath()}`)
    await db.$disconnect()
    return
  }
  console.log("FILA VAZIA")
  await db.$disconnect()
}

async function cmdSkip() {
  const state = loadState()
  const todo = JSON.parse(fs.readFileSync(TODO_FILE, "utf8")) as { file: string; total: number }
  state.progress[todo.file] = { offset: todo.total, total: todo.total, done: true }
  state.counts.filesDone++
  saveState(state)
  console.log(`⏭️  pulado: ${todo.file}`)
  await db.$disconnect()
}

async function cmdStatus() {
  const state = loadState()
  const totalFiles = state.order.length
  const doneFiles = Object.values(state.progress).filter((p) => p.done).length
  const dbCount = await db.question.count()
  console.log(`📊  Progresso claude-extract`)
  console.log(`   Arquivos: ${doneFiles}/${totalFiles} concluídos`)
  console.log(`   Questões salvas (este pipeline): ${state.counts.saved}`)
  console.log(`   Duplicadas: ${state.counts.duplicates} | Erros: ${state.counts.errors}`)
  console.log(`   Total de questões no banco: ${dbCount}`)
  await db.$disconnect()
}

async function main() {
  if (flags["prepare"]) return cmdPrepare()
  if (flags["next"] !== undefined) return cmdNext()
  if (flags["claim"]) return cmdClaim()
  if (flags["commit"]) return cmdCommit()
  if (flags["skip"]) return cmdSkip()
  if (flags["status"]) return cmdStatus()
  console.error("Passe --prepare | --next=N | --commit | --status")
  await db.$disconnect()
  process.exitCode = 1
}

main().catch((e) => { console.error(e); db.$disconnect(); process.exitCode = 1 })
