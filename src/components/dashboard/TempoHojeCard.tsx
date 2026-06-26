import { db } from "@/lib/db"
import { startOfDay, addDays } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"

const RADIUS = 36
const STROKE_WIDTH = 6
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export async function TempoHojeCard({ userId }: { userId: string }) {
  const profile = await db.userProfile.findUnique({
    where: { userId },
    select: { dailyStudyGoal: true },
  })

  const goal = profile?.dailyStudyGoal ?? 120

  const todayStart = startOfDay(new Date())
  const tomorrowStart = addDays(todayStart, 1)

  const agg = await db.studySession.aggregate({
    where: { userId, date: { gte: todayStart, lt: tomorrowStart } },
    _sum: { duration: true },
  })

  const studied = agg._sum.duration ?? 0
  const progressPct = Math.min((studied / goal) * 100, 100)
  const offset = CIRCUMFERENCE - (progressPct / 100) * CIRCUMFERENCE

  const studiedH = Math.floor(studied / 60)
  const studiedM = studied % 60
  const goalH = Math.floor(goal / 60)
  const goalM = goal % 60

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Estudo hoje</CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3 py-2">
        <div className="relative">
          <svg
            width={RADIUS * 2 + STROKE_WIDTH * 2}
            height={RADIUS * 2 + STROKE_WIDTH * 2}
            viewBox={`0 0 ${RADIUS * 2 + STROKE_WIDTH * 2} ${RADIUS * 2 + STROKE_WIDTH * 2}`}
          >
            {/* Track */}
            <circle
              cx={RADIUS + STROKE_WIDTH}
              cy={RADIUS + STROKE_WIDTH}
              r={RADIUS}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={STROKE_WIDTH}
            />
            {/* Progress */}
            <circle
              cx={RADIUS + STROKE_WIDTH}
              cy={RADIUS + STROKE_WIDTH}
              r={RADIUS}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${RADIUS + STROKE_WIDTH} ${RADIUS + STROKE_WIDTH})`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold leading-none">
              {studiedH > 0 ? `${studiedH}h${studiedM.toString().padStart(2, "0")}` : `${studiedM}m`}
            </span>
            <span className="text-[10px] text-muted-foreground">
              de {goalH > 0 ? `${goalH}h${goalM.toString().padStart(2, "0")}` : `${goalM}m`}
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {progressPct >= 100
            ? "Meta atingida! 🎉"
            : `${Math.round(progressPct)}% da meta diária`}
        </p>
      </CardContent>
    </Card>
  )
}
