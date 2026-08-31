import { db } from "@/lib/db"
import {
  DEMOTE_BOTTOM,
  MIN_ROOM_FOR_MOVEMENT,
  PROMOTE_TOP,
  prevSeason,
  seasonKey,
  tierDown,
  tierUp,
} from "@/lib/league"

/**
 * Virada de temporada — modo "lazy": chamada na 1ª visita ao ranking depois
 * da troca de mês. Processa a season ANTERIOR à atual (uma vez só):
 *   - top 10 de cada sala com >= MIN_ROOM_FOR_MOVEMENT: sobem de liga
 *   - bottom 5: descem de liga
 *   - o resto fica
 * O `monthlyXP` não é "zerado": a season nova só cria memberships em 0 quando
 * cada usuário volta a ganhar XP (via ensureLeagueMembership).
 *
 * Idempotente: usa LeagueSeason.processedAt como trava.
 */
export async function runDueLeagueRollover(): Promise<void> {
  const current = seasonKey()
  const target = prevSeason(current)

  // Já processada?
  const seasonRow = await db.leagueSeason.findUnique({ where: { season: target } })
  if (seasonRow?.processedAt) return

  const rooms = await db.leagueRoom.findMany({
    where: { season: target },
    select: {
      id: true,
      members: {
        select: { userId: true, monthlyXP: true },
        orderBy: { monthlyXP: "desc" },
      },
    },
  })

  // Nada da season anterior — marca como processada e sai.
  if (rooms.length === 0) {
    await db.leagueSeason.upsert({
      where: { season: target },
      create: { season: target, processedAt: new Date() },
      update: { processedAt: new Date() },
    })
    return
  }

  const promote: string[] = []
  const demote: string[] = []

  for (const room of rooms) {
    if (room.members.length < MIN_ROOM_FOR_MOVEMENT) continue
    const ids = room.members.map((m) => m.userId)
    promote.push(...ids.slice(0, PROMOTE_TOP))
    demote.push(...ids.slice(-DEMOTE_BOTTOM))
  }

  // Aplica tier novo (lê o tier atual de cada um e move 1 nível)
  const affected = [...new Set([...promote, ...demote])]
  if (affected.length) {
    const profiles = await db.userProfile.findMany({
      where: { userId: { in: affected } },
      select: { userId: true, currentTier: true },
    })
    const tierByUser = new Map(profiles.map((p) => [p.userId, p.currentTier]))
    const promoteSet = new Set(promote)

    await db.$transaction(
      affected.map((userId) => {
        const cur = tierByUser.get(userId) ?? "INICIANTE"
        const next = promoteSet.has(userId) ? tierUp(cur) : tierDown(cur)
        return db.userProfile.update({
          where: { userId },
          data: { currentTier: next },
        })
      })
    )
  }

  await db.leagueSeason.upsert({
    where: { season: target },
    create: { season: target, processedAt: new Date() },
    update: { processedAt: new Date() },
  })
}
