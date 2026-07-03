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
    await recordStudyActivity(session.user.id, 10, "CONTENT").catch(() => {})
  }

  revalidatePath("/planner")
}

// Alias used by dashboard PlanoHojeCardClient
export const markPlanItemDone = completePlanItem

export async function removePlanItem(itemId: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await db.studyPlanItem.deleteMany({
    where: { id: itemId, plan: { userId: session.user.id } },
  })

  revalidatePath("/planner")
}
