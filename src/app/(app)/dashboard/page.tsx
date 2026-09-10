import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { differenceInDays } from "date-fns"
import { startOfDayBR, addDaysBR } from "@/lib/date-br"
import { Timer, Repeat, Brain, CalendarDays } from "lucide-react"

import { detectTrail, getTrailConfig } from "@/lib/trail"
import { effectiveStreak } from "@/lib/xp"
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
        lastStudyDate: true,
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
  const streak = effectiveStreak(profile?.streak ?? 0, profile?.lastStudyDate ?? null)
  const estimatedScore = profile?.estimatedScore ?? 0
  const daysUntilExam = profile?.examDate
    ? Math.max(0, differenceInDays(profile.examDate, new Date()))
    : null
  const trailConfig = getTrailConfig(detectTrail(profile?.examDate))

  const curso = findCurso(profile?.targetCourse) ?? findCurso("medicina")!
  const selectedUniId = findUniversidade(profile?.targetInstitution)?.id ?? null
  const examDateISO = profile?.examDate ? profile.examDate.toISOString() : null

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col px-6 pb-16 pt-1 sm:px-8">
      {/* Hero: saudação/streak agora ficam no header (economia de espaço no topo) */}
      <div className="flex flex-col items-center">
        <div className="opal-enter mt-2 mb-5" style={{ animationDelay: "0ms" }}>
          <StudyScoreGauge minutes={minutesToday} goalMinutes={dailyGoal} label="Meta de estudo hoje" />
        </div>

        <div
          className="opal-enter flex w-full items-start justify-center gap-4"
          style={{ animationDelay: "140ms" }}
        >
          <MetricPill icon={Timer} value={`${minutesToday}m`} label="Foco" />
          <MetricPill icon={Repeat} value={streak} label="Consistência" />
          <MetricPill icon={Brain} value={dueReviews} label="Revisão" />
        </div>

        <div className="opal-enter mt-6 w-full" style={{ animationDelay: "210ms" }}>
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

        {/* Contador regressivo do ENEM, com a trilha embutida.
            Antes tinha max-w-[360px] enquanto os cards vizinhos são w-full,
            isso fazia as bordas não baterem ao rolar (o "torto" real). */}
        <div className="opal-enter w-full" style={{ animationDelay: "280ms" }}>
          <ExamCountdown
            examDate={examDateISO}
            trailLabel={trailConfig.label}
            trailPeriod={trailConfig.description}
            trailColor={trailConfig.color}
          />
        </div>

        <div className="opal-enter mt-8 w-full" style={{ animationDelay: "350ms" }}>
          <QuietStatsRow
            streak={streak}
            estimatedScore={estimatedScore}
            daysUntilExam={daysUntilExam}
          />
        </div>

        <div className="opal-enter w-full" style={{ animationDelay: "420ms" }}>
          <TargetInstitutionCard
            institution={profile?.targetInstitution}
            cursoSlug={curso.slug}
            estimatedScore={estimatedScore}
          />
        </div>
      </div>

      {/* Notas de corte: visível no fluxo principal, adaptado ao curso */}
      <section className="opal-enter mt-10" style={{ animationDelay: "490ms" }}>
        <NotasCorteBoard
          cursoSlug={curso.slug}
          selectedUniId={selectedUniId}
          estimatedScore={estimatedScore}
        />
      </section>
    </div>
  )
}
