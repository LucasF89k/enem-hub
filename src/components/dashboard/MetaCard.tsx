import { db } from "@/lib/db"
import { differenceInDays } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Target } from "lucide-react"

export async function MetaCard({ userId }: { userId: string }) {
  const profile = await db.userProfile.findUnique({ where: { userId } })

  const targetScore = profile?.targetScore ?? 950
  const estimatedScore = profile?.estimatedScore ?? 0
  const examDate = profile?.examDate
  const daysLeft = examDate ? differenceInDays(examDate, new Date()) : null
  const progress = Math.min(Math.round((estimatedScore / targetScore) * 100), 100)
  const targetCourse = profile?.targetCourse ?? "Medicina"

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Meta: {targetCourse}</CardTitle>
        <Target className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold">
              {estimatedScore > 0 ? estimatedScore.toFixed(0) : "-"}
            </p>
            <p className="text-xs text-muted-foreground">nota estimada</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{targetScore.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">meta</p>
          </div>
        </div>

        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">{progress}% da meta atingida</p>
        </div>

        {daysLeft !== null && (
          <p className="text-xs font-medium">
            {daysLeft > 0 ? (
              <span className="text-accent">
                {daysLeft} {daysLeft === 1 ? "dia" : "dias"} para o ENEM
              </span>
            ) : (
              <span className="text-muted-foreground">ENEM encerrado</span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
