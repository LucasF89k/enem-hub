import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { addDays } from "date-fns"
import { PlannerClient } from "./planner-client"

export const metadata = { title: "Planejador — Vion" }

/** Monday of the current week, computed entirely in UTC to avoid tz mismatch. */
function getThisMondayUTC(): Date {
  const now = new Date()
  const dayUTC = now.getUTCDay() // 0=Sun, 1=Mon …
  const daysSinceMonday = (dayUTC + 6) % 7 // Mon→0, Sun→6
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMonday)
  )
}

export default async function PlannerPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const weekStart = getThisMondayUTC()
  const weekEnd = new Date(addDays(weekStart, 6).setUTCHours(23, 59, 59, 999))

  const activePlan = await db.studyPlan.findFirst({
    where: { userId, isActive: true },
    select: { id: true, title: true, dailyGoal: true },
    orderBy: { createdAt: "desc" },
  })

  const items = activePlan
    ? await db.studyPlanItem.findMany({
        where: {
          planId: activePlan.id,
          scheduledAt: { gte: weekStart, lte: weekEnd },
        },
        orderBy: { scheduledAt: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          scheduledAt: true,
          duration: true,
          completed: true,
          topicId: true,
          topic: {
            select: {
              name: true,
              slug: true,
              discipline: { select: { slug: true, area: { select: { slug: true } } } },
            },
          },
        },
      })
    : []

  const profile = await db.userProfile.findUnique({
    where: { userId },
    select: { dailyStudyGoal: true },
  })

  return (
    <PlannerClient
      weekStart={weekStart.toISOString()}
      items={items.map((item) => ({
        ...item,
        scheduledAt: item.scheduledAt.toISOString(),
      }))}
      hasPlan={!!activePlan}
      dailyGoal={activePlan?.dailyGoal ?? profile?.dailyStudyGoal ?? 120}
    />
  )
}
