import "dotenv/config"
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

const ROOM_SIZE = 30

/** "2026-08" pra agora, fuso BR. */
function seasonKey(d = new Date()): string {
  const br = new Date(d.getTime() - 3 * 60 * 60 * 1000)
  return `${br.getUTCFullYear()}-${String(br.getUTCMonth() + 1).padStart(2, "0")}`
}

/** Início do mês atual (BR) em UTC — pra somar o XP já ganho no mês. */
function startOfMonthBR(): Date {
  const br = new Date(Date.now() - 3 * 60 * 60 * 1000)
  return new Date(Date.UTC(br.getUTCFullYear(), br.getUTCMonth(), 1, 3, 0, 0))
}

async function main() {
  const season = seasonKey()
  const monthStart = startOfMonthBR()
  console.log(`Alocando usuários na temporada ${season}…`)

  const profiles = await db.userProfile.findMany({
    select: { userId: true, currentTier: true },
  })

  // XP ganho neste mês por usuário (soma o xpEarned das study sessions do mês).
  const xpAgg = await db.studySession.groupBy({
    by: ["userId"],
    where: { date: { gte: monthStart } },
    _sum: { xpEarned: true },
  })
  const monthXpByUser = new Map(xpAgg.map((r) => [r.userId, r._sum.xpEarned ?? 0]))

  let allocated = 0
  let skipped = 0

  for (const p of profiles) {
    const existing = await db.leagueMembership.findUnique({
      where: { userId_season: { userId: p.userId, season } },
    })
    if (existing) {
      skipped++
      continue
    }

    const tier = p.currentTier
    const rooms = await db.leagueRoom.findMany({
      where: { tier, season },
      select: { id: true, _count: { select: { members: true } } },
    })
    let roomId = rooms.find((r) => r._count.members < ROOM_SIZE)?.id ?? null
    if (!roomId) {
      const created = await db.leagueRoom.create({ data: { tier, season } })
      roomId = created.id
    }

    await db.leagueMembership.create({
      data: {
        roomId,
        userId: p.userId,
        season,
        monthlyXP: monthXpByUser.get(p.userId) ?? 0,
      },
    })
    allocated++
  }

  // Garante o registro da temporada.
  await db.leagueSeason.upsert({
    where: { season },
    create: { season },
    update: {},
  })

  console.log(`Feito. ${allocated} alocados, ${skipped} já tinham sala.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
