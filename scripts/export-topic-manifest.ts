import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { writeFileSync } from "node:fs"
const db = new PrismaClient()
const MIN = 4500
const topics = await db.topic.findMany({
  select: {
    id: true, slug: true, name: true, disciplineId: true,
    discipline: { select: { name: true, area: { select: { name: true } } } },
    contents: { select: { body: true }, take: 1 },
  },
  orderBy: [{ importance: "desc" }, { order: "asc" }],
})
const byDisc = new Map()
for (const t of topics) {
  const key = t.disciplineId
  if (!byDisc.has(key)) byDisc.set(key, {
    discipline: t.discipline.name, area: t.discipline.area.name,
    allSlugs: [], topics: [],
  })
  const g = byDisc.get(key)
  g.allSlugs.push({ slug: t.slug, name: t.name })
  const body = t.contents[0]?.body ?? ""
  const enriched = body.length >= MIN && body.includes("[[")
  if (!enriched) g.topics.push({ id: t.id, slug: t.slug, name: t.name })
}
const out = [...byDisc.values()].filter(g => g.topics.length > 0)
writeFileSync("scratchpad-manifest.json", JSON.stringify(out, null, 2))
console.log("Disciplinas com pendências:", out.length)
for (const g of out) console.log(`  ${g.discipline} (${g.area}): ${g.topics.length} tópicos`)
console.log("Total pendentes:", out.reduce((n,g)=>n+g.topics.length,0))
await db.$disconnect()
