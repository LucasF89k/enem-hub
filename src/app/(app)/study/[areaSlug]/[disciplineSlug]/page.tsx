import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, CheckCircle2, Star, Flame } from "lucide-react"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ areaSlug: string; disciplineSlug: string }>
}) {
  const { disciplineSlug } = await params
  const discipline = await db.discipline.findUnique({
    where: { slug: disciplineSlug },
    select: { name: true },
  })
  return { title: discipline ? `${discipline.name} — ENEM Hub` : "Disciplina — ENEM Hub" }
}

export default async function DisciplinePage({
  params,
}: {
  params: Promise<{ areaSlug: string; disciplineSlug: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const { areaSlug, disciplineSlug } = await params

  const discipline = await db.discipline.findUnique({
    where: { slug: disciplineSlug },
    include: {
      area: { select: { name: true, slug: true } },
      topics: {
        orderBy: [{ importance: "desc" }, { frequency: "desc" }, { order: "asc" }],
      },
    },
  })

  if (!discipline || discipline.area.slug !== areaSlug) notFound()

  const topicIds = discipline.topics.map((t) => t.id)

  const studiedSessions = await db.studySession.findMany({
    where: { userId, topicId: { in: topicIds } },
    select: { topicId: true },
    distinct: ["topicId"],
  })
  const studiedSet = new Set(studiedSessions.map((s) => s.topicId))

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
        <Link href="/study" className="hover:text-foreground transition-colors">Estudar</Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <Link href={`/study/${areaSlug}`} className="hover:text-foreground transition-colors">
          {discipline.area.name}
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <span className="text-foreground font-medium">{discipline.name}</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold">{discipline.name}</h1>
        <p className="text-sm text-muted-foreground">{discipline.topics.length} tópicos</p>
      </div>

      <div className="space-y-2">
        {discipline.topics.map((topic) => {
          const isStudied = studiedSet.has(topic.id)

          return (
            <Link
              key={topic.slug}
              href={`/study/${areaSlug}/${disciplineSlug}/${topic.slug}`}
              className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-all hover:shadow-sm hover:border-border/80 group"
            >
              {/* Check indicator */}
              <CheckCircle2
                className={[
                  "h-4 w-4 shrink-0",
                  isStudied ? "text-accent" : "text-muted-foreground/30",
                ].join(" ")}
              />

              {/* Topic name + description */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">{topic.name}</p>
                {topic.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {topic.description}
                  </p>
                )}
              </div>

              {/* Badges */}
              <div className="flex items-center gap-1.5 shrink-0">
                {topic.importance >= 4 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 gap-0.5"
                  >
                    <Star className="h-2.5 w-2.5 fill-current" />
                    {topic.importance === 5 ? "Alta" : "Média-alta"}
                  </Badge>
                )}
                {topic.frequency === 5 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 gap-0.5"
                  >
                    <Flame className="h-2.5 w-2.5" />
                    Muito cobrado
                  </Badge>
                )}
              </div>

              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
