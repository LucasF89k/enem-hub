import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { startOfDay, addDays, differenceInDays } from "date-fns"
import { CalendarDays } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { detectTrail, getTrailConfig } from "@/lib/trail"
import { FocusRing } from "@/components/dashboard/FocusRing"
import { LevelBadge } from "@/components/dashboard/LevelBadge"
import { QuietStatsRow } from "@/components/dashboard/QuietStatsRow"
import { TargetInstitutionCard } from "@/components/dashboard/TargetInstitutionCard"
import { NotasCorteBoard } from "@/components/dashboard/NotasCorteBoard"
import { ExamCountdown } from "@/components/dashboard/ExamCountdown"
import { DailyQuests, type Quest } from "@/components/dashboard/DailyQuests"
import { findUniversidade } from "@/constants/universidades"
import { findCurso } from "@/constants/cursos"

export const metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const todayStart = startOfDay(new Date())
  const tomorrowStart = addDays(todayStart, 1)

  const [profile, todayAgg, questionsToday, flashcardsToday] = await Promise.all([
    db.userProfile.findUnique({
      where: { userId },
      select: {
        currentLevel: true,
        totalXP: true,
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
    db.userQuestion.count({ where: { userId, answeredAt: { gte: todayStart, lt: tomorrowStart } } }),
    db.flashcardReview.count({
      where: { userId, reviewedAt: { gte: todayStart, lt: tomorrowStart } },
    }),
  ])

  const minutesToday = todayAgg._sum.duration ?? 0
  const dailyGoal = profile?.dailyStudyGoal ?? 120
  const level = profile?.currentLevel ?? 1
  const totalXP = profile?.totalXP ?? 0
  const streak = profile?.streak ?? 0
  const estimatedScore = profile?.estimatedScore ?? 0
  const daysUntilExam = profile?.examDate
    ? Math.max(0, differenceInDays(profile.examDate, new Date()))
    : null
  const trailConfig = getTrailConfig(detectTrail(profile?.examDate))
  const firstName = session.user.name?.split(" ")[0] ?? ""
  const initials = session.user.name
    ? session.user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U"

  const curso = findCurso(profile?.targetCourse) ?? findCurso("medicina")!
  const selectedUniId = findUniversidade(profile?.targetInstitution)?.id ?? null
  const examDateISO = profile?.examDate ? profile.examDate.toISOString() : null

  const quests: Quest[] = [
    { kind: "time", label: `Estude ${dailyGoal} min hoje`, current: minutesToday, target: dailyGoal, xp: 30 },
    { kind: "questions", label: "Responda 10 questões", current: questionsToday, target: 10, xp: 20 },
    { kind: "flashcards", label: "Revise 20 flashcards", current: flashcardsToday, target: 20, xp: 20 },
  ]

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col px-6 pb-16 pt-4 sm:px-8">
      {/* Topbar — nível/XP à esquerda, avatar à direita */}
      <div className="flex items-center justify-between">
        <LevelBadge level={level} totalXP={totalXP} />
        <Link href="/profile">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? "Avatar"} />
            <AvatarFallback className="bg-primary/15 text-[11px] font-medium text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>

      {/* Conteúdo — coluna de foco centralizada */}
      <div className="flex flex-col items-center">
        <div className="mt-5 text-center">
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

      {/* Missões diárias */}
      <section className="mt-8">
        <DailyQuests quests={quests} />
      </section>

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
