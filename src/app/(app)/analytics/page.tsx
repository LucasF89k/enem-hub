import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { startOfDay, subDays, startOfWeek } from "date-fns"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame, Clock, Zap } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AreaRadarChart } from "@/components/analytics/AreaRadarChart"
import { ScoreLineChart } from "@/components/analytics/ScoreLineChart"
import { CalendarHeatmap } from "@/components/analytics/CalendarHeatmap"

export const metadata = { title: "Analytics" }

const AREA_SHORT: Record<string, string> = {
  "ciencias-natureza": "C. Natureza",
  "ciencias-humanas": "C. Humanas",
  linguagens: "Linguagens",
  matematica: "Matemática",
}

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const today = startOfDay(new Date())
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const yearAgo = subDays(today, 364)

  const [profile, sessionsToday, sessionsWeek, allSessions, userQuestions, simulados] =
    await Promise.all([
      db.userProfile.findUnique({
        where: { userId },
        select: { streak: true, totalXP: true },
      }),
      db.studySession.aggregate({
        where: { userId, date: { gte: today } },
        _sum: { duration: true },
      }),
      db.studySession.aggregate({
        where: { userId, date: { gte: weekStart } },
        _sum: { duration: true },
      }),
      db.studySession.findMany({
        where: { userId, date: { gte: yearAgo } },
        select: { date: true, duration: true },
      }),
      db.userQuestion.findMany({
        where: { userId },
        select: {
          isCorrect: true,
          question: { select: { areaSlug: true } },
        },
      }),
      db.userSimulado.findMany({
        where: { userId, status: "COMPLETED" },
        orderBy: { finishedAt: "asc" },
        select: { scoreTotal: true, finishedAt: true },
        take: 20,
      }),
    ])

  const todayMins = sessionsToday._sum.duration ?? 0
  const weekMins = sessionsWeek._sum.duration ?? 0

  // Heatmap data
  const heatmap: Record<string, number> = {}
  for (const s of allSessions) {
    const key = format(s.date, "yyyy-MM-dd")
    heatmap[key] = (heatmap[key] ?? 0) + s.duration
  }

  // Radar data: accuracy by area
  const areaStats: Record<string, { correct: number; total: number }> = {}
  for (const uq of userQuestions) {
    const area = uq.question.areaSlug ?? "outros"
    if (!areaStats[area]) areaStats[area] = { correct: 0, total: 0 }
    areaStats[area].total++
    if (uq.isCorrect) areaStats[area].correct++
  }

  // Sempre as 4 áreas do ENEM, mesmo sem questões respondidas: o gráfico é uma
  // comparação entre elas, e mostrar só as já respondidas escondia justamente as
  // áreas intocadas, que são a informação mais acionável ali.
  const radarData = Object.keys(AREA_SHORT).map((slug) => {
    const s = areaStats[slug] ?? { correct: 0, total: 0 }
    return {
      area: AREA_SHORT[slug],
      pct: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
      total: s.total,
    }
  })

  // Score line chart
  const lineData = simulados.map((s, i) => ({
    label: `#${i + 1}`,
    score: Math.round(s.scoreTotal ?? 0),
  }))

  // Critical topics: areaSlug + topicId for questions answered wrong >60%
  const topicStats: Record<string, { correct: number; total: number; topicId: string | null }> = {}
  const detailedQuestions = await db.userQuestion.findMany({
    where: { userId },
    select: {
      isCorrect: true,
      question: {
        select: {
          topicId: true,
          topic: { select: { id: true, name: true, slug: true, discipline: { select: { area: { select: { slug: true } } } } } },
        },
      },
    },
  })

  for (const uq of detailedQuestions) {
    const topicId = uq.question.topicId ?? "__unknown"
    if (!topicStats[topicId]) {
      topicStats[topicId] = { correct: 0, total: 0, topicId: uq.question.topicId }
    }
    topicStats[topicId].total++
    if (uq.isCorrect) topicStats[topicId].correct++
  }

  const criticalTopics = await Promise.all(
    Object.entries(topicStats)
      .filter(([, s]) => s.total >= 3 && s.correct / s.total < 0.4)
      .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
      .slice(0, 6)
      .map(async ([topicId, stats]) => {
        if (topicId === "__unknown") return null
        const topic = await db.topic.findUnique({
          where: { id: topicId },
          select: {
            id: true,
            name: true,
            slug: true,
            discipline: { select: { slug: true, area: { select: { slug: true } } } },
          },
        })
        if (!topic) return null
        return {
          topic,
          pct: Math.round((stats.correct / stats.total) * 100),
          total: stats.total,
        }
      })
  ).then((arr) => arr.filter(Boolean))

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Seu desempenho e progresso</p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col items-center gap-1">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-bold">{todayMins}m</p>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col items-center gap-1">
            <Clock className="h-5 w-5 text-primary" />
            <p className="text-2xl font-bold">{Math.round(weekMins / 60)}h</p>
            <p className="text-xs text-muted-foreground">Esta semana</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col items-center gap-1">
            <Flame className="h-5 w-5 text-orange-500" />
            <p className="text-2xl font-bold">{profile?.streak ?? 0}</p>
            <p className="text-xs text-muted-foreground">Dias de streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col items-center gap-1">
            <Zap className="h-5 w-5 text-yellow-500" />
            <p className="text-2xl font-bold">{(profile?.totalXP ?? 0).toLocaleString("pt-BR")}</p>
            <p className="text-xs text-muted-foreground">XP total</p>
          </CardContent>
        </Card>
      </div>

      {/* Radar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Taxa de acerto por área</CardTitle>
        </CardHeader>
        <CardContent>
          <AreaRadarChart data={radarData} />
        </CardContent>
      </Card>

      {/* Score evolution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Evolução nos simulados</CardTitle>
        </CardHeader>
        <CardContent>
          <ScoreLineChart data={lineData} />
        </CardContent>
      </Card>

      {/* Calendar heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Atividade em {new Date().getFullYear()}</CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarHeatmap data={heatmap} />
        </CardContent>
      </Card>

      {/* Critical topics */}
      {criticalTopics.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Tópicos críticos: acerto abaixo de 40%
          </h2>
          <div className="space-y-2">
            {criticalTopics.map((item) => {
              if (!item) return null
              const href = `/study/${item.topic.discipline.area.slug}/${item.topic.discipline.slug}/${item.topic.slug}`
              return (
                <div
                  key={item.topic.id}
                  className="flex items-center justify-between rounded-xl border bg-card px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{item.topic.name}</p>
                    <p className="text-xs text-muted-foreground">{item.total} questões respondidas</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-red-500">{item.pct}%</span>
                    <Button asChild variant="outline" size="sm">
                      <Link href={href}>Estudar</Link>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
