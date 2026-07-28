import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"

/** Badge padrão de recompensa em XP — usado em toda a app. */
export function XpBadge({ xp, className }: { xp: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary",
        className,
      )}
    >
      <Zap className="h-3 w-3 fill-current" />+{xp} XP
    </span>
  )
}
