import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ACHIEVEMENT_DEFS, PROGRESS_METRICS, getUserStats } from "@/lib/achievements"
import { XpBadge } from "@/components/gamification/XpBadge"
import { cn } from "@/lib/utils"
import type { AchievementCategory } from "@prisma/client"

export const metadata = { title: "Conquistas" }

/** Formata um valor de métrica (minutos de estudo viram horas). */
function fmtMetric(metric: string, v: number): string {
  if (metric === "totalStudyMinutes") {
    const h = v / 60
    return `${Number.isInteger(h) ? h : Math.round(h * 10) / 10}h`
  }
  return String(v)
}

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

  const [earned, stats] = await Promise.all([
    db.userAchievement.findMany({
      where: { userId },
      select: {
        earnedAt: true,
        achievement: { select: { condition: true } },
      },
    }),
    getUserStats(userId),
  ])

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

                const pm = PROGRESS_METRICS[def.key]
                const current = pm ? (stats[pm.metric] as number) : 0
                const target = pm?.target ?? 0
                const ratio = isEarned
                  ? 1
                  : pm && target > 0
                    ? Math.min(1, current / target)
                    : 0
                const showBar = !!pm && !isEarned

                return (
                  <div
                    key={def.key}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                      isEarned ? "bg-card border-primary/20" : "bg-muted/20 border-transparent"
                    )}
                  >
                    {/* Anel de progresso — vai "enchendo" e colorindo conforme avança */}
                    <div className="relative h-12 w-12 shrink-0">
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `conic-gradient(var(--primary) ${ratio * 360}deg, var(--border) 0)`,
                        }}
                      />
                      <div className="absolute inset-[3px] flex items-center justify-center rounded-full bg-background">
                        <span
                          className="text-2xl leading-none"
                          style={{
                            filter: isEarned ? "none" : `grayscale(${(1 - ratio) * 100}%)`,
                            opacity: isEarned ? 1 : 0.45 + ratio * 0.55,
                          }}
                        >
                          {def.icon}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn("font-semibold text-sm truncate", !isEarned && "text-muted-foreground")}>
                          {def.name}
                        </p>
                        <XpBadge xp={def.xpReward} className={cn("shrink-0", !isEarned && "opacity-60")} />
                      </div>
                      <p className="text-xs text-muted-foreground">{def.description}</p>

                      {showBar && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${ratio * 100}%` }}
                            />
                          </div>
                          <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                            {fmtMetric(pm.metric, current)}/{fmtMetric(pm.metric, target)}
                          </span>
                        </div>
                      )}

                      {isEarned && date && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Desbloqueada em {new Date(date).toLocaleDateString("pt-BR")}
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
