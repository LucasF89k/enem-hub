"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { generateStudyPlan } from "@/lib/planner"
import { recordStudyActivity } from "@/lib/xp"
import { z } from "zod"
import { startOfDay, startOfWeek } from "date-fns"

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
    // Start from this week's Monday so current week shows items (not just future weeks)
    const planId = await generateStudyPlan({
      userId,
      startDate: startOfWeek(startOfDay(new Date()), { weekStartsOn: 1 }),
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
