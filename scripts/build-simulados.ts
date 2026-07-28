/**
 * scripts/build-simulados.ts
 * Cria um Simulado por exame (source) a partir das questões importadas que têm
 * gabarito (correctId), pra virarem simulados praticáveis e separados por ano.
 * Idempotente: atualiza os já existentes (match por título = source).
 *
 *   npx tsx scripts/build-simulados.ts
 */
import "dotenv/config"
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()
const MIN_Q = 20 // mínimo de questões com gabarito pra virar simulado

async function main() {
  const rows = await db.question.groupBy({
    by: ["source"],
    where: { correctId: { not: null } },
    _count: true,
  })
  const sources = rows
    .filter((r): r is typeof r & { source: string } => !!r.source && r._count >= MIN_Q)
    .sort((a, b) => a.source.localeCompare(b.source))

  let created = 0
  let updated = 0
  for (const { source } of sources) {
    const qs = await db.question.findMany({
      where: { source, correctId: { not: null } },
      select: { id: true },
      orderBy: { id: "asc" },
    })
    const description = `Prova ${source} — ${qs.length} questões`
    // Tempo real de prova: ~3,7 min/questão (90 questões ≈ 5h30, como o ENEM), teto 6h
    const duration = Math.min(360, Math.round(qs.length * 3.7))

    let sim = await db.simulado.findFirst({ where: { title: source } })
    if (!sim) {
      sim = await db.simulado.create({
        data: { title: source, description, type: "FULL", duration, isPublic: true },
      })
      created++
    } else {
      await db.simulado.update({ where: { id: sim.id }, data: { description, duration } })
      updated++
    }

    await db.simuladoQuestion.createMany({
      data: qs.map((q, i) => ({ simuladoId: sim!.id, questionId: q.id, order: i + 1 })),
      skipDuplicates: true,
    })
    console.log(`  ✓ ${source}: ${qs.length} questões`)
  }

  console.log(`\n✅  ${created} criados, ${updated} atualizados (de ${sources.length} exames com ≥${MIN_Q} questões com gabarito).`)
  await db.$disconnect()
}

main().catch((e) => { console.error(e); db.$disconnect(); process.exitCode = 1 })
