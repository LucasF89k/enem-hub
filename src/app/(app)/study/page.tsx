import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getCatalogo } from "@/lib/catalogo"
import { getTopicosEstudados } from "@/lib/progresso"
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

/**
 * Cor de acento por área.
 *
 * A cor fica SÓ no ícone. Antes ela também pintava a borda, o fundo do ícone
 * e a barra de progresso: com quatro áreas na tela, eram quatro cores
 * disputando atenção ao mesmo tempo, e nada disso acrescentava informação que
 * o ícone sozinho já não desse. Borda e barra agora são neutras, então a
 * página fica calma e a cor continua servindo de referência rápida da área.
 */
const AREA_ACCENT: Record<string, { border: string; iconBg: string; icon: string; bar: string }> = {
  "ciencias-natureza": {
    border: "border-border",
    iconBg: "bg-foreground/[0.06]",
    icon: "text-sky-400",
    bar: "",
  },
  "ciencias-humanas": {
    border: "border-border",
    iconBg: "bg-foreground/[0.06]",
    icon: "text-primary",
    bar: "",
  },
  linguagens: {
    border: "border-border",
    iconBg: "bg-foreground/[0.06]",
    icon: "text-violet-400",
    bar: "",
  },
  matematica: {
    border: "border-border",
    iconBg: "bg-foreground/[0.06]",
    icon: "text-amber-400",
    bar: "",
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

  // As duas leituras são independentes agora (a de progresso não precisa mais
  // receber a lista de ids do catálogo), então vão em paralelo em vez de uma
  // esperar a outra. O catálogo ainda por cima vem de cache na maioria das
  // vezes, porque é o mesmo pra todo usuário.
  const [areas, studiedSet] = await Promise.all([
    getCatalogo(),
    getTopicosEstudados(userId),
  ])

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-5">
      {/* Áreas */}
      <div className="grid grid-cols-2 gap-3">
        {areas.map((area, i) => {
          const Icon = AREA_ICON[area.slug] ?? BookOpen
          const accent = AREA_ACCENT[area.slug] ?? FALLBACK_ACCENT
          const topicIds = area.disciplines.flatMap((d) => d.topicIds)
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
              {/* Atalho é navegação secundária: ícone em cinza, sem tinta. */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.06]">
                <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
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
