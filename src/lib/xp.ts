import { db } from "@/lib/db"
import { startOfDay, subDays, addDays } from "date-fns"

function calcLevel(totalXP: number): number {
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
 * Records study activity (creates/extends a StudySession for today) and
 * updates streak only when the user hits their dailyStudyGoal for the day.
 */
export async function recordStudyActivity(
  userId: string,
  minutes: number = 5,
  type: "QUESTIONS" | "FLASHCARDS" | "SIMULADO" | "CONTENT" | "REDACAO" | "REVISION" = "QUESTIONS"
): Promise<void> {
  const today = startOfDay(new Date())
  const tomorrow = addDays(today, 1)
  const yesterday = subDays(today, 1)

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

  // Check total study minutes across ALL types today
  const [todayTotal, profile] = await Promise.all([
    db.studySession.aggregate({
      where: { userId, date: { gte: today, lt: tomorrow } },
      _sum: { duration: true },
    }),
    db.userProfile.findUnique({
      where: { userId },
      select: { streak: true, longestStreak: true, lastStudyDate: true, dailyStudyGoal: true },
    }),
  ])

  if (!profile) return

  const minutesToday = todayTotal._sum.duration ?? 0

  // Streak only increments when the daily goal is fully met
  if (minutesToday < profile.dailyStudyGoal) return

  // Already counted today (lastStudyDate is within today's window)
  const lastStudyDay = profile.lastStudyDate ? startOfDay(profile.lastStudyDate) : null
  if (lastStudyDay && lastStudyDay.getTime() === today.getTime()) return

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
}
