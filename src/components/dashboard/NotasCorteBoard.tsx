"use client"

import { useMemo, useState, useTransition } from "react"
import { Search, Check, GraduationCap, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { setTargetInstitution } from "@/app/actions/settings.actions"
import {
  UNIVERSIDADES,
  universidadesDoCurso,
  TIPO_LABEL,
  type TipoIES,
  type Universidade,
} from "@/constants/universidades"
import { findCurso, estimateCutoff, cursoMedia } from "@/constants/cursos"

const FILTROS: { value: TipoIES | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "federal", label: "Federais" },
  { value: "estadual", label: "Estaduais" },
  { value: "particular", label: "Particulares" },
]

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
}

export function NotasCorteBoard({
  cursoSlug,
  selectedUniId,
  estimatedScore,
}: {
  cursoSlug: string
  selectedUniId: string | null
  estimatedScore: number
}) {
  const curso = findCurso(cursoSlug) ?? findCurso("medicina")!
  const [query, setQuery] = useState("")
  const [tipo, setTipo] = useState<TipoIES | "all">("all")
  const [pending, startTransition] = useTransition()
  const [optimisticId, setOptimisticId] = useState<string | null>(selectedUniId)
  const hasScore = estimatedScore > 0

  const base = useMemo(
    () =>
      universidadesDoCurso(curso.slug, curso.area)
        .map((u) => ({ u, corte: estimateCutoff(curso, u) }))
        .sort((a, b) => b.corte - a.corte),
    [curso],
  )

  const lista = useMemo(() => {
    const q = norm(query.trim())
    return base.filter(({ u }) => {
      if (tipo !== "all" && u.tipo !== tipo) return false
      if (!q) return true
      return norm(`${u.sigla} ${u.nome} ${u.cidade} ${u.uf}`).includes(q)
    })
  }, [base, query, tipo])

  function escolher(u: Universidade) {
    const next = optimisticId === u.id ? null : u.id
    setOptimisticId(next)
    startTransition(() => {
      setTargetInstitution(next)
    })
  }

  return (
    <div className="w-full rounded-2xl border">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <GraduationCap className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Notas de corte — {curso.nome}</p>
          <p className="text-[11px] text-muted-foreground">
            Corte típico ~{cursoMedia(curso)} · toque para definir sua meta
          </p>
        </div>
        {pending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Busca */}
      <div className="flex items-center gap-2 border-b px-3">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar universidade ou cidade…"
          className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Filtros por tipo */}
      <div className="flex flex-wrap gap-1.5 border-b px-3 py-2.5">
        {FILTROS.map((ft) => (
          <button
            key={ft.value}
            type="button"
            onClick={() => setTipo(ft.value)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
              tipo === ft.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted",
            )}
          >
            {ft.label}
          </button>
        ))}
      </div>

      {/* Lista rolável */}
      <div className="max-h-[380px] overflow-y-auto">
        {lista.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhuma universidade encontrada.
          </p>
        )}
        {lista.map(({ u, corte }) => {
          const isSel = optimisticId === u.id
          const gap = Math.round(corte - estimatedScore)
          const reached = hasScore && gap <= 0
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => escolher(u)}
              className={cn(
                "flex w-full items-center gap-3 border-b px-4 py-2.5 text-left transition-colors last:border-b-0",
                isSel ? "bg-primary/10" : "hover:bg-muted/40",
              )}
            >
              <div
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                  isSel ? "border-primary bg-primary text-primary-foreground" : "border-border",
                )}
              >
                {isSel && <Check className="h-3 w-3" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm", isSel && "font-semibold")}>{u.sigla}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {TIPO_LABEL[u.tipo]} · {u.cidade}/{u.uf}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums">{corte}</p>
                {hasScore && (
                  <p
                    className={cn(
                      "text-[10px] tabular-nums",
                      reached ? "text-accent" : "text-muted-foreground",
                    )}
                  >
                    {reached ? "✓ alcança" : `faltam ${gap}`}
                  </p>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <p className="border-t px-4 py-2 text-center text-[10px] text-muted-foreground">
        Estimativa por seletividade da universidade · ampla concorrência · referência 2024
      </p>
    </div>
  )
}
