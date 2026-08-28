import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ChevronRight, ChevronLeft, BookOpen, type LucideIcon } from "lucide-react"
import {
  FlaskConical,
  Globe,
  Calculator,
  Dna,
  FlaskRound,
  Atom,
  Landmark,
  Map,
  BookMarked,
  Users,
  Languages,
  Library,
  Globe2,
  Palette,
  PiSquare,
  Shapes,
} from "lucide-react"

export async function generateMetadata({ params }: { params: Promise<{ areaSlug: string }> }) {
  const { areaSlug } = await params
  const area = await db.area.findUnique({ where: { slug: areaSlug }, select: { name: true } })
  return { title: area ? `${area.name} — Vion` : "Área" }
}

const AREA_ICON: Record<string, LucideIcon> = {
  "ciencias-natureza": FlaskConical,
  "ciencias-humanas": Globe,
  linguagens: BookOpen,
  matematica: Calculator,
}

const DISCIPLINE_ICON: Record<string, LucideIcon> = {
  biologia:   Dna,
  quimica:    FlaskRound,
  fisica:     Atom,
  historia:   Landmark,
  geografia:  Map,
  filosofia:  BookMarked,
  sociologia: Users,
  "lingua-portuguesa": Languages,
  literatura: Library,
  ingles:     Globe2,
  "artes-educacao-fisica": Palette,
  algebra:    PiSquare,
  geometria:  Shapes,
}

const AREA_HEADER: Record<string, string> = {
  "ciencias-natureza": "from-green-600/20 to-transparent",
  "ciencias-humanas":  "from-blue-600/20 to-transparent",
  linguagens:          "from-purple-600/20 to-transparent",
  matematica:          "from-orange-600/20 to-transparent",
}

const AREA_BADGE: Record<string, string> = {
  "ciencias-natureza": "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400",
  "ciencias-humanas":  "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400",
  linguagens:          "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-400",
  matematica:          "bg-orange-500/10 text-orange-700 border-orange-500/20 dark:text-orange-400",
}

export default async function AreaPage({ params }: { params: Promise<{ areaSlug: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const { areaSlug } = await params

  const area = await db.area.findUnique({
    where: { slug: areaSlug },
    include: {
      disciplines: {
        orderBy: { order: "asc" },
        include: { topics: { select: { id: true } } },
      },
    },
  })

  if (!area) notFound()

  const allTopicIds = area.disciplines.flatMap((d) => d.topics.map((t) => t.id))

  const studiedSessions = await db.studySession.findMany({
    where: { userId, topicId: { in: allTopicIds } },
    select: { topicId: true },
    distinct: ["topicId"],
  })
  const studiedSet = new Set(studiedSessions.map((s) => s.topicId))

  const AreaIcon = AREA_ICON[areaSlug] ?? BookOpen
  const headerGradient = AREA_HEADER[areaSlug] ?? "from-primary/20 to-transparent"
  const badgeClass = AREA_BADGE[areaSlug] ?? ""

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className={`bg-gradient-to-b ${headerGradient} px-4 pt-6 pb-8`}>
        {/* Voltar */}
        <Link
          href="/study"
          aria-label="Voltar"
          className="-ml-2 mb-3 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>

        <div className="flex items-center gap-3">
          <AreaIcon className="h-8 w-8 text-foreground" />
          <div>
            <h1 className="text-2xl font-bold">{area.name}</h1>
            <p className="text-sm text-muted-foreground">
              {area.disciplines.length} disciplinas · {allTopicIds.length} tópicos
            </p>
          </div>
        </div>
      </div>

      {/* Disciplines */}
      <div className="px-4 py-4 space-y-3">
        {area.disciplines.map((discipline) => {
          const DisciplineIcon = DISCIPLINE_ICON[discipline.slug] ?? BookOpen
          const topicIds = discipline.topics.map((t) => t.id)
          const totalTopics = topicIds.length
          const studiedTopics = topicIds.filter((id) => studiedSet.has(id)).length
          const progressPct = totalTopics > 0 ? Math.round((studiedTopics / totalTopics) * 100) : 0

          return (
            <Link
              key={discipline.slug}
              href={`/study/${areaSlug}/${discipline.slug}`}
              className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-all hover:shadow-sm hover:border-border/80 group"
            >
              <div className="p-2 rounded-lg bg-muted group-hover:bg-muted/80 shrink-0">
                <DisciplineIcon className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{discipline.name}</span>
                  <Badge variant="outline" className={["text-[10px] ml-2 shrink-0", badgeClass].join(" ")}>
                    {studiedTopics}/{totalTopics}
                  </Badge>
                </div>
                <Progress value={progressPct} className="h-1" />
              </div>

              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
