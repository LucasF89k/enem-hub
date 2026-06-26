import { db } from "@/lib/db"
import { subDays, startOfDay, startOfWeek, format, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame } from "lucide-react"

export async function StreakCard({ userId }: { userId: string }) {
  const profile = await db.userProfile.findUnique({
    where: { userId },
    select: { streak: true, longestStreak: true },
  })

  const streak = profile?.streak ?? 0
  const longestStreak = profile?.longestStreak ?? 0

  const todayStart = startOfDay(new Date())
  const sevenDaysAgo = subDays(todayStart, 6)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 })

  const [sessions, videosThisWeek] = await Promise.all([
    db.studySession.findMany({
      where: { userId, date: { gte: sevenDaysAgo } },
      select: { date: true },
    }),
    db.videoWatched.count({
      where: { userId, watchedAt: { gte: weekStart } },
    }),
  ])

  const studiedDates = sessions.map((s) => startOfDay(s.date))

  const days = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(todayStart, 6 - i)
    const studied = studiedDates.some((d) => isSameDay(d, day))
    const isToday = isSameDay(day, todayStart)
    return { day, studied, isToday }
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Sequência</CardTitle>
        <Flame className="h-4 w-4 text-orange-500" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold">{streak}</span>
          <span className="mb-1 text-sm text-muted-foreground">
            {streak === 1 ? "dia" : "dias"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1">
          {days.map(({ day, studied, isToday }) => (
            <div key={day.toISOString()} className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground uppercase">
                {format(day, "EEE", { locale: ptBR }).slice(0, 3)}
              </span>
              <div
                className={[
                  "h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-medium border",
                  studied
                    ? "bg-accent text-accent-foreground border-accent"
                    : isToday
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground",
                ].join(" ")}
              >
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>

        {longestStreak > 0 && (
          <p className="text-xs text-muted-foreground">
            Recorde: {longestStreak} {longestStreak === 1 ? "dia" : "dias"}
          </p>
        )}

        {videosThisWeek > 0 && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span>🎬</span>
            {videosThisWeek} vídeo{videosThisWeek !== 1 ? "s" : ""} esta semana
          </p>
        )}
      </CardContent>
    </Card>
  )
}
