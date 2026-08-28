import { db } from "@/lib/db"
import { startOfDayBR, addDaysBR } from "@/lib/date-br"

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

  return amount
}

/**
 * Records study activity and updates streak on the FIRST activity of each day
 * (Duolingo-style: any study = streak, not tied to a daily goal).
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
    // Session already exists for today — streak was already counted on first activity
    const p = await db.userProfile.findUnique({ where: { userId }, select: { streak: true } })
    return { streakIncreased: false, newStreak: p?.streak ?? 0 }
  }

  // First activity of this type today — create session
  await db.studySession.create({
    data: { userId, type, date: today, duration: minutes },
  })

  // Update streak only once per day (check if lastStudyDate is already today)
  const profile = await db.userProfile.findUnique({
    where: { userId },
    select: { streak: true, longestStreak: true, lastStudyDate: true },
  })

  if (!profile) return { streakIncreased: false, newStreak: 0 }

  const lastStudyDay = profile.lastStudyDate ? startOfDayBR(profile.lastStudyDate) : null

  // Already counted today
  if (lastStudyDay && lastStudyDay.getTime() === today.getTime()) {
    return { streakIncreased: false, newStreak: profile.streak }
  }

  const studiedYesterday =
    lastStudyDay !== null && lastStudyDay.getTime() === yesterday.getTime()

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
