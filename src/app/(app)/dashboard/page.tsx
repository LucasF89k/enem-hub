import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { startOfDay, addDays, subDays, differenceInDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { BarChart2, Calendar, Trophy, ChevronRight } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { detectTrail } from "@/lib/trail"
import { FocusRing } from "@/components/dashboard/FocusRing"
import { LevelBadge } from "@/components/dashboard/LevelBadge"
import { NextTaskCard, type NextTask } from "@/components/dashboard/NextTaskCard"
import { QuietStatsRow } from "@/components/dashboard/QuietStatsRow"
import { TargetInstitutionCard } from "@/components/dashboard/TargetInstitutionCard"
import { NotasCorteBoard } from "@/components/dashboard/NotasCorteBoard"
import { ExamCountdown } from "@/components/dashboard/ExamCountdown"
import { TrailNote } from "@/components/dashboard/TrailNote"
import { findUniversidade } from "@/constants/universidades"
import { findCurso } from "@/constants/cursos"

export const metadata = { title: "Dashboard" }

/** Próxima tarefa recomendada: tópico prioritário ainda não estudado nos últimos 7 dias. */
async function getNextTask(userId: string): Promise<NextTask | null> {
  const recent = await db.studySession.findMany({
    where: { userId, date: { gte: subDays(new Date(), 7) }, topicId: { not: null } },
    select: { topicId: true },
    distinct: ["topicId"],
  })
  const recentIds = recent.map((s) => s.topicId).filter((id): id is string => id !== null)

  const topic = await db.topic.findFirst({
    where: recentIds.length > 0 ? { id: { notIn: recentIds } } : {},
    orderBy: [{ importance: "desc" }, { frequency: "desc" }],
    include: { discipline: { include: { area: { select: { slug: true } } } } },
  })
  if (!topic) return null

  return {
    title: topic.name,
    type: "Teoria",
    duration: 25,
    href: `/study/${topic.discipline.area.slug}/${topic.discipline.slug}/${topic.slug}`,
  }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const todayStart = startOfDay(new Date())
  const tomorrowStart = addDays(todayStart, 1)

  const [profile, todayAgg, task] = await Promise.all([
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
    getNextTask(userId),
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
  const trail = detectTrail(profile?.examDate)
  const firstName = session.user.name?.split(" ")[0] ?? ""
  const initials = session.user.name
    ? session.user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U"

  const curso = findCurso(profile?.targetCourse) ?? findCurso("medicina")!
  const selectedUniId = findUniversidade(profile?.targetInstitution)?.id ?? null
  const examDateISO = profile?.examDate ? profile.examDate.toISOString() : null

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col px-6 pb-16 pt-5 sm:min-h-[calc(100vh-11rem)] sm:justify-center sm:px-8 sm:pt-6 md:min-h-[calc(100vh-9rem)]">
      {/* Topbar */}
      <div className="flex items-center justify-between">
        <LevelBadge level={level} totalXP={totalXP} />
        <Avatar className="h-8 w-8">
          <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? "Avatar"} />
          <AvatarFallback className="bg-primary/15 text-[11px] font-medium text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
      <p className="mt-3 text-[12.5px] tracking-wide text-muted-foreground">
        {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
      </p>

      {/* Conteúdo — coluna de foco centralizada */}
      <div className="flex flex-col items-center">
        <div className="mt-7 text-center">
          <h1 className="text-lg font-light text-foreground">
            Olá, <b className="font-medium">{firstName}</b>
          </h1>
        </div>

        <div className="my-7">
          <FocusRing minutesToday={minutesToday} dailyGoalMinutes={dailyGoal} />
        </div>

        <NextTaskCard task={task} />

        {task && (
          <Link
            href={task.href}
            className="mt-6 rounded-full bg-primary px-11 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Começar agora
          </Link>
        )}

        <div className="my-9 h-px w-full bg-border" />

        {/* Contador regressivo do ENEM — em destaque */}
        <div className="w-full max-w-[360px]">
          <ExamCountdown examDate={examDateISO} />
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

        <TrailNote trail={trail} />
      </div>

      {/* Notas de corte — visível no fluxo principal, adaptado ao curso */}
      <section className="mt-10">
        <NotasCorteBoard
          cursoSlug={curso.slug}
          selectedUniId={selectedUniId}
          estimatedScore={estimatedScore}
        />
      </section>

      {/* Mais detalhes — mantém acesso ao resto sem a grade densa antiga */}
      <details className="group mt-10">
        <summary className="flex cursor-pointer list-none items-center justify-center gap-1.5 text-xs uppercase tracking-[0.1em] text-muted-foreground">
          Mais detalhes
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
        </summary>

        <div className="mt-6 space-y-4">
          <div className="divide-y rounded-2xl border">
            {[
              { icon: BarChart2, label: "Analytics e evolução", href: "/analytics" },
              { icon: Calendar, label: "Plano de estudos completo", href: "/planner" },
              { icon: Trophy, label: "Conquistas", href: "/conquistas" },
            ].map(({ icon: Icon, label, href }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between px-4 py-3.5 text-sm hover:bg-muted/40"
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {label}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </details>
    </div>
  )
}
