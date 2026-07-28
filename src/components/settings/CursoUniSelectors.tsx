"use client"

import { useMemo, useState } from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  CURSOS_ORDENADOS,
  findCurso,
  estimateCutoff,
  AREA_LABEL,
} from "@/constants/cursos"
import {
  universidadesDoCurso,
  findUniversidade,
  TIPO_LABEL,
} from "@/constants/universidades"

interface Option {
  key: string
  primary: string
  secondary: string
  trailing?: string
  search: string
}

function Combobox({
  value,
  options,
  placeholder,
  searchPlaceholder,
  onSelect,
  onClear,
}: {
  value: string
  options: Option[]
  placeholder: string
  searchPlaceholder: string
  onSelect: (key: string) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.key === value)
  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-auto min-h-10 flex-1 justify-between px-3 py-2 text-left font-normal"
          >
            {selected ? (
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm">{selected.primary}</span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {selected.secondary}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>Nada encontrado.</CommandEmpty>
              <CommandGroup>
                {options.map((o) => (
                  <CommandItem
                    key={o.key}
                    value={o.search}
                    onSelect={() => {
                      onSelect(o.key === value ? "" : o.key)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn("h-4 w-4", value === o.key ? "opacity-100" : "opacity-0")}
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{o.primary}</span>
                      <span className="truncate text-[11px] text-muted-foreground">
                        {o.secondary}
                      </span>
                    </span>
                    {o.trailing && (
                      <span className="ml-2 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                        {o.trailing}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={onClear}
          aria-label="Limpar"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export function CursoUniSelectors({
  defaultCourse,
  defaultInstitution,
}: {
  defaultCourse?: string | null
  defaultInstitution?: string | null
}) {
  const [cursoSlug, setCursoSlug] = useState(findCurso(defaultCourse)?.slug ?? "medicina")
  const [uniId, setUniId] = useState(findUniversidade(defaultInstitution)?.id ?? "")

  const curso = findCurso(cursoSlug) ?? findCurso("medicina")!

  const cursoOptions: Option[] = useMemo(
    () =>
      CURSOS_ORDENADOS.map((c) => ({
        key: c.slug,
        primary: c.nome,
        secondary: AREA_LABEL[c.area],
        search: `${c.nome} ${AREA_LABEL[c.area]}`,
      })),
    [],
  )

  const uniOptions: Option[] = useMemo(
    () =>
      universidadesDoCurso(curso.slug, curso.area)
        .map((u) => ({ u, corte: estimateCutoff(curso, u) }))
        .sort((a, b) => b.corte - a.corte)
        .map(({ u, corte }) => ({
          key: u.id,
          primary: u.sigla,
          secondary: `${TIPO_LABEL[u.tipo]} · ${u.cidade}/${u.uf}`,
          trailing: String(corte),
          search: `${u.sigla} ${u.nome} ${u.cidade} ${u.uf}`,
        })),
    [curso],
  )

  function handleCurso(slug: string) {
    const next = slug || "medicina"
    setCursoSlug(next)
    // limpa universidade se ela não oferecer o novo curso
    const c = findCurso(next)!
    const ok = universidadesDoCurso(c.slug, c.area).some((u) => u.id === uniId)
    if (!ok) setUniId("")
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name="targetCourse" value={cursoSlug} />
      <input type="hidden" name="targetInstitution" value={uniId} />

      <div className="space-y-1.5">
        <Label>Curso desejado</Label>
        <Combobox
          value={cursoSlug}
          options={cursoOptions}
          placeholder="Selecione o curso…"
          searchPlaceholder="Buscar curso…"
          onSelect={handleCurso}
          onClear={() => handleCurso("")}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Universidade-alvo</Label>
        <Combobox
          value={uniId}
          options={uniOptions}
          placeholder="Selecione a universidade…"
          searchPlaceholder="Buscar universidade…"
          onSelect={setUniId}
          onClear={() => setUniId("")}
        />
        <p className="text-xs text-muted-foreground">
          Notas de corte estimadas para <b className="text-foreground">{curso.nome}</b>. Também dá
          pra escolher direto no início.
        </p>
      </div>
    </div>
  )
}
