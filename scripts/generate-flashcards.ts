/**
 * scripts/generate-flashcards.ts
 * Gera flashcards (Flashcard) para Topics que já têm Content mas têm menos de 8 cards.
 * Idempotente: recontabiliza flashcards existentes a cada execução e evita duplicar
 * cards com front semelhante (similaridade de tokens).
 *
 * Usage:
 *   npx tsx scripts/generate-flashcards.ts --area=ciencias-natureza --limit=5
 *   npx tsx scripts/generate-flashcards.ts --discipline=biologia
 *   npx tsx scripts/generate-flashcards.ts --all
 */

import "dotenv/config"
import { PrismaClient, FlashcardType } from "@prisma/client"
import { generateMimoJSON } from "../src/lib/mimo"

const db = new PrismaClient()

const BATCH_SIZE = 3
const BATCH_DELAY_MS = 10_000
const MAX_TOKENS = 6144 // folga extra vs. Sessão 19 — array de 10 cards trunca fácil em 4096
const MIN_FLASHCARDS = 8
const DEDUP_THRESHOLD = 0.6

// ── CLI flags ─────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
const flags: Record<string, string | true> = {}
for (const a of argv) {
  if (!a.startsWith("--")) continue
  const [k, v] = a.slice(2).split("=")
  flags[k] = v ?? true
}

const areaSlug = typeof flags["area"] === "string" ? flags["area"] : null
const disciplineSlug = typeof flags["discipline"] === "string" ? flags["discipline"] : null
const topicId = typeof flags["topic-id"] === "string" ? flags["topic-id"] : null
const limit = typeof flags["limit"] === "string" ? parseInt(flags["limit"]) : null
const all = flags["all"] === true

if (!all && !areaSlug && !disciplineSlug && !topicId) {
  console.error("❌  Passe --all, --area=SLUG, --discipline=SLUG ou --topic-id=ID")
  process.exit(1)
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

interface GeneratedFlashcard {
  front: string
  back: string
  type: "BASIC" | "CLOZE" | "FORMULA"
}

function buildPrompt(topicName: string, summary: string, formulas: string[]): string {
  const hasFormulas = formulas.length > 0
  return `Você é professor especialista em ENEM criando flashcards de revisão espaçada (estilo Anki) para candidatos a Medicina.
Tópico: ${topicName}
Resumo do conteúdo: ${summary}
${hasFormulas ? `Fórmulas do tópico: ${formulas.join(" | ")}` : "Este tópico não tem fórmulas relevantes."}

Crie exatamente 10 flashcards em português, cobrindo os pontos mais cobrados no ENEM:
- 4 do tipo BASIC: frente é uma pergunta direta e objetiva, verso é a resposta completa mas concisa.
- 4 do tipo CLOZE: frente é uma frase afirmativa com uma lacuna marcada como {{termo}}, verso é apenas o termo que completa a lacuna.
- 2 do tipo ${hasFormulas ? "FORMULA: frente pergunta quando/como usar uma fórmula específica, verso traz a fórmula em texto simples" : "BASIC adicionais, com perguntas de aplicação prática do tema"}.

Retorne SOMENTE um array JSON, sem markdown, sem explicação:
[{"front": string, "back": string, "type": "BASIC" | "CLOZE" | "FORMULA"}]`
}

function isValidFlashcards(data: unknown): data is GeneratedFlashcard[] {
  if (!Array.isArray(data) || data.length === 0) return false
  return data.every((c) => {
    if (!c || typeof c !== "object") return false
    const d = c as Record<string, unknown>
    return (
      typeof d.front === "string" &&
      typeof d.back === "string" &&
      typeof d.type === "string" &&
      ["BASIC", "CLOZE", "FORMULA"].includes(d.type)
    )
  })
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\w\s]/g, "")
    .trim()
}

