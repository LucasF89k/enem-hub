import { db } from "@/lib/db"
import type { LeagueTier } from "@prisma/client"

/** Ordem das ligas, da mais baixa pra mais alta. */
export const LEAGUE_ORDER: LeagueTier[] = [
  "INICIANTE",
  "VESTIBULANDO",
  "APROVADO",
  "MEDALHISTA",
  "ELITE",
]

export const LEAGUE_META: Record<
  LeagueTier,
  { label: string; color: string; ring: string; icon: string }
> = {
  INICIANTE: { label: "Iniciante", color: "text-zinc-400", ring: "ring-zinc-400/40", icon: "BookOpen" },
  VESTIBULANDO: { label: "Vestibulando", color: "text-sky-400", ring: "ring-sky-400/40", icon: "PencilRuler" },
  APROVADO: { label: "Aprovado", color: "text-emerald-400", ring: "ring-emerald-400/40", icon: "GraduationCap" },
  MEDALHISTA: { label: "Medalhista", color: "text-amber-400", ring: "ring-amber-400/40", icon: "Medal" },
  ELITE: { label: "Elite", color: "text-fuchsia-400", ring: "ring-fuchsia-400/40", icon: "Crown" },
}

/** Quantos por sala, quantos sobem, quantos descem. */
export const ROOM_SIZE = 30
export const PROMOTE_TOP = 10
export const DEMOTE_BOTTOM = 5
/** Só aplica promoção/rebaixamento se a sala tiver pelo menos isto. */
export const MIN_ROOM_FOR_MOVEMENT = 10
/** Pódio só aparece com pelo menos isto. */
export const MIN_ROOM_FOR_PODIUM = 3

export function tierUp(tier: LeagueTier): LeagueTier {
  const i = LEAGUE_ORDER.indexOf(tier)
  return LEAGUE_ORDER[Math.min(i + 1, LEAGUE_ORDER.length - 1)]
}
export function tierDown(tier: LeagueTier): LeagueTier {
  const i = LEAGUE_ORDER.indexOf(tier)
  return LEAGUE_ORDER[Math.max(i - 1, 0)]
}

/** "2026-08" pra uma data (mês da competição), fuso BR. */
export function seasonKey(d: Date = new Date()): string {
  // BR = UTC-3; suficiente pra virada de mês não escorregar um dia.
  const br = new Date(d.getTime() - 3 * 60 * 60 * 1000)
  return `${br.getUTCFullYear()}-${String(br.getUTCMonth() + 1).padStart(2, "0")}`
}

/** Season anterior a uma dada (ex.: "2026-08" -> "2026-07"). */
export function prevSeason(season: string): string {
  const [y, m] = season.split("-").map(Number)
  const d = new Date(Date.UTC(y, m - 1, 1))
  d.setUTCMonth(d.getUTCMonth() - 1)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
}

/** Dias restantes até a virada (fim do mês, fuso BR). */
export function daysUntilRollover(now: Date = new Date()): number {
  const br = new Date(now.getTime() - 3 * 60 * 60 * 1000)
  const endOfMonth = Date.UTC(br.getUTCFullYear(), br.getUTCMonth() + 1, 1)
  return Math.max(0, Math.ceil((endOfMonth - br.getTime()) / 86_400_000))
}

/**
 * Garante que o usuário tem uma membership na season atual, na sala da liga
 * dele (`currentTier`). Aloca numa sala com vaga ou cria uma nova.
 * Retorna a membership (com room).
 */
export async function ensureLeagueMembership(userId: string) {
  const season = seasonKey()

  const existing = await db.leagueMembership.findUnique({
    where: { userId_season: { userId, season } },
    include: { room: true },
  })
  if (existing) return existing

  const profile = await db.userProfile.findUnique({
    where: { userId },
    select: { currentTier: true },
  })
  const tier = profile?.currentTier ?? "INICIANTE"

  // Sala da mesma liga+season com menos de ROOM_SIZE membros
  const rooms = await db.leagueRoom.findMany({
    where: { tier, season },
    select: { id: true, _count: { select: { members: true } } },
  })
  let roomId = rooms.find((r) => r._count.members < ROOM_SIZE)?.id ?? null

  if (!roomId) {
    const created = await db.leagueRoom.create({ data: { tier, season } })
    roomId = created.id
  }

  return db.leagueMembership.create({
    data: { roomId, userId, season },
    include: { room: true },
  })
}
