import { db } from "@/lib/db"
import { detectTrail, getTrailConfig } from "@/lib/trail"
import { Card, CardContent } from "@/components/ui/card"
import { Route, Calendar, Lightbulb } from "lucide-react"
import { differenceInDays } from "date-fns"
import { cn } from "@/lib/utils"

export async function TrailBadge({ userId }: { userId: string }) {
  const profile = await db.userProfile.findUnique({
    where: { userId },
    select: { examDate: true, trail: true },
  })

  const detectedTrail = detectTrail(profile?.examDate)
  const config = getTrailConfig(detectedTrail)
  const daysLeft = profile?.examDate
    ? Math.max(0, differenceInDays(profile.examDate, new Date()))
    : null

  return (
    <Card className={cn("border", config.badgeColor)}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("h-7 w-7 rounded-full flex items-center justify-center", config.color)}>
              <Route className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                Sua trilha
              </p>
              <p className="text-base font-bold leading-tight">{config.label}</p>
            </div>
          </div>
          <div className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", config.badgeColor)}>
            {config.description}
          </div>
        </div>

        {daysLeft !== null && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>
              {daysLeft > 0
                ? `${daysLeft} dias até o ENEM`
                : "ENEM encerrado"}
            </span>
          </div>
        )}

        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{config.tip}</span>
        </div>

        {/* Allocation bar */}
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Distribuição do tempo
          </p>
          <div className="flex h-2 rounded-full overflow-hidden gap-px">
            <div
              className="bg-blue-500 rounded-l-full"
              style={{ width: `${config.ratios.content * 100}%` }}
              title={`Teoria: ${Math.round(config.ratios.content * 100)}%`}
            />
            <div
              className="bg-green-500"
              style={{ width: `${config.ratios.questions * 100}%` }}
              title={`Questões: ${Math.round(config.ratios.questions * 100)}%`}
            />
            <div
              className="bg-purple-500"
              style={{ width: `${config.ratios.flashcards * 100}%` }}
              title={`Flashcards: ${Math.round(config.ratios.flashcards * 100)}%`}
            />
            <div
              className="bg-orange-500 rounded-r-full"
              style={{ width: `${config.ratios.simulados * 100}%` }}
              title={`Simulados: ${Math.round(config.ratios.simulados * 100)}%`}
            />
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
              Teoria {Math.round(config.ratios.content * 100)}%
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
              Questões {Math.round(config.ratios.questions * 100)}%
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-500" />
              Cards {Math.round(config.ratios.flashcards * 100)}%
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500" />
              Simulados {Math.round(config.ratios.simulados * 100)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
