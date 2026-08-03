/**
 * scripts/reclassify-questions.ts
 * Reclassifica questões no TÓPICO correto via MiMo (mimo-v2.5).
 *
 * Classifica pelo ASSUNTO/HABILIDADE cobrado (não pelo tema do texto). Ex.: um
 * texto sobre ecologia que cobra "variedade linguística" é Língua Portuguesa.
 *
 * Segurança: o modelo só pode escolher entre os slugs de tópico QUE JÁ EXISTEM
 * (validado); se devolver algo fora da lista ou "null", a questão NÃO é alterada.
 *
 * Usage:
 *   npx tsx scripts/reclassify-questions.ts --dry-run --limit=40   (mostra de→para, não grava)
 *   npx tsx scripts/reclassify-questions.ts --all                  (aplica em tudo)
 *   npx tsx scripts/reclassify-questions.ts --area=ciencias-natureza
 */

import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { mimo, MIMO_MODEL } from "../src/lib/mimo"

const db = new PrismaClient()

const BATCH = 6
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
const areaFilter = typeof flags["area"] === "string" ? flags["area"] : null

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

interface Topic {
  slug: string
  name: string
  disc: string
  area: string
}

async function main() {
  // Taxonomia oficial (só estes slugs são aceitos)
  const topicsRaw = await db.topic.findMany({
    select: {
      slug: true, name: true,
      discipline: { select: { name: true, area: { select: { slug: true, name: true } } } },
    },
    orderBy: { order: "asc" },
  })
  const topics: Topic[] = topicsRaw.map((t) => ({
    slug: t.slug, name: t.name, disc: t.discipline.name, area: t.discipline.area.slug,
  }))
  const bySlug = new Map(topics.map((t) => [t.slug, t]))

  // Lista compacta para o prompt, agrupada por área/disciplina
  const areasMap = new Map<string, Map<string, Topic[]>>()
  for (const t of topics) {
    if (!areasMap.has(t.area)) areasMap.set(t.area, new Map())
    const dmap = areasMap.get(t.area)!
    if (!dmap.has(t.disc)) dmap.set(t.disc, [])
    dmap.get(t.disc)!.push(t)
  }
  let taxonomy = ""
  for (const [area, dmap] of areasMap) {
    taxonomy += `\n# ${area}\n`
    for (const [disc, ts] of dmap) {
      taxonomy += `  ${disc}:\n`
      for (const t of ts) taxonomy += `    ${t.slug} — ${t.name}\n`
    }
  }

  const where = areaFilter ? { areaSlug: areaFilter } : {}
  const questions = await db.question.findMany({
    where,
    select: {
      id: true, statement: true, areaSlug: true, topicId: true,
      topic: { select: { slug: true, name: true } },
      options: { select: { letter: true, text: true }, orderBy: { order: "asc" } },
    },
    orderBy: { createdAt: "asc" },
    take: limit ?? undefined,
  })

  console.log(`🔎  ${questions.length} questões — MiMo ${MIMO_MODEL}${dryRun ? "  (DRY-RUN, não grava)" : ""}\n`)

  const batches: (typeof questions)[] = []
  for (let i = 0; i < questions.length; i += BATCH) batches.push(questions.slice(i, i + BATCH))

  let changed = 0, kept = 0, invalid = 0, idx = 0
  let okBatches = 0, failBatches = 0
  let aborted = false
  const samples: string[] = []

  async function classifyBatch(batch: typeof questions) {
    const qList = batch
      .map((q, i) => {
        const opts = q.options.map((o) => `${o.letter}) ${o.text}`).join(" ")
        return `#${i} id=${q.id}\nENUNCIADO: ${q.statement.slice(0, 700)}\nALTERNATIVAS: ${opts.slice(0, 400)}`
      })
      .join("\n---\n")

    const prompt = `Você classifica questões do ENEM no TÓPICO correto. Use SOMENTE os slugs da lista oficial abaixo.
Classifique pelo ASSUNTO/HABILIDADE que a questão cobra — NÃO pelo tema do texto. Ex.: um texto sobre ecologia que pergunta sobre "variedade linguística" é de Língua Portuguesa, não de Biologia.
Se não tiver certeza, use "null" (a questão não será alterada). NUNCA invente slug.

LISTA OFICIAL DE TÓPICOS:
${taxonomy}

QUESTÕES:
${qList}

Responda SOMENTE um array JSON, um item por questão, na ordem: [{"id":"<id>","topic":"<slug-ou-null>"}]`

    try {
      const completion = await mimo.chat.completions.create({
        model: MIMO_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 16000, // alto: o modelo raciocina antes; senão o JSON sai vazio/cortado
        temperature: 0,
      })
      const raw = (completion.choices[0]?.message?.content ?? "").trim()
      const s = raw.indexOf("["), e = raw.lastIndexOf("]")
      const arr = JSON.parse(s >= 0 && e > s ? raw.slice(s, e + 1) : raw) as { id: string; topic: string }[]
      const map = new Map(arr.map((a) => [a.id, a.topic]))

      for (const q of batch) {
        const proposed = map.get(q.id)
        if (!proposed || proposed === "null" || proposed === q.topic?.slug) { kept++; continue }
        const t = bySlug.get(proposed)
        if (!t) { invalid++; continue }
        changed++
        if (samples.length < 60) {
          samples.push(`  ${q.topic?.name ?? "(sem tópico)"}  →  ${t.name} [${t.area}]\n    "${q.statement.slice(0, 90)}…"`)
        }
        if (!dryRun) {
          await db.question.update({
            where: { id: q.id },
            data: { topicId: (await db.topic.findUnique({ where: { slug: proposed }, select: { id: true } }))!.id, areaSlug: t.area },
          })
        }
      }
      okBatches++
    } catch (err) {
      failBatches++
      console.error("  ❌ lote falhou:", err instanceof Error ? err.message.slice(0, 120) : err)
    }
  }

  async function worker() {
    while (idx < batches.length && !aborted) {
      // Disjuntor: se falhar muito no começo (sem nenhum sucesso), aborta pra não gastar tokens à toa.
      if (!aborted && failBatches >= 12 && okBatches === 0) {
        aborted = true
        console.error("\n🛑  ABORTADO: muitos lotes falhando sem sucesso — não vou gastar mais tokens. Verifique o script/saldo.")
        break
      }
      const b = batches[idx++]
      await classifyBatch(b)
      await sleep(300)
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))
  if (aborted) { await db.$disconnect(); process.exit(1) }

  console.log("\n── Amostra de mudanças (de → para) ──")
  console.log(samples.join("\n") || "  (nenhuma mudança proposta)")
  console.log("\n" + "─".repeat(50))
  console.log(`${dryRun ? "PROPOSTO" : "APLICADO"} — mudariam: ${changed} | mantidas: ${kept} | inválidas(ignoradas): ${invalid}`)
  await db.$disconnect()
}

main().catch((e) => { console.error(e); db.$disconnect(); process.exit(1) })
