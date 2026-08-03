/**
 * scripts/classify-flashcards-mimo.ts
 * Classifica flashcards sem tópico (topicId null) no Topic correto via MiMo.
 *
 * Segurança: o modelo só escolhe entre os tópicos QUE JÁ EXISTEM (numerados);
 * se devolver 0/ inválido, o card é marcado "sem-categoria" (não trava o loop) —
 * nunca inventa tópico.
 *
 * Resumável: só pega topicId null e sem a tag "sem-categoria".
 *
 * Usage:
 *   npx tsx scripts/classify-flashcards-mimo.ts --dry-run --limit=40
 *   npx tsx scripts/classify-flashcards-mimo.ts --all
 */

import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { mimo, MIMO_MODEL } from "../src/lib/mimo"

const db = new PrismaClient()

const BATCH = 20
const CONCURRENCY = 4

const argv = process.argv.slice(2)
const flags: Record<string, string | true> = {}
for (const a of argv) {
  if (!a.startsWith("--")) continue
  const [k, v] = a.slice(2).split("=")
  flags[k] = v ?? true
}
const dryRun = flags["dry-run"] === true
const limit = typeof flags["limit"] === "string" ? parseInt(flags["limit"]) : null

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

async function main() {
  const topics = await db.topic.findMany({
    select: { id: true, name: true, discipline: { select: { name: true } } },
    orderBy: [{ discipline: { name: "asc" } }, { name: "asc" }],
  })
  const refList = topics.map((t, i) => `${i + 1}. ${t.discipline?.name ?? "Outros"} > ${t.name}`).join("\n")

  const pendingWhere = { topicId: null, deckId: { not: null }, NOT: { tags: { has: "sem-categoria" } } } as const

  const cards = await db.flashcard.findMany({
    where: pendingWhere,
    select: { id: true, front: true, back: true },
    take: limit ?? undefined,
  })
  console.log(`🗂️   ${cards.length} flashcards — MiMo ${MIMO_MODEL}${dryRun ? "  (DRY-RUN)" : ""}\n`)

  const batches: (typeof cards)[] = []
  for (let i = 0; i < cards.length; i += BATCH) batches.push(cards.slice(i, i + BATCH))

  let classified = 0, uncategorized = 0, idx = 0
  const samples: string[] = []

  async function doBatch(batch: typeof cards) {
    const block = batch
      .map((c, i) => `[${i + 1}] FRENTE: ${stripHtml(c.front).slice(0, 200)} | VERSO: ${stripHtml(c.back).slice(0, 200)}`)
      .join("\n")
    const prompt = `Você classifica flashcards de estudo do ENEM na matéria e conteúdo corretos.

CONTEÚDOS DISPONÍVEIS (número. Matéria > Conteúdo):
${refList}

Analise o ASSUNTO de cada flashcard e escolha o NÚMERO do conteúdo que melhor corresponde. Se realmente nenhum servir, use 0. NUNCA invente número fora da lista.

FLASHCARDS:
${block}

Responda SOMENTE um array JSON: [{"card":1,"topico":<número>}, ...]`

    try {
      const completion = await mimo.chat.completions.create({
        model: MIMO_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 3000,
        temperature: 0,
      })
      const raw = (completion.choices[0]?.message?.content ?? "").trim()
      const s = raw.indexOf("["), e = raw.lastIndexOf("]")
      const arr = JSON.parse(s >= 0 && e > s ? raw.slice(s, e + 1) : raw) as { card: number; topico: number }[]
      const map = new Map(arr.map((a) => [a.card, a.topico]))

      for (let i = 0; i < batch.length; i++) {
        const c = batch[i]
        const num = map.get(i + 1)
        const t = num && num >= 1 ? topics[num - 1] : null
        if (t) {
          classified++
          if (samples.length < 40) samples.push(`  ${t.discipline?.name} > ${t.name}  ←  "${stripHtml(c.front).slice(0, 70)}"`)
          if (!dryRun) await db.flashcard.update({ where: { id: c.id }, data: { topicId: t.id } })
        } else {
          uncategorized++
          if (!dryRun) await db.flashcard.update({ where: { id: c.id }, data: { tags: { set: ["sem-categoria"] } } })
        }
      }
    } catch (err) {
      console.error("  ❌ lote falhou:", err instanceof Error ? err.message.slice(0, 100) : err)
    }
  }

  async function worker() {
    while (idx < batches.length) {
      await doBatch(batches[idx++])
      await sleep(300)
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))

  console.log("\n── Amostra ──\n" + (samples.join("\n") || "  (nenhuma)"))
  console.log("\n" + "─".repeat(50))
  console.log(`${dryRun ? "PROPOSTO" : "APLICADO"} — classificados: ${classified} | sem-categoria: ${uncategorized}`)
  await db.$disconnect()
}

main().catch((e) => { console.error(e); db.$disconnect(); process.exit(1) })
