import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { startOfWeek, addDays, startOfDay, endOfDay } from "date-fns"
import { PlannerClient } from "./planner-client"

export const metadata = { title: "Planejador — ENEM Hub" }

export default async function PlannerPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const weekStart = startOfWeek(startOfDay(new Date()), { weekStartsOn: 1 })
  const weekEnd = endOfDay(addDays(weekStart, 6))

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
