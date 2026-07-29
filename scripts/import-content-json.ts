/**
 * scripts/import-content-json.ts
 * Importa/atualiza o conteúdo teórico (Content) a partir de um arquivo JSON.
 *
 * Usado pelos SUBAGENTES do Claude (conteúdo escrito à mão pela IA, sem API paga).
 *
 * Formato do arquivo (array):
 * [
 *   {
 *     "topicId": "cuid",
 *     "slug": "slug-do-topico",
 *     "summary": "…",
 *     "body": "markdown com [[slug|texto]] …",
 *     "keyConcepts": ["…"],
 *     "tips": ["…"],
 *     "formulas": ["…"],
 *     "tricks": ["…"]
 *   }
 * ]
 *
 * Usage: npx tsx scripts/import-content-json.ts caminho/para/arquivo.json
 */

import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { readFileSync } from "node:fs"

const db = new PrismaClient()

interface Item {
  topicId: string
  slug?: string
  summary: string
  body: string
  keyConcepts?: string[]
  tips?: string[]
  formulas?: string[]
  tricks?: string[]
}

async function main() {
  const file = process.argv[2]
  if (!file) {
    console.error("❌  Passe o caminho do JSON: npx tsx scripts/import-content-json.ts arquivo.json")
    process.exit(1)
  }

  const items = JSON.parse(readFileSync(file, "utf8")) as Item[]
  if (!Array.isArray(items)) {
    console.error("❌  O arquivo deve conter um array.")
    process.exit(1)
  }

  let ok = 0
  let skip = 0
  for (const it of items) {
    if (!it.topicId || typeof it.body !== "string" || it.body.length < 400) {
      console.error(`  ⚠️  pulando (dados insuficientes): ${it.topicId ?? "?"}`)
      skip++
      continue
    }
    const topic = await db.topic.findUnique({
      where: { id: it.topicId },
      select: { id: true, name: true, slug: true, importance: true, frequency: true },
    })
    if (!topic) {
      console.error(`  ⚠️  tópico não encontrado: ${it.topicId}`)
      skip++
      continue
    }

    const readTime = Math.max(1, Math.round(it.body.split(/\s+/).length / 200))
    const data = {
      title: topic.name,
      summary: it.summary ?? "",
      body: it.body,
      keyConcepts: it.keyConcepts ?? [],
      tips: it.tips ?? [],
      formulas: it.formulas ?? [],
      tricks: it.tricks ?? [],
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
    console.log(`  ✅  ${topic.name} (${readTime} min)`)
    ok++
  }

  console.log(`\n✅  Importados: ${ok}   pulados: ${skip}`)
  await db.$disconnect()
}

main().catch((e) => {
  console.error(e)
  db.$disconnect()
  process.exit(1)
})
