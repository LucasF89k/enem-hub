"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SlidersHorizontal, X } from "lucide-react"
import { cn } from "@/lib/utils"

const DIFFICULTY_OPTIONS = [
  { value: "EASY", label: "Fácil" },
  { value: "MEDIUM", label: "Médio" },
  { value: "HARD", label: "Difícil" },
  { value: "VERY_HARD", label: "Muito difícil" },
]

const YEARS = Array.from({ length: 2024 - 2009 + 1 }, (_, i) => String(2024 - i))

type TopicOption = { id: string; name: string; slug: string }
type DisciplineOption = { id: string; name: string; slug: string; topics: TopicOption[] }
type AreaOption = { id: string; name: string; slug: string; disciplines: DisciplineOption[] }

interface CurrentFilters {
  areaSlug?: string
  discSlug?: string
  topicSlug?: string
  difficulties: string[]
  year?: string
  onlyWrong: boolean
  onlyFav: boolean
}

interface QuestionsFiltersProps {
  areas: AreaOption[]
  currentFilters: CurrentFilters
  total: number
}

function FilterForm({
  areas,
  filters,
  onChange,
  onApply,
  onClear,
}: {
  areas: AreaOption[]
  filters: CurrentFilters
  onChange: (next: CurrentFilters) => void
  onApply: () => void
  onClear: () => void
}) {
  const selectedArea = areas.find((a) => a.slug === filters.areaSlug)
  const disciplines = selectedArea?.disciplines ?? []
  const selectedDisc = disciplines.find((d) => d.slug === filters.discSlug)
  const topics = selectedDisc?.topics ?? []

  function setArea(slug: string) {
    onChange({ ...filters, areaSlug: slug || undefined, discSlug: undefined, topicSlug: undefined })
  }

  function setDisc(slug: string) {
    onChange({ ...filters, discSlug: slug || undefined, topicSlug: undefined })
  }

  function setTopic(slug: string) {
    onChange({ ...filters, topicSlug: slug || undefined })
  }

  function toggleDiff(value: string) {
    const next = filters.difficulties.includes(value)
      ? filters.difficulties.filter((d) => d !== value)
      : [...filters.difficulties, value]
    onChange({ ...filters, difficulties: next })
  }

  function setYear(value: string) {
    onChange({ ...filters, year: value || undefined })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Área */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Área
        </Label>
        <Select value={filters.areaSlug ?? ""} onValueChange={setArea}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Todas as áreas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas as áreas</SelectItem>
            {areas.map((a) => (
              <SelectItem key={a.id} value={a.slug}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Disciplina */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Disciplina
        </Label>
        <Select
          value={filters.discSlug ?? ""}
          onValueChange={setDisc}
          disabled={disciplines.length === 0}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder={disciplines.length === 0 ? "Selecione uma área" : "Todas"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            {disciplines.map((d) => (
              <SelectItem key={d.id} value={d.slug}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tópico */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Tópico
        </Label>
        <Select
          value={filters.topicSlug ?? ""}
          onValueChange={setTopic}
          disabled={topics.length === 0}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder={topics.length === 0 ? "Selecione uma disciplina" : "Todos"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {topics.map((t) => (
              <SelectItem key={t.id} value={t.slug}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Dificuldade */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Dificuldade
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {DIFFICULTY_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center gap-2">
              <Checkbox
                id={`diff-${opt.value}`}
                checked={filters.difficulties.includes(opt.value)}
                onCheckedChange={() => toggleDiff(opt.value)}
              />
              <Label htmlFor={`diff-${opt.value}`} className="text-sm font-normal cursor-pointer">
                {opt.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Ano */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Ano
        </Label>
        <Select value={filters.year ?? ""} onValueChange={setYear}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Todos os anos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os anos</SelectItem>
            <SelectItem value="custom">Questões autorais</SelectItem>
            {YEARS.map((y) => (
              <SelectItem key={y} value={y}>
                ENEM {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Toggles */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => onChange({ ...filters, onlyWrong: !filters.onlyWrong })}
          className={cn(
            "w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm text-left transition-colors",
            filters.onlyWrong
              ? "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400"
              : "border-border text-muted-foreground hover:bg-muted/50"
          )}
        >
          <span
            className={cn(
              "h-4 w-4 rounded border-2 shrink-0 transition-colors",
              filters.onlyWrong ? "border-red-500 bg-red-500" : "border-muted-foreground/50"
            )}
          />
          Somente erradas
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...filters, onlyFav: !filters.onlyFav })}
          className={cn(
            "w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm text-left transition-colors",
            filters.onlyFav
              ? "border-red-400/50 bg-red-400/10 text-red-500 dark:text-red-400"
              : "border-border text-muted-foreground hover:bg-muted/50"
          )}
        >
          <span
            className={cn(
              "h-4 w-4 rounded border-2 shrink-0 transition-colors",
              filters.onlyFav ? "border-red-400 bg-red-400" : "border-muted-foreground/50"
            )}
          />
          Somente favoritas
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" className="flex-1" onClick={onClear}>
          Limpar
        </Button>
        <Button size="sm" className="flex-1" onClick={onApply}>
          Aplicar
        </Button>
      </div>
    </div>
  )
}

export function QuestionsFilters({ areas, currentFilters, total }: QuestionsFiltersProps) {
  const router = useRouter()
  const [localFilters, setLocalFilters] = useState<CurrentFilters>(currentFilters)
  const [sheetOpen, setSheetOpen] = useState(false)

  const activeCount = [
    currentFilters.areaSlug,
    currentFilters.discSlug,
    currentFilters.topicSlug,
    currentFilters.difficulties.length > 0,
    currentFilters.year,
    currentFilters.onlyWrong,
    currentFilters.onlyFav,
  ].filter(Boolean).length

  function buildUrl(f: CurrentFilters) {
    const params = new URLSearchParams()
    if (f.areaSlug) params.set("area", f.areaSlug)
    if (f.discSlug) params.set("disc", f.discSlug)
    if (f.topicSlug) params.set("topic", f.topicSlug)
    f.difficulties.forEach((d) => params.append("diff", d))
    if (f.year) params.set("year", f.year)
    if (f.onlyWrong) params.set("wrong", "1")
    if (f.onlyFav) params.set("fav", "1")
    const qs = params.toString()
    return `/questions${qs ? "?" + qs : ""}`
  }

  function handleApply() {
    router.push(buildUrl(localFilters))
    setSheetOpen(false)
  }

  function handleClear() {
    const empty: CurrentFilters = {
      difficulties: [],
      onlyWrong: false,
      onlyFav: false,
    }
    setLocalFilters(empty)
    router.push("/questions")
    setSheetOpen(false)
  }

  return (
    <>
      {/* Mobile: filter button + Sheet */}
      <div className="md:hidden flex items-center gap-3 mb-1">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="relative gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtros
              {activeCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {activeCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[88dvh] overflow-y-auto">
            <SheetHeader className="mb-4">
              <div className="flex items-center justify-between">
                <SheetTitle>Filtros</SheetTitle>
                {activeCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1 h-7"
                    onClick={handleClear}
                  >
                    <X className="h-3 w-3" />
                    Limpar tudo
                  </Button>
                )}
              </div>
            </SheetHeader>
            <FilterForm
              areas={areas}
              filters={localFilters}
              onChange={setLocalFilters}
              onApply={handleApply}
              onClear={handleClear}
            />
          </SheetContent>
        </Sheet>
        <span className="text-sm text-muted-foreground">
          {total} questão{total !== 1 ? "ões" : ""}
        </span>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1 text-muted-foreground"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
            Limpar
          </Button>
        )}
      </div>

      {/* Desktop: inline sidebar */}
      <aside className="hidden md:block w-64 shrink-0 self-start sticky top-20">
        <div className="rounded-xl border bg-card p-4 space-y-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {activeCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {activeCount}
                </span>
              )}
            </h2>
            {activeCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground"
                onClick={handleClear}
              >
                Limpar
              </Button>
            )}
          </div>
          <FilterForm
            areas={areas}
            filters={localFilters}
            onChange={setLocalFilters}
            onApply={handleApply}
            onClear={handleClear}
          />
        </div>
      </aside>
    </>
  )
}
