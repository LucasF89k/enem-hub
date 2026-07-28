import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { startOfDay, addDays, differenceInDays } from "date-fns"
import { CalendarDays } from "lucide-react"

import { detectTrail, getTrailConfig } from "@/lib/trail"
import { FocusRing } from "@/components/dashboard/FocusRing"
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

  const todayStart = startOfDay(new Date())
  const tomorrowStart = addDays(todayStart, 1)

  const [profile, todayAgg] = await Promise.all([
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

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col px-6 pb-16 pt-3 sm:px-8">
      {/* Conteúdo — coluna de foco centralizada */}
      <div className="flex flex-col items-center">
        <div className="text-center">
          <h1 className="text-lg font-light text-foreground">
            Olá, <b className="font-medium">{firstName}</b>
          </h1>
        </div>

        <div className="my-6">
          <FocusRing minutesToday={minutesToday} dailyGoalMinutes={dailyGoal} />
        </div>

        {/* Um único CTA — o próximo passo vive dentro do Planner */}
        <Link
          href="/planner"
          className="flex items-center gap-2 rounded-full bg-primary px-10 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <CalendarDays className="h-4 w-4" />
          Ver plano de estudos
        </Link>

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
