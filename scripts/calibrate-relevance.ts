/**
 * scripts/calibrate-relevance.ts
 * Ajusta importance/frequency (1-5) de cada Topic com base na ANÁLISE DE
 * INCIDÊNCIA do ENEM (Enem's Anatomy 2026), via MiMo.
 *
 * O modelo lê a análise + os tópicos de uma disciplina e devolve importance e
 * frequency. Regras: baseia-se SOMENTE na análise; se o tópico não aparecer,
 * mantém um valor neutro (3). NÃO inventa.
 *
 * Usage:
 *   npx tsx scripts/calibrate-relevance.ts --dry-run
 *   npx tsx scripts/calibrate-relevance.ts --all
 *   ANATOMY=caminho.txt npx tsx scripts/calibrate-relevance.ts --all
 */

import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { readFileSync } from "node:fs"
import { mimo, MIMO_MODEL } from "../src/lib/mimo"

const db = new PrismaClient()

const ANATOMY =
  process.env.ANATOMY ||
  "C:/Users/dilbe/AppData/Local/Temp/claude/d--enem-hub/97109b74-d515-4738-aee2-7a20fe647063/scratchpad/anatomy.txt"

const argv = process.argv.slice(2)
const dryRun = argv.includes("--dry-run")

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function clamp(n: unknown): number | null {
  const v = Math.round(Number(n))
  if (!Number.isFinite(v)) return null
  return Math.max(1, Math.min(5, v))
}

async function main() {
  let analysis = ""
  try {
    analysis = readFileSync(ANATOMY, "utf8").replace(/\s+\n/g, "\n").slice(0, 40000)
  } catch {
    console.error("❌ não achei a análise (ANATOMY):", ANATOMY)
    process.exit(1)
  }

  const discs = await db.discipline.findMany({
    select: { id: true, name: true, area: { select: { name: true } } },
    orderBy: { name: "asc" },
  })

  let updated = 0
  const samples: string[] = []

  for (const d of discs) {
    const topics = await db.topic.findMany({
      where: { disciplineId: d.id },
      select: { id: true, slug: true, name: true, importance: true, frequency: true },
      orderBy: { order: "asc" },
    })
    if (topics.length === 0) continue

    const list = topics.map((t) => `${t.slug} — ${t.name}`).join("\n")
    const prompt = `Abaixo, a ANÁLISE DE INCIDÊNCIA do ENEM (percentuais de quanto cada assunto cai). Use SOMENTE ela.

=== ANÁLISE (ENEM 2014-2025) ===
${analysis}
=== FIM DA ANÁLISE ===

Disciplina: ${d.name} (${d.area?.name}).
Para CADA tópico abaixo, dê:
- "importance": 1 a 5 (quão cobrado/relevante no ENEM, segundo a análise)
- "frequency": 1 a 5 (quão frequente aparece)
Se o tópico NÃO aparecer claramente na análise, use 3 (neutro). NÃO invente dados.

TÓPICOS:
${list}

Responda SOMENTE um array JSON: [{"slug":"...","importance":N,"frequency":N}]`

    try {
      const completion = await mimo.chat.completions.create({
        model: MIMO_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 8000,
        temperature: 0,
      })
      const raw = (completion.choices[0]?.message?.content ?? "").trim()
      const s = raw.indexOf("["), e = raw.lastIndexOf("]")
      const arr = JSON.parse(s >= 0 && e > s ? raw.slice(s, e + 1) : raw) as {
        slug: string; importance: number; frequency: number
      }[]
      const bySlug = new Map(topics.map((t) => [t.slug, t]))

      for (const r of arr) {
        const t = bySlug.get(r.slug)
        if (!t) continue
        const imp = clamp(r.importance)
        const freq = clamp(r.frequency)
        if (imp == null || freq == null) continue
        if (imp === t.importance && freq === t.frequency) continue
        if (samples.length < 40) samples.push(`  ${t.name}: imp ${t.importance}→${imp}, freq ${t.frequency}→${freq}`)
        if (!dryRun) await db.topic.update({ where: { id: t.id }, data: { importance: imp, frequency: freq } })
        updated++
      }
      console.log(`  ✅ ${d.name} (${topics.length} tópicos)`)
    } catch (err) {
      console.error(`  ❌ ${d.name} falhou:`, err instanceof Error ? err.message.slice(0, 100) : err)
    }
    await sleep(400)
  }

  console.log("\n── Amostra ──\n" + (samples.join("\n") || "(sem mudanças)"))
  console.log("\n" + "─".repeat(50))
  console.log(`${dryRun ? "PROPOSTO" : "APLICADO"} — tópicos ajustados: ${updated}`)
  await db.$disconnect()
}

main().catch((e) => { console.error(e); db.$disconnect(); process.exit(1) })
