import { db } from "@/lib/db"
import { TOP_FACULDADES_MEDICINA } from "@/constants/medicina-cutoffs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Stethoscope, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

async function estimateCurrentScore(userId: string): Promise<number | null> {
  const simulados = await db.userSimulado.findMany({
    where: { userId, status: "COMPLETED" },
    select: { scoreTotal: true },
    orderBy: { finishedAt: "desc" },
    take: 3,
  })
  if (!simulados.length) return null
  const avg = simulados.reduce((s, a) => s + (a.scoreTotal ?? 0), 0) / simulados.length
  // scoreTotal is percentage (0-100), convert to ENEM scale (0-1000)
  return Math.round(avg * 10)
}

export async function MedicinaWidget({ userId }: { userId: string }) {
  const [profile, estimatedScore] = await Promise.all([
    db.userProfile.findUnique({
      where: { userId },
      select: { targetScore: true, targetCourse: true },
    }),
    estimateCurrentScore(userId),
  ])

  const targetScore = profile?.targetScore ?? 800
  const currentScore = estimatedScore

  const reachable = currentScore
    ? TOP_FACULDADES_MEDICINA.filter((f) => currentScore >= f.notaCorte2024 - 10)
    : []

  const gap = currentScore ? targetScore - currentScore : null

  const top5 = TOP_FACULDADES_MEDICINA.slice(0, 5)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10">
            <Stethoscope className="h-3.5 w-3.5 text-red-500" />
          </div>
          <CardTitle className="text-sm font-semibold">Medicina — Notas de Corte</CardTitle>
          <Badge variant="secondary" className="ml-auto text-[10px]">2024</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current score vs target */}
        {currentScore ? (
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                Nota estimada
              </p>
              <p className="text-xl font-bold tabular-nums">{currentScore}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                Meta
              </p>
              <p className="text-xl font-bold tabular-nums text-primary">{targetScore}</p>
            </div>
            {gap !== null && (
              <>
                <div className="h-8 w-px bg-border" />
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                    Gap
                  </p>
                  <p className={cn(
                    "text-xl font-bold tabular-nums",
                    gap <= 0 ? "text-green-500" : "text-amber-500"
                  )}>
                    {gap <= 0 ? "✓ Meta" : `−${gap}`}
                  </p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4 shrink-0" />
            <span>Complete simulados para ver sua nota estimada</span>
          </div>
        )}

        {/* Reachable counter */}
        {currentScore && (
          <div className="flex items-center gap-2 text-xs">
            {reachable.length > 0 ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                <span className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{reachable.length}</span>{" "}
                  {reachable.length === 1 ? "faculdade alcançável" : "faculdades alcançáveis"} com sua nota atual
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="text-muted-foreground">Nenhuma faculdade alcançável ainda — continue estudando!</span>
              </>
            )}
          </div>
        )}

        {/* Top 5 cutoff table */}
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            Top 5 — nota de corte
          </p>
          {top5.map((f) => {
            const isReachable = currentScore ? currentScore >= f.notaCorte2024 - 10 : false
            const diff = currentScore ? Math.round(f.notaCorte2024 - currentScore) : null

            return (
              <div
                key={f.sigla}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                  isReachable
                    ? "bg-green-500/8 border border-green-500/20"
                    : "bg-muted/30"
                )}
              >
                <span className="font-medium w-20 truncate shrink-0">{f.sigla}</span>
                <span className="text-muted-foreground flex-1 truncate">{f.estado}</span>
                <span className="font-semibold tabular-nums shrink-0">{f.notaCorte2024}</span>
                {diff !== null && (
                  <span className={cn(
                    "text-[10px] w-12 text-right shrink-0",
                    isReachable ? "text-green-500" : "text-muted-foreground"
                  )}>
                    {isReachable ? "✓" : `−${diff}`}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          Notas de corte SISU 2024 • Dados para referência
        </p>
      </CardContent>
    </Card>
  )
}
