import { Clock, HelpCircle, Brain, CheckCircle2, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { XpBadge } from "@/components/gamification/XpBadge"

type QuestKind = "time" | "questions" | "flashcards"

export interface Quest {
  kind: QuestKind
  label: string
  current: number
  target: number
  xp: number
}

const ICON: Record<QuestKind, React.ReactNode> = {
  time: <Clock className="h-4 w-4" />,
  questions: <HelpCircle className="h-4 w-4" />,
  flashcards: <Brain className="h-4 w-4" />,
}

/** Missões diárias no estilo Duolingo — progresso a partir dos dados reais do dia. */
export function DailyQuests({ quests }: { quests: Quest[] }) {
  const doneCount = quests.filter((q) => q.current >= q.target).length

  return (
    <div className="w-full rounded-2xl border p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Target className="h-4 w-4 text-primary" />
        </div>
        <p className="text-sm font-semibold">Missões diárias</p>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {doneCount}/{quests.length}
        </span>
      </div>

      <div className="space-y-3">
        {quests.map((q) => {
          const pct = Math.min(100, q.target > 0 ? (q.current / q.target) * 100 : 0)
          const done = q.current >= q.target
          return (
            <div key={q.kind} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  done ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground",
                )}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : ICON[q.kind]}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn("truncate text-[13px]", done && "text-muted-foreground")}>
                    {q.label}
                  </p>
                  <XpBadge xp={q.xp} className={cn(done && "opacity-60")} />
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full transition-all", done ? "bg-accent" : "bg-primary")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                    {Math.min(q.current, q.target)}/{q.target}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
