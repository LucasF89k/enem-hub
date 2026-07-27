import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, FileText, Trophy, ArrowLeft, Play } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { StartSimuladoButton } from "./start-button"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const s = await db.simulado.findUnique({ where: { id }, select: { title: true } })
  return { title: s ? `${s.title} — Vion` : "Simulado — Vion" }
}

export default async function SimuladoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const { id: simuladoId } = await params

  const simulado = await db.simulado.findUnique({
    where: { id: simuladoId },
    include: {
      _count: { select: { questions: true } },
      questions: {
        include: { question: { select: { areaSlug: true } } },
        orderBy: { order: "asc" },
      },
    },
  })

  if (!simulado) notFound()

  const attempts = await db.userSimulado.findMany({
    where: { userId, simuladoId },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      status: true,
      scoreTotal: true,
      scoreCN: true,
      scoreCH: true,
      scoreLCT: true,
      scoreMT: true,
      startedAt: true,
      finishedAt: true,
      timeSpent: true,
    },
  })

  const inProgress = attempts.find((a) => a.status === "IN_PROGRESS")
  const completed = attempts.filter((a) => a.status === "COMPLETED")
  const bestScore = completed.length > 0
    ? Math.max(...completed.map((a) => a.scoreTotal ?? 0))
    : null

  // Count questions by area
  const areaCount: Record<string, number> = {}
  for (const sq of simulado.questions) {
    const area = sq.question.areaSlug ?? "outros"
    areaCount[area] = (areaCount[area] ?? 0) + 1
  }

  const AREA_NAME: Record<string, string> = {
    "ciencias-natureza": "Ciências da Natureza",
    "ciencias-humanas": "Ciências Humanas",
    linguagens: "Linguagens",
    matematica: "Matemática",
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/simulados">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Simulados
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{simulado.title}</h1>
        {simulado.description && (
          <p className="text-sm text-muted-foreground">{simulado.description}</p>
        )}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            {simulado._count.questions} questões
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {simulado.duration} min
          </span>
          {bestScore !== null && (
            <span className="flex items-center gap-1 text-primary font-medium">
              <Trophy className="h-4 w-4" />
              Melhor resultado: {bestScore}%
            </span>
          )}
        </div>
      </div>

      {/* Distribution by area */}
      {Object.keys(areaCount).length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(areaCount).map(([area, count]) => (
            <div key={area} className="rounded-lg border bg-card px-3 py-2">
              <p className="text-xs text-muted-foreground">{AREA_NAME[area] ?? area}</p>
              <p className="text-lg font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">questões</p>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="space-y-2">
        {inProgress ? (
          <>
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400 mb-2">
              Você tem uma tentativa em andamento desde{" "}
              {format(inProgress.startedAt, "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
            </div>
            <Button asChild className="w-full gap-2" size="lg">
              <Link href={`/simulados/${simuladoId}/${inProgress.id}`}>
                <Play className="h-4 w-4 fill-current" />
                Continuar tentativa
              </Link>
            </Button>
            <StartSimuladoButton simuladoId={simuladoId} label="Iniciar nova tentativa" variant="outline" />
          </>
        ) : (
          <StartSimuladoButton simuladoId={simuladoId} label="Iniciar simulado" />
        )}
      </div>

      {/* Past attempts */}
      {completed.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Tentativas anteriores
          </h2>
          <div className="space-y-2">
            {completed.map((a, i) => {
              const mins = a.timeSpent ? Math.floor(a.timeSpent / 60) : null
              const secs = a.timeSpent ? a.timeSpent % 60 : null
              return (
                <Link
                  key={a.id}
                  href={`/simulados/${simuladoId}/${a.id}/result`}
                  className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Tentativa {completed.length - i}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(a.startedAt, "dd 'de' MMM yyyy", { locale: ptBR })}
                      {mins != null && ` · ${mins}m${secs ? ` ${secs}s` : ""}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-lg font-bold",
                      (a.scoreTotal ?? 0) >= 70 ? "text-green-500" : (a.scoreTotal ?? 0) >= 50 ? "text-yellow-500" : "text-red-500"
                    )}>
                      {a.scoreTotal ?? 0}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">Ver resultado</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
