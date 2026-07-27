import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ACHIEVEMENT_DEFS } from "@/lib/achievements"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AchievementCategory } from "@prisma/client"

export const metadata = { title: "Conquistas — Vion" }

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  STREAK: "Sequência",
  STUDY: "Estudo",
  QUESTIONS: "Questões",
  FLASHCARDS: "Flashcards",
  SIMULADO: "Simulados",
  REDACAO: "Redação",
  SCORE: "Nível & XP",
  SPECIAL: "Especial",
}

export default async function ConquistasPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id

  const earned = await db.userAchievement.findMany({
    where: { userId },
    select: {
      earnedAt: true,
      achievement: { select: { condition: true } },
    },
  })

  const earnedMap = new Map(
    earned.map((e) => [
      JSON.parse(e.achievement.condition).key as string,
      e.earnedAt,
    ])
  )

  const categories = Array.from(
    new Set(ACHIEVEMENT_DEFS.map((d) => d.category))
  ) as AchievementCategory[]

  const total = ACHIEVEMENT_DEFS.filter((d) => !d.isHidden).length
  const earnedCount = ACHIEVEMENT_DEFS.filter(
    (d) => !d.isHidden && earnedMap.has(d.key)
  ).length

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Conquistas</h1>
        <p className="text-sm text-muted-foreground">
          {earnedCount} / {total} desbloqueadas
        </p>
        {/* Progress bar */}
        <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${(earnedCount / total) * 100}%` }}
          />
        </div>
      </div>

      {categories.map((cat) => {
        const defs = ACHIEVEMENT_DEFS.filter((d) => d.category === cat)
        const visible = defs.filter(
          (d) => !d.isHidden || earnedMap.has(d.key)
        )
        if (!visible.length) return null

        return (
          <section key={cat} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {CATEGORY_LABELS[cat]}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {visible.map((def) => {
                const date = earnedMap.get(def.key)
                const isEarned = !!date

                return (
                  <div
                    key={def.key}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                      isEarned
                        ? "bg-card border-primary/20"
                        : "bg-muted/30 border-transparent opacity-60"
                    )}
                  >
                    <span
                      className={cn(
                        "text-3xl w-10 h-10 flex items-center justify-center rounded-full shrink-0",
                        isEarned ? "bg-primary/10" : "bg-muted grayscale"
                      )}
                    >
                      {def.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{def.name}</p>
                        {isEarned && (
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            +{def.xpReward} XP
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{def.description}</p>
                      {isEarned && date && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(date).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
