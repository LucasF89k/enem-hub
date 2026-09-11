import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getTrailConfig } from "@/lib/trail"
import { ACHIEVEMENT_DEFS } from "@/lib/achievements"
import { effectiveStreak } from "@/lib/xp"
import { differenceInDays } from "date-fns"
import Link from "next/link"
import { AvatarUpload } from "@/components/profile/AvatarUpload"
import { Badge } from "@/components/ui/badge"
import {
  Hourglass,
  Flame,
  Globe2,
  Target,
  Trophy,
  Calendar,
  Clock,
  GraduationCap,
  ChevronRight,
  Lock,
} from "lucide-react"
import { findCurso } from "@/constants/cursos"
import { findUniversidade } from "@/constants/universidades"

export const metadata = { title: "Perfil" }

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const [user, profile, focusAgg, myXPRow, earnedRows] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, image: true, createdAt: true },
    }),
    db.userProfile.findUnique({
      where: { userId },
      select: {
        targetScore: true,
        targetCourse: true,
        targetInstitution: true,
        examDate: true,
        dailyStudyGoal: true,
        currentLevel: true,
        totalXP: true,
        streak: true,
        longestStreak: true,
        lastStudyDate: true,
        trail: true,
        estimatedScore: true,
      },
    }),
    db.studySession.aggregate({ where: { userId }, _sum: { duration: true } }),
    db.userProfile.findUnique({ where: { userId }, select: { totalXP: true } }),
    db.userAchievement.findMany({
      where: { userId },
      select: { earnedAt: true, achievement: { select: { condition: true } } },
    }),
  ])

  if (!user) redirect("/login")

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U"

  const trailConfig = profile ? getTrailConfig(profile.trail) : null
  const daysLeft = profile?.examDate
    ? Math.max(0, differenceInDays(profile.examDate, new Date()))
    : null

  const xpToNext = profile ? 500 - (profile.totalXP % 500) : 500
  const levelProgress = profile ? ((profile.totalXP % 500) / 500) * 100 : 0

  // Horas de foco (total acumulado)
  const focusMinutes = focusAgg._sum.duration ?? 0
  const focusHours = focusMinutes / 60
  const focusLabel =
    focusMinutes === 0
      ? "--"
      : focusHours >= 10
        ? `${Math.round(focusHours)}h`
        : `${(Math.round(focusHours * 10) / 10).toString().replace(".", ",")}h`

  // Posição no ranking global (Top X%)
  const myXP = myXPRow?.totalXP ?? 0
  const [totalPlayers, ahead] = await Promise.all([
    db.userProfile.count(),
    db.userProfile.count({ where: { totalXP: { gt: myXP } } }),
  ])
  const rankPercent =
    totalPlayers > 0 ? Math.max(1, Math.round(((ahead + 1) / totalPlayers) * 100)) : null

  // Conquistas
  const earnedKeys = new Set(
    earnedRows.map((e) => JSON.parse(e.achievement.condition).key as string)
  )
  const visibleDefs = ACHIEVEMENT_DEFS.filter((d) => !d.isHidden)
  const earnedCount = visibleDefs.filter((d) => earnedKeys.has(d.key)).length
  // Próximas a desbloquear (não ganhas), ordenadas por xpReward: as "mais fáceis" primeiro.
  const lockedNext = visibleDefs
    .filter((d) => !earnedKeys.has(d.key))
    .sort((a, b) => a.xpReward - b.xpReward)
    .slice(0, 4)
  const earnedList = visibleDefs.filter((d) => earnedKeys.has(d.key))

  return (
    <div className="relative pb-6">
      {/* Hero com nebulosa (só no topo, atrás do avatar). A imagem fica FORA
          da coluna limitada (max-w-2xl) de propósito, pra esticar até a
          borda da tela em telas largas, igual à nebulosa da Home. */}
      <div className="relative -mt-12 overflow-hidden pt-16 pb-6">
        <div
          aria-hidden
          className="opal-nebula pointer-events-none absolute inset-x-0 top-0 z-0 h-[340px] overflow-hidden"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/opal/space-bg.webp"
            alt=""
            className="opal-space-drift h-full w-full object-cover motion-reduce:animate-none"
          />
        </div>

        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-4">
          <AvatarUpload currentImage={user.image ?? null} initials={initials} />
          <h1 className="mt-3 text-2xl font-bold tracking-tight">{user.name ?? "Usuário"}</h1>
          <p className="text-sm text-muted-foreground">
            Nível {profile?.currentLevel ?? 1} · {(profile?.totalXP ?? 0).toLocaleString("pt-BR")} XP
          </p>
        </div>

        {/* 3 métricas com ícone "glow" */}
        <div className="relative z-10 mt-7 flex items-start justify-center gap-3">
          <MetricGlow icon={<Hourglass className="h-6 w-6" />} value={focusLabel} label="Horas de foco" tint="text-primary" />
          <MetricGlow icon={<Flame className="h-6 w-6 fill-current" />} value={String(effectiveStreak(profile?.streak ?? 0, profile?.lastStudyDate ?? null))} label="Dias seguidos" tint="text-warning" />
          <MetricGlow
            icon={<Globe2 className="h-6 w-6" />}
            value={rankPercent !== null ? `Top ${rankPercent}%` : "--"}
            label="No ranking"
            tint="text-primary"
          />
        </div>
      </div>

      {/* Do XP bar em diante, a coluna volta a ser limitada (max-w-2xl),
          igual ao resto do app: só o hero acima tem a imagem esticada. */}
      <div className="mx-auto max-w-2xl">
        {/* XP bar */}
        {profile && (
          <div className="px-4">
            <div className="opal-glass-card rounded-2xl p-4">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Nível {profile.currentLevel}</span>
                <span className="text-muted-foreground">{xpToNext} XP para o nível {profile.currentLevel + 1}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${levelProgress}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* Conquistas (carrossel horizontal) */}
        <div className="mt-8">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-base font-semibold">Conquistas</h2>
            <Link href="/conquistas" className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground">
              {earnedCount}/{visibleDefs.length}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-3 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {earnedList.map((def) => (
              <div key={def.key} className="flex w-24 shrink-0 flex-col items-center gap-2">
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-2xl border border-primary/10 bg-primary/8 text-4xl"
                  style={{ boxShadow: "0 0 16px -8px color-mix(in srgb, var(--glow-mint) 25%, transparent)" }}
                >
                  {def.icon}
                </div>
                <p className="line-clamp-2 text-center text-xs font-medium leading-tight">{def.name}</p>
              </div>
            ))}
            {lockedNext.map((def) => (
              <div key={def.key} className="flex w-24 shrink-0 flex-col items-center gap-2">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-muted/40 text-4xl grayscale">
                  <span className="opacity-30">{def.icon}</span>
                  <Lock className="absolute h-4 w-4 text-muted-foreground" />
                </div>
                <p className="line-clamp-2 text-center text-xs text-muted-foreground leading-tight">{def.name}</p>
              </div>
            ))}
            {earnedList.length === 0 && lockedNext.length === 0 && (
              <p className="py-6 text-sm text-muted-foreground">Nenhuma conquista ainda.</p>
            )}
          </div>
        </div>

        {/* Metas */}
        {profile && (
          <div className="mt-6 px-4">
            <div className="opal-glass-card space-y-3 rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Metas</p>
              <Row icon={<Target className="h-4 w-4" />} label="Nota alvo" value={`${profile.targetScore} pts`} />
              <Row
                icon={<Trophy className="h-4 w-4" />}
                label="Curso"
                value={findCurso(profile.targetCourse)?.nome ?? profile.targetCourse}
              />
              {(() => {
                const uni = findUniversidade(profile.targetInstitution)
                if (!uni) return null
                return (
                  <Row
                    icon={<GraduationCap className="h-4 w-4" />}
                    label="Universidade"
                    value={`${uni.sigla} · ${uni.cidade}/${uni.uf}`}
                  />
                )
              })()}
              {daysLeft !== null && (
                <Row
                  icon={<Calendar className="h-4 w-4" />}
                  label="ENEM"
                  value={daysLeft > 0 ? `${daysLeft} dias` : "Encerrado"}
                />
              )}
              <Row icon={<Clock className="h-4 w-4" />} label="Meta diária" value={`${profile.dailyStudyGoal} min`} />
              {trailConfig && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Trilha</span>
                  <Badge variant="outline" className={trailConfig.badgeColor}>
                    {trailConfig.label}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Links */}
        <div className="mt-6 flex flex-col gap-2 px-4">
          <LinkRow href="/analytics" label="Ver analytics" />
          <LinkRow href="/ranking" label="Ranking semanal" />
          <LinkRow href="/profile/settings" label="Configurações" />
        </div>
      </div>
    </div>
  )
}

function MetricGlow({
  icon,
  value,
  label,
  tint,
}: {
  icon: React.ReactNode
  value: string
  label: string
  tint: string
}) {
  return (
    <div className="flex w-24 flex-col items-center gap-1.5 text-center">
      <div className={`${tint} drop-shadow-[0_0_10px_currentColor]`}>{icon}</div>
      <p className={`text-lg font-bold leading-none ${tint}`}>{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{icon}</span>
        <span>{label}</span>
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

function LinkRow({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="opal-glass-card flex items-center justify-between rounded-xl px-4 py-3 text-sm transition-colors hover:bg-muted/40"
    >
      {label}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  )
}
