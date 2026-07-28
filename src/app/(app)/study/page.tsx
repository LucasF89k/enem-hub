import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  FlaskConical,
  Globe,
  BookOpen,
  Calculator,
  type LucideIcon,
} from "lucide-react"

export const metadata = { title: "Estudar" }

const AREA_ICON: Record<string, LucideIcon> = {
  "ciencias-natureza": FlaskConical,
  "ciencias-humanas": Globe,
  linguagens: BookOpen,
  matematica: Calculator,
}

const AREA_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  "ciencias-natureza": { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400", border: "border-green-500/20" },
  "ciencias-humanas":  { bg: "bg-blue-500/10",  text: "text-blue-600 dark:text-blue-400",  border: "border-blue-500/20" },
  linguagens:          { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/20" },
  matematica:          { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", border: "border-orange-500/20" },
}

export default async function StudyPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const areas = await db.area.findMany({
    orderBy: { order: "asc" },
    include: {
      disciplines: {
        include: { topics: { select: { id: true } } },
      },
    },
  })

  const allTopicIds = areas.flatMap((a) =>
    a.disciplines.flatMap((d) => d.topics.map((t) => t.id))
  )

  const studiedSessions = await db.studySession.findMany({
    where: { userId, topicId: { in: allTopicIds } },
    select: { topicId: true },
    distinct: ["topicId"],
  })
  const studiedSet = new Set(studiedSessions.map((s) => s.topicId))

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Estudar</h1>
        <p className="text-sm text-muted-foreground">Escolha uma área para começar</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {areas.map((area) => {
          const Icon = AREA_ICON[area.slug] ?? BookOpen
          const style = AREA_STYLE[area.slug] ?? { bg: "bg-muted", text: "text-foreground", border: "border-border" }
          const topicIds = area.disciplines.flatMap((d) => d.topics.map((t) => t.id))
          const totalTopics = topicIds.length
          const studiedTopics = topicIds.filter((id) => studiedSet.has(id)).length
          const progressPct = totalTopics > 0 ? Math.round((studiedTopics / totalTopics) * 100) : 0

          return (
            <Link
              key={area.slug}
              href={`/study/${area.slug}`}
              className={[
                "group flex flex-col gap-4 rounded-xl border p-5 transition-all",
                "hover:shadow-md hover:-translate-y-0.5",
                style.bg,
                style.border,
              ].join(" ")}
            >
              <div className="flex items-start justify-between">
                <div className={["p-2.5 rounded-lg", style.bg, "border", style.border].join(" ")}>
                  <Icon className={["h-7 w-7", style.text].join(" ")} />
                </div>
                <Badge variant="secondary" className="text-xs">
                  {totalTopics} tópicos
                </Badge>
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-semibold leading-tight">{area.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {area.disciplines.length} disciplinas
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{studiedTopics}/{totalTopics} estudados</span>
                  <span>{progressPct}%</span>
                </div>
                <Progress value={progressPct} className="h-1.5" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