function tokenSet(s: string): Set<string> {
  return new Set(normalize(s).split(/\s+/).filter(Boolean))
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let intersection = 0
  for (const t of a) if (b.has(t)) intersection++
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

interface TopicCandidate {
  id: string
  name: string
  content: { id: string; summary: string; formulas: string[] } | null
  existingFronts: string[]
}

async function generateForTopic(topic: TopicCandidate): Promise<"saved" | "error" | "skipped"> {
  if (!topic.content) {
    console.error(`  ⏭️  ${topic.name} — sem Content, pulando`)
    return "skipped"
  }

  try {
    const prompt = buildPrompt(topic.name, topic.content.summary, topic.content.formulas)
    const cards = await generateMimoJSON<GeneratedFlashcard[]>(prompt, MAX_TOKENS)

    if (!isValidFlashcards(cards)) {
      console.error(`  ❌  ${topic.name} — JSON com formato inesperado`)
      return "error"
    }

    const existingTokenSets = topic.existingFronts.map(tokenSet)
    let created = 0

    for (const card of cards) {
      const candidateTokens = tokenSet(card.front)
      const isDuplicate = existingTokenSets.some((e) => jaccard(e, candidateTokens) >= DEDUP_THRESHOLD)
      if (isDuplicate) continue

      await db.flashcard.create({
        data: {
          topicId: topic.id,
          contentId: topic.content.id,
          front: card.front,
          back: card.back,
          type: card.type as FlashcardType,
          tags: [topic.name],
        },
      })
      existingTokenSets.push(candidateTokens)
      created++
    }

    console.log(`  ✅  ${topic.name} — ${created} cards novos (${cards.length - created} duplicados ignorados)`)
    return "saved"
  } catch (err) {
    console.error(`  ❌  ${topic.name} — erro: ${err}`)
    return "error"
  }
}

async function main() {
  const where: Record<string, unknown> = {}
  if (topicId) where.id = topicId
  if (disciplineSlug) where.discipline = { slug: disciplineSlug }
  if (areaSlug) where.discipline = { area: { slug: areaSlug } }

  const candidates = await db.topic.findMany({
    where: {
      ...where,
      contents: { some: { body: { not: "" } } },
    },
    select: {
      id: true,
      name: true,
      contents: {
        where: { body: { not: "" } },
        select: { id: true, summary: true, formulas: true },
        take: 1,
      },
      flashcards: { select: { front: true } },
    },
    orderBy: { order: "asc" },
  })

  const pending: TopicCandidate[] = candidates
    .filter((t) => t.flashcards.length < MIN_FLASHCARDS)
    .map((t) => ({
      id: t.id,
      name: t.name,
      content: t.contents[0] ?? null,
      existingFronts: t.flashcards.map((f) => f.front),
    }))
    .slice(0, limit ?? undefined)

  if (pending.length === 0) {
    console.log("Nenhum tópico pendente encontrado (todos já têm 8+ flashcards, ou filtro não bateu).")
    await db.$disconnect()
    return
  }

  console.log(`🃏  ${pending.length} tópicos com menos de ${MIN_FLASHCARDS} flashcards — gerando em lotes de ${BATCH_SIZE}\n`)

  let totalSaved = 0
  let totalErrors = 0
  let totalSkipped = 0

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE)
    console.log(`Lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(pending.length / BATCH_SIZE)}: ${batch.map((t) => t.name).join(", ")}`)

    const results = await Promise.all(batch.map((t) => generateForTopic(t)))
    totalSaved += results.filter((r) => r === "saved").length
    totalErrors += results.filter((r) => r === "error").length
    totalSkipped += results.filter((r) => r === "skipped").length

    const isLastBatch = i + BATCH_SIZE >= pending.length
    if (!isLastBatch) await sleep(BATCH_DELAY_MS)
  }

  console.log("\n" + "─".repeat(50))
  console.log(`✅  Concluído!`)
  console.log(`   Tópicos processados: ${totalSaved}`)
  console.log(`   Erros:               ${totalErrors}`)
  console.log(`   Pulados (sem Content): ${totalSkipped}`)

  await db.$disconnect()
}

main().catch((err) => {
  console.error(err)
  db.$disconnect()
  process.exit(1)
})
