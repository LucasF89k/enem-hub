/**
 * scripts/generate-content.ts
 * Gera/ENRIQUECE o conteúdo teórico (Content) dos Topics via MiMo (mimo-v2.5).
 *
 * Resumo detalhado (10-15 min, 1800-2500 palavras) em markdown, com links internos
 * estilo Wikipedia: [[slug-do-topico|texto]] para assuntos correlatos.
 *
 * Idempotente / retomável: pula tópicos que já têm resumo ENRIQUECIDO
 * (>=1700 palavras E com pelo menos um link [[). Reprocessa os curtos/sem link.
 *
 * Por padrão PULA 'filosofia' e 'biologia' (aguardam reestruturação por PDF).
 *
 * Usage:
 *   npx tsx scripts/generate-content.ts --all
 *   npx tsx scripts/generate-content.ts --discipline=quimica
 *   npx tsx scripts/generate-content.ts --all --pro        (usa mimo-v2.5-pro)
 *   npx tsx scripts/generate-content.ts --all --limit=5    (teste)
 */

import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { mimo, MIMO_MODEL, MIMO_MODEL_PRO } from "../src/lib/mimo"

const db = new PrismaClient()

const CONCURRENCY = 4
const MAX_RETRIES = 3
const MIN_ENRICHED_WORDS = 1700
const SKIP_DISCIPLINES = new Set<string>() // Filosofia/Biologia liberados (PDFs recebidos 03/08)

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
const usePro = flags["pro"] === true
const MODEL = usePro ? MIMO_MODEL_PRO : MIMO_MODEL

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
    related.length > 0 ? related.map((r) => `- ${r.slug} — ${r.name}`).join("\n") : "(nenhum)"

  return `Você é professor especialista em ENEM preparando material para candidatos a Medicina. Crie um RESUMO APROFUNDADO (10 a 15 minutos de leitura) para:
Tópico: ${topicName}
Disciplina: ${disciplineName}
Área: ${areaName}

LINKS INTERNOS (estilo Wikipedia): ao mencionar um assunto correlato que esteja na lista abaixo, transforme a palavra/expressão num link usando a sintaxe [[slug|texto exibido]] (ex.: [[funcao-afim|função afim]]). Use APENAS slugs desta lista, e só quando fizer sentido pedagógico (de 2 a 6 links no total, distribuídos no texto). NUNCA invente slugs, NUNCA linke o próprio tópico.
Tópicos relacionados disponíveis para linkar:
${relatedList}

REGRAS DE PRECISÃO (OBRIGATÓRIAS — nunca quebre):
- Use SOMENTE fatos consolidados do currículo do ENEM. NÃO invente NADA.
- NUNCA invente nomes de pessoas, professores, autores, corretores, cursinhos, livros, sites, ferramentas, produtos, datas ou estatísticas.
- NUNCA cite fontes externas nem recomende pessoas/serviços. Se for falar de correção de redação, a referência é o próprio corretor do Mentor (Vion), que avalia pelas 5 competências do ENEM.
- Se não tiver certeza de um dado específico (número, data, nome), escreva de forma geral SEM inventar.
- Fórmulas: escreva em TEXTO SIMPLES (ex.: "velocidade média = distância / tempo"), NUNCA em LaTeX e NUNCA use barras invertidas (\\).

Retorne SOMENTE JSON válido (sem markdown, sem cercas de código):
{
  "summary": string (80 palavras: o que é e por que é importante no ENEM),
  "body": string (markdown com ## e ### para seções, parágrafos bem desenvolvidos, listas e **negrito**; MÍNIMO 1800 palavras (10-15 min); teoria completa, aprofundada e didática, com definições, exemplos resolvidos passo a passo e como o tema cai no ENEM; inclua os links internos [[slug|texto]] naturalmente no meio do texto),
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
    d.body.split(/\s+/).length >= 1200 &&
    Array.isArray(d.keyConcepts) &&
    Array.isArray(d.tips) &&
    Array.isArray(d.formulas) &&
    Array.isArray(d.tricks)
  )
}

const isRate = (e: unknown) =>
  /429|rate.?limit|Too Many Requests|timeout|ECONNRESET|stall/i.test(
    e instanceof Error ? e.message : String(e),
  )

async function callMimo(prompt: string): Promise<string> {
  let lastErr: unknown = null
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const completion = await mimo.chat.completions.create({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 16000,
        temperature: 0.5,
      })
      return completion.choices[0]?.message?.content ?? ""
    } catch (e) {
      lastErr = e
      if (isRate(e)) {
        await sleep(8000 * (attempt + 1))
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
    const raw = (await callMimo(prompt)).trim()
    // Extrai o bloco JSON (do primeiro { ao último }), ignorando cercas/prosa/reasoning.
    const start = raw.indexOf("{")
    const end = raw.lastIndexOf("}")
    const clean = start >= 0 && end > start ? raw.slice(start, end + 1) : raw

    let parsed: unknown
    try {
      parsed = JSON.parse(clean)
    } catch {
      console.error(`  ❌  ${topic.name} — JSON inválido (${raw.length} chars)`)
      return "error"
    }
    if (!isValid(parsed)) {
      console.error(`  ❌  ${topic.name} — formato/idioma/tamanho inesperado`)
      return "error"
    }

    const readTime = Math.max(1, Math.round(parsed.body.split(/\s+/).length / 200))
    const data = {
      title: topic.name,
      summary: parsed.summary,
      body: parsed.body,
      keyConcepts: parsed.keyConcepts,
      tips: parsed.tips,
      formulas: parsed.formulas,
      tricks: parsed.tricks,
      readTime,
    }
    await db.content.upsert({
      where: { topicId: topic.id },
      update: data,
      create: {
        topicId: topic.id,
        slug: topic.slug,
        importance: topic.importance,
        frequency: topic.frequency,
        ...data,
      },
    })
    const words = parsed.body.split(/\s+/).length
    console.log(`  ✅  ${topic.name}  (${words} palavras, ${readTime} min)`)
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
      id: true, slug: true, name: true, importance: true, frequency: true, disciplineId: true,
      discipline: { select: { slug: true, name: true, area: { select: { name: true } } } },
      contents: { select: { body: true }, take: 1 },
    },
    orderBy: [{ importance: "desc" }, { order: "asc" }],
  })

  const pending = topics.filter((t) => {
    // pula disciplinas em espera (salvo se explicitamente pedidas via --discipline)
    if (!disciplineSlug && SKIP_DISCIPLINES.has(t.discipline.slug)) return false
    const body = t.contents[0]?.body ?? ""
    const words = body.trim() ? body.split(/\s+/).length : 0
    const done = words >= MIN_ENRICHED_WORDS && body.includes("[[")
    return !done
  })

  const list = limit ? pending.slice(0, limit) : pending
  if (list.length === 0) {
    console.log("✨  Nada pendente.")
    await db.$disconnect()
    return
  }

  console.log(`📚  ${list.length} tópico(s) — MiMo ${MODEL}, concorrência ${CONCURRENCY}\n`)

  let saved = 0
  let errors = 0
  let idx = 0
  async function worker() {
    while (idx < list.length) {
      const t = list[idx++]
      const r = await generateForTopic(t)
      if (r === "saved") saved++
      else errors++
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))

  console.log("\n" + "─".repeat(50))
  console.log(`✅  Concluído!  gerados: ${saved}   erros: ${errors}`)
  await db.$disconnect()
}

main().catch((err) => {
  console.error(err)
  db.$disconnect()
  process.exit(1)
})
