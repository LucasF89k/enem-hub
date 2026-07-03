import { db } from "@/lib/db"
import { startOfDay, subDays } from "date-fns"

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
 * Creates or updates a StudySession for today and updates the user's streak.
 * Call this whenever the user completes a study activity (question, flashcard, simulado).
 */
export async function recordStudyActivity(
  userId: string,
  minutes: number = 5,
  type: "QUESTIONS" | "FLASHCARDS" | "SIMULADO" | "CONTENT" | "REDACAO" | "REVISION" = "QUESTIONS"
): Promise<void> {
  const today = startOfDay(new Date())
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
    // Session already exists for today — streak already counted for today
    return
  }

  // First activity of the day — create session and update streak
  await db.studySession.create({
    data: { userId, type, date: today, duration: minutes },
  })

  const profile = await db.userProfile.findUnique({
    where: { userId },
    select: { streak: true, longestStreak: true, lastStudyDate: true },
  })

  if (!profile) return

  const studiedYesterday =
    profile.lastStudyDate !== null &&
    profile.lastStudyDate >= yesterday &&
    profile.lastStudyDate < today

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
