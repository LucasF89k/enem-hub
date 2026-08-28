import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import {
  FlaskConical,
  Globe,
  BookOpen,
  Calculator,
  Layers,
  ClipboardList,
  PenLine,
  LineChart,
  ChevronRight,
  type LucideIcon,
} from "lucide-react"

export const metadata = { title: "Estudar" }

const AREA_ICON: Record<string, LucideIcon> = {
  "ciencias-natureza": FlaskConical,
  "ciencias-humanas": Globe,
  linguagens: BookOpen,
  matematica: Calculator,
}

/** Cor de acento por área — borda, ícone e barra de progresso. */
const AREA_ACCENT: Record<string, { border: string; iconBg: string; icon: string; bar: string }> = {
  "ciencias-natureza": {
    border: "border-sky-500/20",
    iconBg: "bg-sky-500/12",
    icon: "text-sky-400",
    bar: "[&>div]:bg-sky-400",
  },
  "ciencias-humanas": {
    border: "border-primary/25",
    iconBg: "bg-primary/12",
    icon: "text-primary",
    bar: "[&>div]:bg-primary",
  },
  linguagens: {
    border: "border-violet-500/25",
    iconBg: "bg-violet-500/14",
    icon: "text-violet-400",
    bar: "[&>div]:bg-violet-400",
  },
  matematica: {
    border: "border-amber-500/22",
    iconBg: "bg-amber-500/12",
    icon: "text-amber-400",
    bar: "[&>div]:bg-amber-400",
  },
}

const FALLBACK_ACCENT = {
  border: "border-border",
  iconBg: "bg-muted",
  icon: "text-foreground",
  bar: "",
}

const SHORTCUTS: { icon: LucideIcon; title: string; sub: string; href: string }[] = [
  { icon: Layers, title: "Flashcards", sub: "Revisão espaçada (SM-2)", href: "/flashcards" },
  { icon: ClipboardList, title: "Simulados", sub: "Provas no estilo ENEM", href: "/simulados" },
  { icon: PenLine, title: "Redação", sub: "Escreva e receba correção", href: "/redacao" },
  { icon: LineChart, title: "Progresso", sub: "Seu desempenho e evolução", href: "/analytics" },
]

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
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-5">
      <div>
        <h1 className="text-xl font-bold">Estudar</h1>
        <p className="text-xs text-muted-foreground">Escolha uma área para começar</p>
      </div>

      {/* Áreas */}
      <div className="grid grid-cols-2 gap-3">
        {areas.map((area, i) => {
          const Icon = AREA_ICON[area.slug] ?? BookOpen
          const accent = AREA_ACCENT[area.slug] ?? FALLBACK_ACCENT
          const topicIds = area.disciplines.flatMap((d) => d.topics.map((t) => t.id))
          const totalTopics = topicIds.length
          const studiedTopics = topicIds.filter((id) => studiedSet.has(id)).length
          const progressPct = totalTopics > 0 ? Math.round((studiedTopics / totalTopics) * 100) : 0

          return (
            <Link
              key={area.slug}
              href={`/study/${area.slug}`}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`opal-enter group flex flex-col gap-3 rounded-2xl border bg-card ${accent.border} p-3.5 transition-transform hover:-translate-y-0.5`}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent.iconBg}`}>
                <Icon className={`h-4 w-4 ${accent.icon}`} strokeWidth={1.75} />
              </div>

              <div className="space-y-1">
                <h2 className="text-sm font-semibold leading-tight">{area.name}</h2>
                <p className="text-[11px] text-muted-foreground">
                  {studiedTopics} de {totalTopics} tópicos
                </p>
                <Progress value={progressPct} className={`mt-1.5 h-1 ${accent.bar}`} />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Atalhos */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Atalhos
        </p>
        <div className="flex flex-col gap-2">
          {SHORTCUTS.map(({ icon: Icon, title, sub, href }, i) => (
            <Link
              key={href}
              href={href}
              style={{ animationDelay: `${(areas.length + i) * 60}ms` }}
              className="opal-enter flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:bg-muted/40 active:scale-[0.99]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold leading-tight">{title}</p>
                <p className="truncate text-[11px] text-muted-foreground">{sub}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
