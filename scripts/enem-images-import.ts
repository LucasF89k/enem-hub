/**
 * scripts/enem-images-import.ts
 * Insere as questões de imagem extraídas (out-YYYY.json) como Question+QuestionOption.
 * Dedup por (year, number). areaSlug pelo número da questão do ENEM.
 * Uso: npx tsx scripts/enem-images-import.ts <caminho out-YYYY.json> <ano>
 */
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { readFileSync } from "node:fs"

const db = new PrismaClient()

interface Item {
  number: number
  statement: string
  options: { letter: string; text: string }[] | Record<string, string>
  correct: string
  imageUrl: string
}

/** Aceita options como array [{letter,text}] OU objeto {A:"...",B:"..."}. */
function normOptions(opts: Item["options"]): { letter: string; text: string }[] {
  if (Array.isArray(opts)) {
    return opts
      .filter((o) => o && o.letter && o.text)
      .map((o) => ({ letter: String(o.letter).toUpperCase().trim(), text: String(o.text) }))
  }
  if (opts && typeof opts === "object") {
    return Object.entries(opts)
      .filter(([k, v]) => k && v)
      .map(([k, v]) => ({ letter: String(k).toUpperCase().trim(), text: String(v) }))
  }
  return []
}

function areaFromNumber(n: number): string {
  if (n <= 45) return "linguagens"
  if (n <= 90) return "ciencias-humanas"
  if (n <= 135) return "ciencias-natureza"
  return "matematica"
}

async function main() {
  const file = process.argv[2]
  const year = parseInt(process.argv[3] ?? "0")
  if (!file || !year) {
    console.error("Uso: npx tsx scripts/enem-images-import.ts <out.json> <ano>")
    process.exit(1)
  }
  const items = JSON.parse(readFileSync(file, "utf8")) as Item[]
  const source = `ENEM ${year}`

  let ok = 0, skip = 0
  for (const it of items) {
    const normalized = normOptions(it.options)
    if (!it.number || !it.statement || normalized.length < 4) { skip++; continue }
    const exists = await db.question.findFirst({ where: { year, source, number: it.number }, select: { id: true } })
    if (exists) { skip++; continue }

    const opts = normalized.map((o, i) => ({ letter: o.letter, text: o.text, order: i }))

    const q = await db.question.create({
      data: {
        source, year, number: it.number, areaSlug: areaFromNumber(it.number),
        statement: it.statement, images: it.imageUrl ? [it.imageUrl] : [],
        explanation: "", difficulty: "MEDIUM", tags: ["imagem", "enem"],
        options: { create: opts },
      },
      include: { options: true },
    })
    const correct = q.options.find((o) => o.letter === (it.correct || "").toUpperCase())
    if (correct) await db.question.update({ where: { id: q.id }, data: { correctId: correct.id } })
    ok++
  }
  console.log(`✅ Inseridas: ${ok} | puladas: ${skip}`)
  await db.$disconnect()
}
main().catch((e) => { console.error(e); db.$disconnect(); process.exit(1) })
