/**
 * scripts/generate-content.ts
 * Gera/ENRIQUECE o conteúdo teórico (Content) dos Topics via GEMINI (gemini-2.0-flash).
 *
 * Regra do projeto: o Mentor usa MiMo; o Gemini fica livre para ESTA tarefa de
 * geração de conteúdo em massa (autorizado pelo usuário). NÃO usa MiMo aqui.
 *
 * Resumo detalhado (10-15 min, 1800-2500 palavras) em markdown, com links internos
 * estilo Wikipedia: [[slug-do-topico|texto]] para assuntos correlatos.
 *
 * Idempotente / retomável:
 *  - padrão: pula tópicos que já têm um resumo ENRIQUECIDO (longo e com links).
 *  - reprocessa automaticamente os que ainda estão curtos ou sem links.
 *
 * Usage:
 *   npx tsx scripts/generate-content.ts --all
 *   npx tsx scripts/generate-content.ts --area=matematica --limit=10
 *   npx tsx scripts/generate-content.ts --discipline=biologia
 *   npx tsx scripts/generate-content.ts --topic-id=xxx --force
 */

import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { geminiKeys } from "../src/lib/gemini"

const db = new PrismaClient()

const REQUEST_DELAY_MS = 4500 // ~13 req/min — respeita o free tier do Gemini
const MAX_RETRIES = 4
const MODEL = "gemini-2.0-flash"

// Marcadores de "já enriquecido": resumo longo E com pelo menos um link wiki.
const MIN_ENRICHED_CHARS = 4500

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
const force = flags["force"] === true // regera mesmo os já enriquecidos

if (!all && !areaSlug && !disciplineSlug && !topicId) {
  console.error("❌  Passe --all, --area=SLUG, --discipline=SLUG ou --topic-id=ID")
  process.exit(1)
}

const KEYS = geminiKeys()
if (KEYS.length === 0) {
  console.error("❌  Nenhuma chave do Gemini (GEMINI_API_KEYS ou GEMINI_API_KEY).")
  process.exit(1)
}
let keyIdx = 0

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
    related.length > 0 ? related.map((r) => `- ${r.slug} — ${r.name}`).join("\n") : "(nenhum)"

  return `Você é professor especialista em ENEM preparando material para candidatos a Medicina. Crie um RESUMO APROFUNDADO (10 a 15 minutos de leitura) para:
Tópico: ${topicName}
Disciplina: ${disciplineName}
Área: ${areaName}

LINKS INTERNOS (estilo Wikipedia): ao mencionar um assunto correlato que esteja na lista abaixo, transforme a palavra/expressão num link usando a sintaxe [[slug|texto exibido]] (ex.: [[funcao-afim|função afim]]). Use APENAS slugs desta lista, e só quando fizer sentido pedagógico (de 2 a 6 links no total, distribuídos no texto). NUNCA invente slugs.
Tópicos relacionados disponíveis para linkar:
${relatedList}

Retorne SOMENTE JSON válido (sem markdown, sem cercas de código):
{
  "summary": string (80 palavras: o que é e por que é importante no ENEM),
  "body": string (markdown com ## e ### para seções, parágrafos bem desenvolvidos, listas e **negrito**; 1800 a 2500 palavras; teoria completa, aprofundada e didática, com definições, exemplos resolvidos e como o tema aparece no ENEM; inclua os links internos [[slug|texto]] naturalmente no meio do texto),
  "keyConcepts": string[] (6 a 8 conceitos-chave, frases de até 8 palavras),
  "tips": string[] (4 a 6 dicas de como este tema aparece no ENEM),
  "formulas": string[] (fórmulas em texto simples, vazio se não houver),
  "tricks": string[] (3 a 5 macetes e pegadinhas comuns na prova)
}`
}

