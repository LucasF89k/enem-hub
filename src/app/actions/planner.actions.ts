"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { generateStudyPlan } from "@/lib/planner"
import { recordStudyActivity } from "@/lib/xp"
import { z } from "zod"

/** Monday of the current week in UTC (independent of server/local timezone). */
function getThisMondayUTC(): Date {
  const now = new Date()
  const dayUTC = now.getUTCDay() // 0=Sun
  const daysSinceMonday = (dayUTC + 6) % 7
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMonday)
  )
}

const generateSchema = z.object({
  daysCount: z.coerce.number().int().min(1).max(90).default(14),
  dailyGoalMinutes: z.coerce.number().int().min(30).max(720).default(120),
  weekDays: z.array(z.coerce.number().int().min(0).max(6)).min(1).default([1, 2, 3, 4, 5]),
})

export async function generatePlan(
  formData: FormData
): Promise<{ success: boolean; planId?: string; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  const weekDaysRaw = formData.getAll("weekDays").map(Number)

  const parsed = generateSchema.safeParse({
    daysCount: formData.get("daysCount"),
    dailyGoalMinutes: formData.get("dailyGoalMinutes"),
    weekDays: weekDaysRaw.length > 0 ? weekDaysRaw : [1, 2, 3, 4, 5],
  })

  if (!parsed.success) return { success: false, error: "Parâmetros inválidos" }

  try {
    const planId = await generateStudyPlan({
      userId,
      startDate: getThisMondayUTC(),
      ...parsed.data,
    })
    revalidatePath("/planner")
    return { success: true, planId }
  } catch {
    return { success: false, error: "Falha ao gerar plano" }
  }
}

export async function completePlanItem(itemId: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const item = await db.studyPlanItem.findFirst({
    where: { id: itemId, plan: { userId: session.user.id } },
    select: { id: true, completed: true },
  })
  if (!item) return

  const willComplete = !item.completed
  await db.studyPlanItem.update({
    where: { id: itemId },
    data: {
      completed: willComplete,
      completedAt: willComplete ? new Date() : null,
    },
  })

  if (willComplete) {
    // Só marca o streak (0 min); o tempo real vem das telas (leitura via
    // StudyTimer, questões e flashcards pelo relógio do dispositivo).
    await recordStudyActivity(session.user.id, 0, "CONTENT").catch(() => {})
  }

  revalidatePath("/planner")
}

// Alias used by dashboard PlanoHojeCardClient
export const markPlanItemDone = completePlanItem

/**
 * Regenerates the active plan with updated topic priorities based on the user's
 * current error rates. Detects the existing plan's weekDays from its items.
 */
export async function recalibratePlan(): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  const activePlan = await db.studyPlan.findFirst({
    where: { userId, isActive: true },
    include: {
      items: {
        where: { scheduledAt: { gte: new Date() } },
        select: { scheduledAt: true },
        take: 30,
      },
    },
  })

  if (!activePlan) return { success: false, error: "Nenhum plano ativo para recalibrar." }

  // Detect which weekdays the plan uses (from future items' UTC day-of-week)
  const weekDaySet = new Set<number>()
  for (const item of activePlan.items) {
    weekDaySet.add(item.scheduledAt.getUTCDay())
  }
  const weekDays = weekDaySet.size > 0 ? Array.from(weekDaySet).sort() : [1, 2, 3, 4, 5]

  // How many days remain until the exam (or 14 default)
  const now = new Date()
  const remainingDays = activePlan.endDate > now
    ? Math.min(90, Math.ceil((activePlan.endDate.getTime() - now.getTime()) / 86_400_000))
    : 14

  try {
    await generateStudyPlan({
      userId,
      startDate: getThisMondayUTC(),
      daysCount: remainingDays,
      dailyGoalMinutes: activePlan.dailyGoal,
      weekDays,
    })
    revalidatePath("/planner")
    return { success: true }
  } catch {
    return { success: false, error: "Falha ao recalibrar o plano. Tente novamente." }
  }
}

export async function removePlanItem(itemId: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await db.studyPlanItem.deleteMany({
    where: { id: itemId, plan: { userId: session.user.id } },
  })

  revalidatePath("/planner")
}
