"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, ChevronRight, ArrowRight, Layers } from "lucide-react"

export interface BrowserTopic {
  id: string
  name: string
  cards: number
}
export interface BrowserDiscipline {
  id: string
  name: string
  area: string
  cards: number
  topics: BrowserTopic[]
}

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")

export function SubjectBrowser({ disciplines }: { disciplines: BrowserDiscipline[] }) {
  const [q, setQ] = useState("")

  const filtered = useMemo(() => {
    const term = norm(q.trim())
    if (!term) return disciplines
    return disciplines
      .map((d) => {
        const discHit = norm(d.name).includes(term)
        const topics = discHit ? d.topics : d.topics.filter((t) => norm(t.name).includes(term))
        return topics.length ? { ...d, topics } : null
      })
      .filter(Boolean) as BrowserDiscipline[]
  }, [q, disciplines])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Por matéria e conteúdo
        </h2>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar matéria ou conteúdo…"
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          Nenhum conteúdo encontrado.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => (
            <details
              key={d.id}
              className="group rounded-xl border bg-card overflow-hidden"
              open={!!q.trim()}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 hover:bg-muted/40">
                <div className="flex items-center gap-2 min-w-0">
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{d.name}</p>
                    <p className="text-[11px] text-muted-foreground">{d.area}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {d.cards} card{d.cards !== 1 ? "s" : ""}
                </Badge>
              </summary>

              <div className="border-t divide-y">
                {/* Revisar a matéria inteira */}
                <Link
                  href={`/flashcards/review?disciplineId=${d.id}`}
                  className="flex items-center justify-between gap-2 px-4 py-2.5 pl-10 text-sm hover:bg-muted/40"
                >
                  <span className="flex items-center gap-2 text-primary">
                    <Layers className="h-3.5 w-3.5" />
                    Revisar toda a matéria
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>

                {d.topics.map((t) => (
                  <Link
                    key={t.id}
                    href={`/flashcards/review?topicId=${t.id}`}
                    className="flex items-center justify-between gap-2 px-4 py-2.5 pl-10 text-sm hover:bg-muted/40"
                  >
                    <span className="truncate">{t.name}</span>
                    <span className="flex items-center gap-2 shrink-0 text-muted-foreground">
                      <span className="text-xs">{t.cards}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}
