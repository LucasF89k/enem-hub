import Link from "next/link"
import { cn } from "@/lib/utils"
import { Sparkles, Layers, RotateCcw, ChevronRight, Info } from "lucide-react"

export type FilterKey = "revisar" | "novos" | "errei" | "dificil" | "bom" | "facil" | "todos"

export interface FilterCounts {
  revisar: number // vencidos + novos
  novos: number
  errei: number
  dificil: number
  bom: number
  facil: number
  todos: number
}

const OPTIONS: {
  key: FilterKey
  label: string
  desc: string
  dot?: string
}[] = [
  { key: "revisar", label: "Revisão inteligente", desc: "Vencidos + não respondidos (recomendado)" },
  { key: "novos", label: "Não respondidos", desc: "Cards que você ainda não viu" },
  { key: "errei", label: "Marquei como Errei", desc: "Para reforçar o que você não lembrou", dot: "bg-red-500" },
  { key: "dificil", label: "Marquei como Difícil", desc: "Acertou com esforço", dot: "bg-orange-500" },
  { key: "bom", label: "Marquei como Bom", desc: "Acertou, mas ainda vale revisar", dot: "bg-blue-500" },
  { key: "facil", label: "Marquei como Fácil", desc: "Já domina", dot: "bg-green-500" },
  { key: "todos", label: "Todos os cards", desc: "Percorrer tudo, do zero" },
]

export function FlashcardFilterScreen({
  scopeQuery,
  counts,
  title,
  emptyNote,
}: {
  scopeQuery: string
  counts: FilterCounts
  title?: string
  emptyNote?: boolean
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-5">
      <div className="space-y-1">
        <h1 className="text-xl font-bold">{title ?? "O que você quer revisar?"}</h1>
        <p className="text-sm text-muted-foreground">Escolha um filtro para começar a sessão.</p>
        {emptyNote && (
          <p className="text-sm text-orange-500">
            Não há cards nesse filtro agora. Escolha outro abaixo.
          </p>
        )}
      </div>

      <div className="space-y-2">
        {OPTIONS.map((o) => {
          const count = counts[o.key]
          const disabled = count === 0
          const Icon = o.key === "revisar" ? Sparkles : o.key === "todos" ? Layers : RotateCcw
          const inner = (
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors",
                disabled ? "opacity-40" : "hover:border-primary/40 hover:bg-muted/40",
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                {o.dot ? (
                  <span className={cn("h-3 w-3 rounded-full", o.dot)} />
                ) : (
                  <Icon className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{o.label}</p>
                <p className="text-xs text-muted-foreground">{o.desc}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
                {count}
              </span>
              {!disabled && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
            </div>
          )
          return disabled ? (
            <div key={o.key}>{inner}</div>
          ) : (
            <Link key={o.key} href={`/flashcards/review?${scopeQuery}filter=${o.key}`}>
              {inner}
            </Link>
          )
        })}
      </div>

      {/* Legenda dos botões de avaliação */}
      <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <Info className="h-4 w-4 text-primary" />
          Como avaliar cada card
        </div>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li>
            <span className="font-semibold text-red-500">Errei</span>: não lembrei da resposta (volta a aparecer logo).
          </li>
          <li>
            <span className="font-semibold text-orange-500">Difícil</span>: acertei, mas com muito esforço.
          </li>
          <li>
            <span className="font-semibold text-blue-500">Bom</span>: acertei, <b>mas ainda acho útil revisar de novo</b>. Use quando acertar e quiser rever em breve mesmo assim.
          </li>
          <li>
            <span className="font-semibold text-green-500">Fácil</span>: acertei sem dificuldade, já domino (espaça bastante).
          </li>
        </ul>
      </div>

      <Link href="/flashcards" className="block text-center text-sm text-muted-foreground hover:text-foreground">
        Voltar
      </Link>
    </div>
  )
}
