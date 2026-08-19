import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { differenceInDays } from "date-fns"
import { startOfDayBR, addDaysBR } from "@/lib/date-br"
import { Flame, Timer, Repeat, Brain, CalendarDays } from "lucide-react"

import { detectTrail, getTrailConfig } from "@/lib/trail"
import { StudyScoreGauge } from "@/components/dashboard/StudyScoreGauge"
import { MetricPill } from "@/components/dashboard/MetricPill"
import { StudyNudgeCard } from "@/components/dashboard/StudyNudgeCard"
import { QuietStatsRow } from "@/components/dashboard/QuietStatsRow"
import { TargetInstitutionCard } from "@/components/dashboard/TargetInstitutionCard"
import { NotasCorteBoard } from "@/components/dashboard/NotasCorteBoard"
import { ExamCountdown } from "@/components/dashboard/ExamCountdown"
import { findUniversidade } from "@/constants/universidades"
import { findCurso } from "@/constants/cursos"

export const metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const todayStart = startOfDayBR()
  const tomorrowStart = addDaysBR(todayStart, 1)

  const [profile, todayAgg, dueReviews] = await Promise.all([
    db.userProfile.findUnique({
      where: { userId },
      select: {
        streak: true,
        examDate: true,
        estimatedScore: true,
        dailyStudyGoal: true,
        targetCourse: true,
        targetInstitution: true,
      },
    }),
    db.studySession.aggregate({
      where: { userId, date: { gte: todayStart, lt: tomorrowStart } },
      _sum: { duration: true },
    }),
    db.flashcardReview.count({
      where: { userId, nextReview: { lte: new Date() } },
    }),
  ])

  const minutesToday = todayAgg._sum.duration ?? 0
  const dailyGoal = profile?.dailyStudyGoal ?? 120
  const streak = profile?.streak ?? 0
  const estimatedScore = profile?.estimatedScore ?? 0
  const daysUntilExam = profile?.examDate
    ? Math.max(0, differenceInDays(profile.examDate, new Date()))
    : null
  const trailConfig = getTrailConfig(detectTrail(profile?.examDate))
  const firstName = session.user.name?.split(" ")[0] ?? ""

  const curso = findCurso(profile?.targetCourse) ?? findCurso("medicina")!
  const selectedUniId = findUniversidade(profile?.targetInstitution)?.id ?? null
  const examDateISO = profile?.examDate ? profile.examDate.toISOString() : null

  // "Study Score" — composto por Foco (meta do dia), Consistência (streak) e Revisão (flashcards em dia)
  const focoScore = Math.min(100, dailyGoal > 0 ? (minutesToday / dailyGoal) * 100 : 0)
  const consistenciaScore = Math.min(100, streak * 12)
  const revisaoScore = dueReviews === 0 ? 100 : Math.max(20, 100 - dueReviews * 4)
  const studyScore = Math.round((focoScore + consistenciaScore + revisaoScore) / 3)
  const scoreTrend: "up" | "down" = studyScore >= 60 ? "up" : "down"

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col px-6 pb-16 pt-3 sm:px-8">
      {/* Hero — inspirado no Opal: gauge de score + pills + streak */}
      <div className="flex flex-col items-center">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-lg font-light text-foreground">
            Olá, <b className="font-medium">{firstName}</b>
          </h1>
          <div className="flex items-center gap-1 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-sm font-medium text-warning">
            <Flame className="h-3.5 w-3.5 fill-warning" />
            {streak}
          </div>
        </div>

        <div className="my-6">
          <StudyScoreGauge score={studyScore} label="Score de Estudo" trend={scoreTrend} />
        </div>

        <div className="flex w-full items-start justify-center gap-4">
          <MetricPill icon={Timer} value={`${minutesToday}m`} label="Foco" />
          <MetricPill icon={Repeat} value={streak} label="Consistência" />
          <MetricPill icon={Brain} value={dueReviews} label="Revisão" />
        </div>

        <div className="mt-6 w-full">
          {dueReviews > 0 ? (
            <StudyNudgeCard
              icon={Brain}
              eyebrow="Flashcards"
              title="Hora de revisar"
              description={`Você tem ${dueReviews} card${dueReviews === 1 ? "" : "s"} esperando revisão hoje.`}
              ctaLabel="Revisar agora"
              href="/flashcards"
            />
          ) : minutesToday < dailyGoal ? (
            <StudyNudgeCard
              icon={CalendarDays}
              eyebrow="Plano de hoje"
              title="Continue firme"
              description={`Faltam ${Math.max(0, dailyGoal - minutesToday)} min pra bater sua meta de hoje.`}
              ctaLabel="Ver plano de estudos"
              href="/planner"
            />
          ) : (
            <StudyNudgeCard
              icon={CalendarDays}
              eyebrow="Plano de hoje"
              title="Meta batida!"
              description="Você já estudou o suficiente hoje. Que tal adiantar amanhã?"
              ctaLabel="Ver plano de estudos"
              href="/planner"
            />
          )}
        </div>

        <div className="my-8 h-px w-full bg-border" />

        {/* Contador regressivo do ENEM — com a trilha embutida */}
        <div className="w-full max-w-[360px]">
          <ExamCountdown
            examDate={examDateISO}
            trailLabel={trailConfig.label}
            trailPeriod={trailConfig.description}
          />
        </div>

        <div className="mt-8 w-full">
          <QuietStatsRow
            streak={streak}
            estimatedScore={estimatedScore}
            daysUntilExam={daysUntilExam}
          />
        </div>

        <TargetInstitutionCard
          institution={profile?.targetInstitution}
          cursoSlug={curso.slug}
          estimatedScore={estimatedScore}
        />
      </div>

      {/* Notas de corte — visível no fluxo principal, adaptado ao curso */}
      <section className="mt-10">
        <NotasCorteBoard
          cursoSlug={curso.slug}
          selectedUniId={selectedUniId}
          estimatedScore={estimatedScore}
        />
      </section>
    </div>
  )
}
