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
  options: { letter: string; text: string }[]
  correct: string
  imageUrl: string
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
    if (!it.number || !it.statement || !Array.isArray(it.options) || it.options.length < 4) { skip++; continue }
    const exists = await db.question.findFirst({ where: { year, source, number: it.number }, select: { id: true } })
    if (exists) { skip++; continue }

    const opts = it.options
      .filter((o) => o.letter && o.text)
      .map((o, i) => ({ letter: o.letter.toUpperCase(), text: o.text, order: i }))
    if (opts.length < 4) { skip++; continue }

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