function isValid(data: unknown): data is GeneratedContent {
  if (!data || typeof data !== "object") return false
  const d = data as Record<string, unknown>
  return (
    typeof d.summary === "string" &&
    typeof d.body === "string" &&
    d.body.length > 400 &&
    Array.isArray(d.keyConcepts) &&
    Array.isArray(d.tips) &&
    Array.isArray(d.formulas) &&
    Array.isArray(d.tricks)
  )
}

const isQuota = (e: unknown) =>
  /429|quota|rate.?limit|RESOURCE_EXHAUSTED|Too Many Requests/i.test(
    e instanceof Error ? e.message : String(e),
  )

/** Chama o Gemini com rotação de chave + backoff em 429. */
async function callGemini(prompt: string): Promise<string> {
  let lastErr: unknown = null
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const key = KEYS[keyIdx % KEYS.length]
    try {
      const client = new GoogleGenerativeAI(key)
      const model = client.getGenerativeModel({
        model: MODEL,
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      })
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (e) {
      lastErr = e
      if (isQuota(e)) {
        keyIdx++ // tenta a próxima chave
        const wait = 15_000 * (attempt + 1)
        console.log(`    ⏳  cota atingida — aguardando ${wait / 1000}s e tentando de novo…`)
        await sleep(wait)
        continue
      }
      throw e
    }
  }
  throw lastErr ?? new Error("Falha após retries")
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
    const related = await db.topic.findMany({
      where: { disciplineId: topic.disciplineId, id: { not: topic.id } },
      select: { slug: true, name: true },
      orderBy: { order: "asc" },
      take: 40,
    })
    const prompt = buildPrompt(topic.name, topic.discipline.name, topic.discipline.area.name, related)

    const raw = (await callGemini(prompt)).trim()
    const clean = raw
      .replace(/^```json\n?/m, "")
      .replace(/^```\n?/m, "")
      .replace(/\n?```$/m, "")
      .trim()

    let parsed: unknown
    try {
      parsed = JSON.parse(clean)
    } catch {
      console.error(`  ❌  ${topic.name} — JSON inválido`)
      return "error"
    }
    if (!isValid(parsed)) {
      console.error(`  ❌  ${topic.name} — formato inesperado`)
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

    console.log(`  ✅  ${topic.name}  (${readTime} min, ${parsed.body.length} chars)`)
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
    where,
    select: {
      id: true,
      slug: true,
      name: true,
      importance: true,
      frequency: true,
      disciplineId: true,
      discipline: { select: { name: true, area: { select: { name: true } } } },
      contents: { select: { body: true }, take: 1 },
    },
    orderBy: [{ importance: "desc" }, { order: "asc" }],
  })

  // Filtra os que precisam de enriquecimento (a menos que --force)
  const pending = topics.filter((t) => {
    if (force) return true
    const body = t.contents[0]?.body ?? ""
    const enriched = body.length >= MIN_ENRICHED_CHARS && body.includes("[[")
    return !enriched
  })

  const list = limit ? pending.slice(0, limit) : pending

  if (list.length === 0) {
    console.log("✨  Nada pendente — todos já estão enriquecidos (ou o filtro não bateu).")
    await db.$disconnect()
    return
  }

  console.log(
    `📚  ${list.length} tópico(s) para enriquecer (de ${topics.length} no filtro) — Gemini ${MODEL}\n`,
  )

  let saved = 0
  let errors = 0
  for (let i = 0; i < list.length; i++) {
    const t = list[i]
    process.stdout.write(`[${i + 1}/${list.length}] ${t.name} … `)
    const r = await generateForTopic(t)
    if (r === "saved") saved++
    else errors++
    if (i < list.length - 1) await sleep(REQUEST_DELAY_MS)
  }

  console.log("\n" + "─".repeat(50))
  console.log(`✅  Concluído!  gerados: ${saved}   erros: ${errors}`)
  await db.$disconnect()
}

main().catch((err) => {
  console.error(err)
  db.$disconnect()
  process.exit(1)
})
