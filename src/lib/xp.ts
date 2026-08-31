import { db } from "@/lib/db"
import { startOfDayBR, addDaysBR } from "@/lib/date-br"
import { ensureLeagueMembership, seasonKey } from "@/lib/league"

export function calcLevel(totalXP: number): number {
  return Math.min(99, Math.floor(totalXP / 500) + 1)
}

export async function awardXP(userId: string, amount: number): Promise<number> {
  const profile = await db.userProfile.update({
    where: { userId },
    data: { totalXP: { increment: amount } },
    select: { totalXP: true, currentLevel: true },
  })

  const newLevel = calcLevel(profile.totalXP)
  if (newLevel !== profile.currentLevel) {
    await db.userProfile.update({
      where: { userId },
      data: { currentLevel: newLevel },
    })
  }

  // XP também conta pra competição mensal da liga.
  if (amount > 0) {
    try {
      await ensureLeagueMembership(userId)
      await db.leagueMembership.update({
        where: { userId_season: { userId, season: seasonKey() } },
        data: { monthlyXP: { increment: amount } },
      })
    } catch {
      // Liga é secundária — nunca quebra o fluxo de XP se algo falhar aqui.
    }
  }

  return amount
}

/**
 * Tipos de atividade que contam pro streak. Ler teoria (CONTENT) e revisão
 * genérica (REVISION) NÃO contam — só prática de verdade.
 */
const STREAK_TYPES = new Set(["QUESTIONS", "SIMULADO", "FLASHCARDS", "REDACAO"])

/**
 * Streak "efetivo": o valor gravado só vale se a pessoa estudou hoje ou ontem.
 * Passou um dia inteiro (00:00–23:59 BR) sem atividade que conta → 0, sem
 * precisar de job noturno: qualquer leitura do streak passa por aqui.
 */
export function effectiveStreak(
  streak: number,
  lastStudyDate: Date | null | undefined
): number {
  if (!lastStudyDate) return 0
  const today = startOfDayBR()
  const yesterday = addDaysBR(today, -1)
  const last = startOfDayBR(lastStudyDate)
  if (last.getTime() === today.getTime() || last.getTime() === yesterday.getTime()) {
    return streak
  }
  return 0
}

/**
 * Records study activity and updates streak on the FIRST streak-eligible
 * activity of each day.
 */
export interface StudyActivityResult {
  /** true só quando esta foi a 1ª atividade do dia e o streak incrementou. */
  streakIncreased: boolean
  /** valor do streak depois desta atividade (o atual, se não mudou). */
  newStreak: number
}

export async function recordStudyActivity(
  userId: string,
  minutes: number = 5,
  type: "QUESTIONS" | "FLASHCARDS" | "SIMULADO" | "CONTENT" | "REDACAO" | "REVISION" = "QUESTIONS"
): Promise<StudyActivityResult> {
  const today = startOfDayBR()
  const yesterday = addDaysBR(today, -1)

  // Upsert today's study session for this type
  const existing = await db.studySession.findFirst({
    where: { userId, type, date: { gte: today } },
    select: { id: true, duration: true },
  })

  if (existing) {
    await db.studySession.update({
      where: { id: existing.id },
      data: { duration: existing.duration + minutes },
    })
  } else {
    await db.studySession.create({
      data: { userId, type, date: today, duration: minutes },
    })
  }

  const profile = await db.userProfile.findUnique({
    where: { userId },
    select: { streak: true, longestStreak: true, lastStudyDate: true },
  })
  if (!profile) return { streakIncreased: false, newStreak: 0 }

  // Ler teoria não conta pro streak — só prática.
  if (!STREAK_TYPES.has(type)) {
    return {
      streakIncreased: false,
      newStreak: effectiveStreak(profile.streak, profile.lastStudyDate),
    }
  }

  const lastStudyDay = profile.lastStudyDate ? startOfDayBR(profile.lastStudyDate) : null

  // Já contou hoje
  if (lastStudyDay && lastStudyDay.getTime() === today.getTime()) {
    return { streakIncreased: false, newStreak: profile.streak }
  }

  const studiedYesterday =
    lastStudyDay !== null && lastStudyDay.getTime() === yesterday.getTime()

  // Estudou ontem → +1; senão (0 ou quebrou) → recomeça em 1
  const newStreak = studiedYesterday ? profile.streak + 1 : 1
  const newLongest = Math.max(newStreak, profile.longestStreak)

  await db.userProfile.update({
    where: { userId },
    data: {
      streak: newStreak,
      longestStreak: newLongest,
      lastStudyDate: new Date(),
    },
  })

  return { streakIncreased: true, newStreak }
}
