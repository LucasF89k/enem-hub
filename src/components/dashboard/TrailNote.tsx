import { Route, Lightbulb } from "lucide-react"
import { getTrailConfig, type TrailType } from "@/lib/trail"
import { cn } from "@/lib/utils"

/** Card destacado com a trilha atual e a dica estratégica. */
export function TrailNote({ trail }: { trail: TrailType }) {
  const config = getTrailConfig(trail)
  return (
    <div className="mt-8 w-full max-w-[360px] rounded-2xl border p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            config.color,
          )}
        >
          <Route className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Sua trilha</p>
          <p className="text-base font-bold leading-tight">Trilha {config.label}</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
      </div>
      <p className="mt-3 flex gap-1.5 text-xs leading-relaxed text-muted-foreground">
        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <span>{config.tip}</span>
      </p>
    </div>
  )
}
