import { db } from "@/lib/db"

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
