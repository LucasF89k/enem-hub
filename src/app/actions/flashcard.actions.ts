"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sm2 } from "@/lib/sm2"
import { awardXP } from "@/lib/xp"

export async function submitFlashcardReview(
  flashcardId: string,
  rating: 1 | 2 | 3 | 4
): Promise<{ xpEarned: number }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  const lastReview = await db.flashcardReview.findFirst({
    where: { userId, flashcardId },
    orderBy: { reviewedAt: "desc" },
  })

  const elapsedDays = lastReview
    ? Math.max(0, Math.floor((Date.now() - lastReview.reviewedAt.getTime()) / 86_400_000))
    : 0

  const result = sm2({
    rating,
    stability: lastReview?.stability ?? 1,
    difficulty: lastReview?.difficulty ?? 5,
    elapsed: elapsedDays,
  })

  await db.flashcardReview.create({
    data: {
      userId,
      flashcardId,
      rating,
      stability: result.stability,
      difficulty: result.difficulty,
      elapsed: elapsedDays,
      scheduled: result.scheduled,
      nextReview: result.nextReview,
      state: result.state,
    },
  })

  const xpEarned = await awardXP(userId, 5)
  return { xpEarned }
}
