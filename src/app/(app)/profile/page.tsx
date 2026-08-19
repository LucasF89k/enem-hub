import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getTrailConfig } from "@/lib/trail"
import { differenceInDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { AvatarUpload } from "@/components/profile/AvatarUpload"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, Flame, Zap, Trophy, Target, Calendar, Clock, BookOpen, GraduationCap } from "lucide-react"
import { findCurso } from "@/constants/cursos"
import { findUniversidade } from "@/constants/universidades"

export const metadata = { title: "Perfil" }

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const [user, profile, questionStats, simuladoStats] = await Promise.all([
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
        trail: true,
        estimatedScore: true,
      },
    }),
    db.userQuestion.aggregate({
      where: { userId },
      _count: { _all: true },
    }),
    db.userSimulado.count({
      where: { userId, status: "COMPLETED" },
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <AvatarUpload currentImage={user.image ?? null} initials={initials} />
          <div>
            <h1 className="text-xl font-bold">{user.name ?? "Usuário"}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Membro desde {format(user.createdAt, "MMM yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-1.5 shrink-0">
          <Link href="/profile/settings">
            <Settings className="h-4 w-4" />
            Editar
          </Link>
        </Button>
      </div>

      {/* Level & XP */}
      {profile && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Nível {profile.currentLevel}</p>
                  <p className="text-xs text-muted-foreground">{profile.totalXP.toLocaleString("pt-BR")} XP total</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{xpToNext} XP para o próximo nível</p>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${levelProgress}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col items-center gap-1">
            <Flame className="h-5 w-5 text-orange-500" />
            <p className="text-2xl font-bold">{profile?.streak ?? 0}</p>
            <p className="text-xs text-muted-foreground text-center">Streak atual</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col items-center gap-1">
            <Zap className="h-5 w-5 text-yellow-500" />
            <p className="text-2xl font-bold">{profile?.longestStreak ?? 0}</p>
            <p className="text-xs text-muted-foreground text-center">Maior streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col items-center gap-1">
            <BookOpen className="h-5 w-5 text-blue-500" />
            <p className="text-2xl font-bold">{questionStats._count._all}</p>
            <p className="text-xs text-muted-foreground text-center">Questões</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col items-center gap-1">
            <Trophy className="h-5 w-5 text-purple-500" />
            <p className="text-2xl font-bold">{simuladoStats}</p>
            <p className="text-xs text-muted-foreground text-center">Simulados</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals */}
      {profile && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Metas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span>Nota alvo</span>
              </div>
              <span className="font-semibold">{profile.targetScore} pts</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <span>Curso</span>
              </div>
              <span className="font-semibold">
                {findCurso(profile.targetCourse)?.nome ?? profile.targetCourse}
              </span>
            </div>
            {(() => {
              const uni = findUniversidade(profile.targetInstitution)
              if (!uni) return null
              return (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span>Universidade</span>
                  </div>
                  <span className="font-semibold">
                    {uni.sigla} · {uni.cidade}/{uni.uf}
                  </span>
                </div>
              )
            })()}
            {daysLeft !== null && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>ENEM</span>
                </div>
                <span className="font-semibold">
                  {daysLeft > 0 ? `${daysLeft} dias` : "Encerrado"}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Meta diária</span>
              </div>
              <span className="font-semibold">{profile.dailyStudyGoal} min</span>
            </div>
            {trailConfig && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <span>Trilha</span>
                </div>
                <Badge variant="outline" className={trailConfig.badgeColor}>
                  {trailConfig.label}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick links — "Ver minhas conquistas" foi pro header, ao lado do nível */}
      <div className="flex flex-col gap-2">
        <Button asChild variant="outline" className="justify-start gap-2">
          <Link href="/analytics">
            <Zap className="h-4 w-4" />
            Ver analytics
          </Link>
        </Button>
        <Button asChild variant="outline" className="justify-start gap-2">
          <Link href="/profile/settings">
            <Settings className="h-4 w-4" />
            Configurações
          </Link>
        </Button>
      </div>
    </div>
  )
}
