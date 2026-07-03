"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { awardXP, recordStudyActivity } from "@/lib/xp"
import { checkAchievements, type NewAchievement } from "@/lib/achievements"
import { z } from "zod"

const answerSchema = z.object({
  questionId: z.string().min(1),
  selectedOptionId: z.string().min(1),
  timeSpentSeconds: z.number().int().min(0).max(7200),
})

export async function answerQuestion(
  questionId: string,
  selectedOptionId: string,
  timeSpentSeconds: number = 0
): Promise<{ isCorrect: boolean; correctId: string; explanation: string; newAchievements: NewAchievement[] }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  const parsed = answerSchema.parse({ questionId, selectedOptionId, timeSpentSeconds })

  const question = await db.question.findUnique({
    where: { id: parsed.questionId },
    select: { correctId: true, explanation: true },
  })
  if (!question) throw new Error("Question not found")

  const isCorrect = question.correctId === parsed.selectedOptionId

  await db.userQuestion.create({
    data: {
      userId,
      questionId: parsed.questionId,
      selectedId: parsed.selectedOptionId,
      isCorrect,
      timeSpent: parsed.timeSpentSeconds,
      mode: "practice",
    },
  })

  await awardXP(userId, isCorrect ? 10 : 2)
  await recordStudyActivity(userId, 3, "QUESTIONS")
  const newAchievements = await checkAchievements(userId)

  return {
    isCorrect,
    correctId: question.correctId!,
    explanation: question.explanation,
    newAchievements,
  }
}
