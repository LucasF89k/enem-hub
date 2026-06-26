import { db } from "@/lib/db"
import { startOfDay, addDays } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDays, ArrowRight } from "lucide-react"
import Link from "next/link"
import { PlanoHojeCardClient } from "./PlanoHojeCardClient"

export async function PlanoHojeCard({ userId }: { userId: string }) {
  const todayStart = startOfDay(new Date())
  const tomorrowStart = addDays(todayStart, 1)

  const items = await db.studyPlanItem.findMany({
    where: {
      plan: { userId },
      scheduledAt: { gte: todayStart, lt: tomorrowStart },
      completed: false,
    },
    orderBy: [{ priority: "desc" }, { scheduledAt: "asc" }],
    take: 3,
    include: {
      topic: { select: { name: true } },
    },
  })

  const planItems = items.map((item) => ({
    id: item.id,
    title: item.title,
    type: item.type,
    duration: item.duration,
    topicName: item.topic?.name ?? null,
  }))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium">Plano de hoje</CardTitle>
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        {planItems.length > 0 ? (
          <>
            <PlanoHojeCardClient items={planItems} />
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href="/planner">
                Ver plano completo
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma atividade planejada para hoje
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/planner">Criar plano de estudos</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
