import { db } from "@/lib/db"
import { subDays } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, ArrowRight } from "lucide-react"
import Link from "next/link"

const AREA_COLOR: Record<string, string> = {
  "ciencias-natureza": "bg-green-500/10 text-green-600 border-green-500/20",
  "ciencias-humanas": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  linguagens: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  matematica: "bg-orange-500/10 text-orange-600 border-orange-500/20",
}

const IMPORTANCE_LABEL: Record<number, string> = {
  5: "Alta prioridade",
  4: "Alta prioridade",
  3: "Média prioridade",
  2: "Baixa prioridade",
  1: "Baixa prioridade",
}

export async function ProximaSessaoCard({ userId }: { userId: string }) {
  const sevenDaysAgo = subDays(new Date(), 7)

  const recentSessions = await db.studySession.findMany({
    where: { userId, date: { gte: sevenDaysAgo }, topicId: { not: null } },
    select: { topicId: true },
    distinct: ["topicId"],
  })

  const recentTopicIds = recentSessions
    .map((s) => s.topicId)
    .filter((id): id is string => id !== null)

  const topic = await db.topic.findFirst({
    where: recentTopicIds.length > 0 ? { id: { notIn: recentTopicIds } } : {},
    orderBy: [{ importance: "desc" }, { frequency: "desc" }],
    include: {
      discipline: {
        include: { area: { select: { name: true, slug: true } } },
      },
    },
  })

  if (!topic) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Próxima sessão</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Todos os tópicos foram estudados recentemente. Ótimo trabalho!
          </p>
        </CardContent>
      </Card>
    )
  }

  const areaSlug = topic.discipline.area.slug
  const colorClass = AREA_COLOR[areaSlug] ?? "bg-muted text-muted-foreground"
  const priorityLabel = IMPORTANCE_LABEL[topic.importance] ?? "Prioridade"

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Próxima sessão</CardTitle>
        <Zap className="h-4 w-4 text-yellow-500" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <p className="text-base font-semibold leading-tight">{topic.name}</p>
          <p className="text-xs text-muted-foreground">{topic.discipline.name}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className={colorClass}>
            {topic.discipline.area.name}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {priorityLabel}
          </Badge>
        </div>

        <Button asChild size="sm" className="w-full">
          <Link href={`/topicos/${topic.slug}`}>
            Estudar agora
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
