"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
  FACULDADES_MEDICINA_RANK,
  findFaculdade,
  TIPO_LABEL,
} from "@/constants/faculdades-medicina"

/** Combobox pesquisável — persiste o id da faculdade no input hidden `targetInstitution`. */
export function FaculdadeCombobox({ defaultValue }: { defaultValue?: string | null }) {
  const initial = findFaculdade(defaultValue)?.id ?? ""
  const [value, setValue] = useState(initial)
  const [open, setOpen] = useState(false)
  const selected = findFaculdade(value)

  return (
    <div className="flex gap-2">
      <input type="hidden" name="targetInstitution" value={value} />
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
                <span className="truncate text-sm">{selected.sigla}</span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {TIPO_LABEL[selected.tipo]} · {selected.cidade}/{selected.estado} · corte ~
                  {Math.round(selected.notaCorte)}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">Selecione sua faculdade-alvo…</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar: USP, UnB, ESCS, cidade…" />
            <CommandList>
              <CommandEmpty>Nenhuma faculdade encontrada.</CommandEmpty>
              <CommandGroup>
                {FACULDADES_MEDICINA_RANK.map((f) => (
                  <CommandItem
                    key={f.id}
                    value={`${f.sigla} ${f.nome} ${f.cidade} ${f.estado}`}
                    onSelect={() => {
                      setValue(f.id === value ? "" : f.id)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn("h-4 w-4", value === f.id ? "opacity-100" : "opacity-0")}
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{f.sigla}</span>
                      <span className="truncate text-[11px] text-muted-foreground">
                        {TIPO_LABEL[f.tipo]} · {f.cidade}/{f.estado}
                      </span>
                    </span>
                    <span className="ml-2 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                      {Math.round(f.notaCorte)}
                    </span>
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
          onClick={() => setValue("")}
          aria-label="Limpar faculdade"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
