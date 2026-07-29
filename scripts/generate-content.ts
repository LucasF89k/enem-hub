/**
 * scripts/generate-content.ts
 * Gera conteúdo teórico (Content) para Topics via MiMo (mimo-v2.5-pro).
 * Idempotente: pula tópicos que já têm Content com body preenchido.
 *
 * Usage:
 *   $env:DATABASE_URL="..."; $env:GEMINI_API_KEY="..."; npx tsx scripts/generate-content.ts --area=ciencias-natureza --limit=5
 *   npx tsx scripts/generate-content.ts --discipline=biologia
 *   npx tsx scripts/generate-content.ts --all
 */

import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { mimo, MIMO_MODEL_PRO } from "../src/lib/mimo"

const db = new PrismaClient()

const BATCH_SIZE = 3
const BATCH_DELAY_MS = 10_000

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

interface GeneratedContent {
  summary: string
  body: string
  keyConcepts: string[]
  tips: string[]
  formulas: string[]
  tricks: string[]
}

function buildPrompt(
  topicName: string,
  disciplineName: string,
  areaName: string,
  related: { slug: string; name: string }[],
): string {
  const relatedList =
    related.length > 0
      ? related.map((r) => `- ${r.slug} — ${r.name}`).join("\n")
      : "(nenhum)"

  return `Você é professor especialista em ENEM preparando material para candidatos a Medicina. Crie um RESUMO APROFUNDADO (10 a 15 minutos de leitura) para:
Tópico: ${topicName}
Disciplina: ${disciplineName}
Área: ${areaName}

LINKS INTERNOS (estilo Wikipedia): ao mencionar um assunto correlato que esteja na lista abaixo, transforme a palavra num link usando a sintaxe [[slug|texto exibido]] (ex.: [[funcao-afim|função afim]]). Use APENAS slugs desta lista, e só quando fizer sentido pedagógico (2 a 6 links no total). NUNCA invente slugs.
Tópicos relacionados disponíveis para linkar:
${relatedList}

Retorne SOMENTE JSON (sem markdown, sem explicação):
{
  "summary": string (80 palavras: o que é e por que é importante no ENEM),
  "body": string (markdown com ## e ### para seções, parágrafos, listas e **negrito**; 1800 a 2500 palavras; teoria completa, aprofundada e didática, com exemplos e aplicação no ENEM; inclua os links internos [[slug|texto]] no meio do texto),
  "keyConcepts": string[] (6 a 8 conceitos-chave, frases de até 8 palavras),
  "tips": string[] (4 a 6 dicas de como este tema aparece no ENEM),
  "formulas": string[] (fórmulas em texto simples, vazio se não houver),
  "tricks": string[] (3 a 5 macetes e pegadinhas comuns na prova)
}`
}

function isValidGeneratedContent(data: unknown): data is GeneratedContent {
  if (!data || typeof data !== "object") return false
  const d = data as Record<string, unknown>
  return (
    typeof d.summary === "string" &&
    typeof d.body === "string" &&
    Array.isArray(d.keyConcepts) &&
    Array.isArray(d.tips) &&
    Array.isArray(d.formulas) &&
    Array.isArray(d.tricks)
  )
}

async function generateForTopic(topic: {
  id: string
  slug: string
  name: string
  importance: number
  frequency: number
  disciplineId: string
  discipline: { name: string; area: { name: string } }
}): Promise<"saved" | "error"> {
  try {
    // Tópicos irmãos (mesma disciplina) — candidatos a link interno estilo wiki
    const related = await db.topic.findMany({
      where: { disciplineId: topic.disciplineId, id: { not: topic.id } },
      select: { slug: true, name: true },
      orderBy: { order: "asc" },
      take: 40,
    })
    const prompt = buildPrompt(
      topic.name,
      topic.discipline.name,
      topic.discipline.area.name,
      related,
    )
    const completion = await mimo.chat.completions.create({
      model: MIMO_MODEL_PRO,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 8192,
      temperature: 0.5,
    })
    const raw = (completion.choices[0]?.message?.content ?? "").trim()
    const clean = raw.replace(/^```json\n?/m, "").replace(/^```\n?/m, "").replace(/\n?```$/m, "").trim()

    let parsed: unknown
    try {
      parsed = JSON.parse(clean)
    } catch (err) {
      console.error(`  ❌  ${topic.name} — falha ao parsear JSON: ${err}`)
      return "error"
    }

    if (!isValidGeneratedContent(parsed)) {
      console.error(`  ❌  ${topic.name} — JSON com formato inesperado`)
      return "error"
    }

    const readTime = Math.max(1, Math.round(parsed.body.split(/\s+/).length / 200))

    await db.content.upsert({
      where: { topicId: topic.id },
      update: {
        title: topic.name,
        summary: parsed.summary,
        body: parsed.body,
        keyConcepts: parsed.keyConcepts,
        tips: parsed.tips,
        formulas: parsed.formulas,
        tricks: parsed.tricks,
        readTime,
      },
      create: {
        topicId: topic.id,
        title: topic.name,
        slug: topic.slug,
        summary: parsed.summary,
        body: parsed.body,
        keyConcepts: parsed.keyConcepts,
        tips: parsed.tips,
        formulas: parsed.formulas,
        tricks: parsed.tricks,
        importance: topic.importance,
        frequency: topic.frequency,
        readTime,
      },
    })

    console.log(`  ✅  ${topic.name}`)
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

  const topics = await db.topic.findMany({
    where: {
      ...where,
      contents: { none: { body: { not: "" } } },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      importance: true,
      frequency: true,
      disciplineId: true,
      discipline: { select: { name: true, area: { select: { name: true } } } },
    },
    orderBy: { order: "asc" },
    take: limit ?? undefined,
  })

  if (topics.length === 0) {
    console.log("Nenhum tópico pendente encontrado (todos já têm Content, ou filtro não bateu).")
    await db.$disconnect()
    return
  }

  console.log(`📚  ${topics.length} tópicos sem conteúdo — gerando em lotes de ${BATCH_SIZE}\n`)

  let totalSaved = 0
  let totalErrors = 0

  for (let i = 0; i < topics.length; i += BATCH_SIZE) {
    const batch = topics.slice(i, i + BATCH_SIZE)
    console.log(`Lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(topics.length / BATCH_SIZE)}: ${batch.map((t) => t.name).join(", ")}`)

    const results = await Promise.all(batch.map((t) => generateForTopic(t)))
    totalSaved += results.filter((r) => r === "saved").length
    totalErrors += results.filter((r) => r === "error").length

    const isLastBatch = i + BATCH_SIZE >= topics.length
    if (!isLastBatch) await sleep(BATCH_DELAY_MS)
  }

  console.log("\n" + "─".repeat(50))
  console.log(`✅  Concluído!`)
  console.log(`   Conteúdo gerado: ${totalSaved}`)
  console.log(`   Erros:           ${totalErrors}`)

  await db.$disconnect()
}

main().catch((err) => {
  console.error(err)
  db.$disconnect()
  process.exit(1)
})
