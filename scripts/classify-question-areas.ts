/**
 * Preenche areaSlug de questões sem área, lendo o enunciado e classificando
 * em uma das 4 áreas do ENEM. Conserta a distribuição por dia dos simulados.
 * Resumível (só pega areaSlug null). Uso: npx tsx scripts/classify-question-areas.ts
 */
import { PrismaClient } from "@prisma/client"
import { generateJSON } from "../src/lib/gemini"

const db = new PrismaClient()

const AREAS = [
  { slug: "linguagens", label: "Linguagens e Códigos (português, literatura, interpretação, inglês/espanhol, artes, ed. física)" },
  { slug: "ciencias-humanas", label: "Ciências Humanas (história, geografia, filosofia, sociologia)" },
  { slug: "ciencias-natureza", label: "Ciências da Natureza (física, química, biologia)" },
  { slug: "matematica", label: "Matemática" },
]
const VALID = new Set(AREAS.map((a) => a.slug))

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

async function main() {
  const where = { areaSlug: null } as const
  const total = await db.question.count({ where })
  console.log(`🗂️   ${total} questões sem área\n`)

  const areasBlock = AREAS.map((a, i) => `${i + 1}. ${a.slug} → ${a.label}`).join("\n")
  let processed = 0
  let lastKey = ""
  let fails = 0

  while (true) {
    const qs = await db.question.findMany({
      where,
      select: { id: true, statement: true },
      take: 20,
    })
    if (qs.length === 0) break

    const key = qs[0].id
    if (key !== lastKey) {
      lastKey = key
      fails = 0
    }

    const block = qs
      .map((q, i) => `[${i + 1}] ${stripHtml(q.statement).slice(0, 300)}`)
      .join("\n")

    const prompt = `Classifique cada questão do ENEM abaixo em UMA das 4 áreas (use o slug):
${areasBlock}

QUESTÕES:
${block}

Responda SOMENTE um array JSON: [{"q":1,"area":"<slug>"}, {"q":2,"area":"<slug>"}]`

    let result: { q: number; area: string }[]
    try {
      result = await generateJSON<{ q: number; area: string }[]>(prompt)
      if (!Array.isArray(result)) throw new Error("não é array")
    } catch (e) {
      const msg = (e as Error).message
      const isQuota = /429|quota|rate|exhaust|resource/i.test(msg)
      fails++
      // Se o MESMO lote falhar muitas vezes seguidas, para (é resumível: re-rode depois).
      if (fails >= 8) {
        console.log("🛑  lote travado após 8 tentativas — parando (rode de novo depois).")
        break
      }
      const wait = isQuota ? 60 : 6
      console.log(`⚠️  ${isQuota ? "cota" : "parse"} (${msg.slice(0, 50)}) — ${wait}s`)
      await new Promise((r) => setTimeout(r, wait * 1000))
      continue
    }

    const updates: Promise<unknown>[] = []
    for (const r of result) {
      const q = qs[r.q - 1]
      if (q && VALID.has(r.area)) {
        updates.push(db.question.update({ where: { id: q.id }, data: { areaSlug: r.area } }))
      }
    }
    await Promise.all(updates)
    processed += qs.length
    console.log(`[${processed}/${total}] lote de ${qs.length} classificado`)
    await new Promise((r) => setTimeout(r, 1200))
  }

  console.log(`\n✅  Concluído. Questões ainda sem área: ${await db.question.count({ where })}`)
  await db.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await db.$disconnect()
  process.exit(1)
})
