import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, FileText, Trophy, ChevronRight, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

export const metadata = { title: "Simulados — ENEM Hub" }

const TYPE_LABEL: Record<string, string> = {
  FULL: "Completo",
  AREA: "Por área",
  DISCIPLINE: "Por disciplina",
  CUSTOM: "Personalizado",
}

const TYPE_STYLE: Record<string, string> = {
  FULL: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  AREA: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  DISCIPLINE: "bg-green-500/10 text-green-700 dark:text-green-400",
  CUSTOM: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
}

export default async function SimuladosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const simulados = await db.simulado.findMany({
    where: { isPublic: true },
    include: {
      _count: { select: { questions: true } },
      userAttempts: {
        where: { userId },
        select: { id: true, status: true, scoreTotal: true, startedAt: true },
        orderBy: { startedAt: "desc" },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Simulados</h1>
        <p className="text-sm text-muted-foreground">
          Pratique no estilo ENEM com cronômetro e gabarito
        </p>
      </div>

      {simulados.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border bg-muted/30 py-16 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/40" />
          <div className="space-y-1">
            <p className="font-semibold">Nenhum simulado disponível</p>
            <p className="text-sm text-muted-foreground">
              Simulados serão adicionados em breve. Continue estudando!
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/questions">Praticar questões avulsas</Link>
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {simulados.map((s) => {
          const completed = s.userAttempts.filter((a) => a.status === "COMPLETED")
          const inProgress = s.userAttempts.find((a) => a.status === "IN_PROGRESS")
          const bestScore = completed.length > 0
            ? Math.max(...completed.map((a) => a.scoreTotal ?? 0))
            : null

          return (
            <Card key={s.id} className="overflow-hidden hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "text-[11px] font-medium px-2 py-0.5 rounded-full",
                          TYPE_STYLE[s.type] ?? TYPE_STYLE.CUSTOM
                        )}
                      >
                        {TYPE_LABEL[s.type] ?? s.type}
                      </span>
                    </div>
                    <h2 className="font-semibold text-base leading-snug">{s.title}</h2>
                    {s.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {s.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        {s._count.questions} questões
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {s.duration} min
                      </span>
                      {bestScore !== null && (
                        <span className="flex items-center gap-1 text-primary font-medium">
                          <Trophy className="h-3.5 w-3.5" />
                          Melhor: {bestScore}%
                        </span>
                      )}
                      {completed.length > 0 && (
                        <span>{completed.length} tentativa{completed.length !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </div>

                  <Button asChild size="sm" className="shrink-0 gap-1" variant={inProgress ? "default" : "outline"}>
                    <Link href={`/simulados/${s.id}`}>
                      {inProgress ? "Continuar" : completed.length > 0 ? "Tentar novamente" : "Iniciar"}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>

                {inProgress && (
                  <div className="mt-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-700 dark:text-yellow-400">
                    Tentativa em andamento — clique em Continuar para retomar
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
