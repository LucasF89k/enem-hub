import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Clock, CheckCircle2, XCircle, PenLine, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { SimuladoScoreChart } from "@/components/simulado/SimuladoScoreChart"
import { AchievementToast } from "@/components/achievements/AchievementToast"
import { TEMAS_HISTORICOS } from "@/constants/redacao-bank"

export const metadata = { title: "Resultado" }

const AREA_INFO: Record<string, { label: string; color: string }> = {
  "ciencias-natureza": { label: "Ciências da Natureza", color: "text-green-500" },
  "ciencias-humanas": { label: "Ciências Humanas", color: "text-blue-500" },
  linguagens: { label: "Linguagens e Códigos", color: "text-purple-500" },
  matematica: { label: "Matemática", color: "text-orange-500" },
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 70 ? "text-green-500" : score >= 50 ? "text-yellow-500" : "text-red-500"
  return (
    <div className="flex flex-col items-center">
      <span className={cn("text-5xl font-bold tabular-nums", color)}>{score}%</span>
      <span className="text-sm text-muted-foreground mt-1">Aproveitamento geral</span>
    </div>
  )
}

export default async function SimuladoResultPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const { id: simuladoId, attemptId } = await params

  const attempt = await db.userSimulado.findFirst({
    where: { id: attemptId, userId, simuladoId },
    include: {
      simulado: {
        include: {
          questions: {
            include: {
              question: {
                select: {
                  id: true,
                  statement: true,
                  areaSlug: true,
                  correctId: true,
                  options: { select: { id: true, letter: true, text: true }, orderBy: { letter: "asc" } },
                },
              },
            },
            orderBy: { order: "asc" },
          },
        },
      },
      answers: {
        select: { questionId: true, selectedId: true, isCorrect: true, markedForReview: true },
      },
    },
  })

  if (!attempt) notFound()
  if (attempt.status !== "COMPLETED") redirect(`/simulados/${simuladoId}/${attemptId}`)

  // Build answer map
  const answerMap: Record<string, { selectedId: string | null; isCorrect: boolean }> = {}
  for (const a of attempt.answers) {
    answerMap[a.questionId] = { selectedId: a.selectedId, isCorrect: a.isCorrect }
  }

  // Past attempts for chart
  const pastAttempts = await db.userSimulado.findMany({
    where: { userId, simuladoId, status: "COMPLETED" },
    orderBy: { finishedAt: "asc" },
    select: { id: true, scoreTotal: true, finishedAt: true },
  })

  const chartData = pastAttempts.map((a, i) => ({
    label: `#${i + 1}`,
    score: Math.round(a.scoreTotal ?? 0),
    isCurrent: a.id === attemptId,
  }))

  const totalQuestions = attempt.simulado.questions.length
  const totalCorrect = attempt.answers.filter((a) => a.isCorrect && a.selectedId).length
  const timeSpent = attempt.timeSpent
  const mins = timeSpent ? Math.floor(timeSpent / 60) : null
  const secs = timeSpent ? timeSpent % 60 : null

  // 1º dia do ENEM inclui a redação, sugere o tema do ano do simulado
  const yearMatch = attempt.simulado.title.match(/(19|20)\d{2}/)
  const simYear = yearMatch ? parseInt(yearMatch[0]) : null
  const redacaoTema = TEMAS_HISTORICOS.find((t) => t.ano === simYear)?.tema ?? ""
  const showRedacaoCta = attempt.examDay === 1

  const areaScores = [
    { slug: "ciencias-natureza", score: attempt.scoreCN },
    { slug: "ciencias-humanas", score: attempt.scoreCH },
    { slug: "linguagens", score: attempt.scoreLCT },
    { slug: "matematica", score: attempt.scoreMT },
  ].filter((a) => a.score !== null) as { slug: string; score: number }[]

  // Achievements earned in the last 5 minutes (from finalizeSimulado call).
  // Server Component: roda uma vez por requisição, então ler a hora atual
  // aqui é seguro, diferente de um client component re-renderizado.
  const recentAchievements = await db.userAchievement.findMany({
    where: {
      userId,
      // eslint-disable-next-line react-hooks/purity
      earnedAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
    },
    select: {
      achievement: {
        select: { id: true, name: true, description: true, icon: true, xpReward: true },
      },
    },
    orderBy: { earnedAt: "asc" },
  })

  const newAchievements = recentAchievements.map((ua) => ({
    key: ua.achievement.id,
    name: ua.achievement.name,
    description: ua.achievement.description,
    icon: ua.achievement.icon,
    xpReward: ua.achievement.xpReward,
  }))

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <AchievementToast achievements={newAchievements} />
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/simulados/${simuladoId}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {attempt.simulado.title}
          </Link>
        </Button>
      </div>

      {/* Score hero */}
      <Card>
        <CardContent className="pt-6 pb-5 flex flex-col items-center gap-4">
          <ScoreRing score={Math.round(attempt.scoreTotal ?? 0)} />

          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              {totalCorrect} corretas
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="h-4 w-4 text-red-500" />
              {totalQuestions - totalCorrect} erradas
            </span>
            {mins !== null && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {mins}m{secs ? ` ${secs}s` : ""}
              </span>
            )}
            {attempt.finishedAt && (
              <span>
                {format(attempt.finishedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Redação: completa o 1º dia */}
      {showRedacaoCta && (
        <Link
          href={`/redacao/new${redacaoTema ? `?tema=${encodeURIComponent(redacaoTema)}` : ""}`}
          className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15">
            <PenLine className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Falta a redação!</p>
            <p className="text-xs text-muted-foreground">
              No 1º dia do ENEM você também escreve a redação. Faça agora com 2h de cronômetro.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
        </Link>
      )}

      {/* Per-area scores */}
      {areaScores.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Por área
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {areaScores.map(({ slug, score }) => {
              const info = AREA_INFO[slug] ?? { label: slug, color: "text-foreground" }
              const rounded = Math.round(score)
              return (
                <div key={slug} className="rounded-xl border bg-card px-4 py-3">
                  <p className="text-xs text-muted-foreground">{info.label}</p>
                  <p className={cn("text-2xl font-bold", info.color)}>{rounded}%</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Evolution chart */}
      {chartData.length >= 1 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Evolução
          </h2>
          <Card>
            <CardContent className="pt-4 pb-2">
              <SimuladoScoreChart data={chartData} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Question review */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Gabarito
        </h2>
        <div className="space-y-2">
          {attempt.simulado.questions.map((sq, i) => {
            const q = sq.question
            const ans = answerMap[q.id]
            const isCorrect = ans?.isCorrect ?? false
            const notAnswered = !ans?.selectedId
            const selectedOpt = q.options.find((o) => o.id === ans?.selectedId)
            const correctOpt = q.options.find((o) => o.id === q.correctId)

            return (
              <div
                key={q.id}
                className={cn(
                  "rounded-xl border px-4 py-3",
                  notAnswered
                    ? "border-border bg-muted/30"
                    : isCorrect
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-red-500/30 bg-red-500/5"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full",
                      notAnswered
                        ? "bg-muted text-muted-foreground"
                        : isCorrect
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    )}
                  >
                    {notAnswered ? (
                      <span className="text-[10px] font-bold">{i + 1}</span>
                    ) : isCorrect ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium mb-1">Questão {i + 1}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{q.statement}</p>
                    <div className="mt-1.5 flex flex-wrap gap-2 text-xs">
                      {notAnswered ? (
                        <span className="text-muted-foreground">Não respondida</span>
                      ) : (
                        <>
                          <span className={isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                            Sua: <strong>{selectedOpt?.letter ?? "-"}</strong>
                          </span>
                          {!isCorrect && (
                            <span className="text-green-600 dark:text-green-400">
                              Correta: <strong>{correctOpt?.letter ?? "-"}</strong>
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pb-4">
        <Button asChild variant="outline" className="flex-1">
          <Link href="/simulados">Ver todos</Link>
        </Button>
        <Button asChild className="flex-1">
          <Link href={`/simulados/${simuladoId}`}>Tentar novamente</Link>
        </Button>
      </div>
    </div>
  )
}
