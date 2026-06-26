"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { searchAll, type SearchResult } from "@/app/actions/search.actions"
import { BookOpen, HelpCircle, Brain, FileText, Loader2 } from "lucide-react"

const TYPE_CONFIG = {
  content: { label: "Conteúdo", Icon: BookOpen },
  question: { label: "Questões", Icon: HelpCircle },
  flashcard: { label: "Flashcards", Icon: Brain },
  note: { label: "Notas", Icon: FileText },
} as const

export function GlobalSearch({ iconOnly = false }: { iconOnly?: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 2) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const res = await searchAll(query)
        setResults(res)
      })
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  function handleSelect(href: string) {
    setOpen(false)
    setQuery("")
    setResults([])
    router.push(href)
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) {
      setQuery("")
      setResults([])
    }
  }

  // Group results by type
  const grouped = (["content", "question", "flashcard", "note"] as const).map((type) => ({
    type,
    items: results.filter((r) => r.type === type),
  })).filter((g) => g.items.length > 0)

  return (
    <>
      {/* Trigger */}
      {iconOnly ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-border text-muted-foreground hover:bg-muted/50 transition-colors"
          aria-label="Busca global"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm text-muted-foreground border border-border rounded-lg px-3 h-9 hover:bg-muted/50 transition-colors w-full"
          aria-label="Busca global (Ctrl+K)"
        >
          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <span className="flex-1 text-left text-xs">Buscar…</span>
          <kbd className="hidden md:inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
            <span>⌘</span>K
          </kbd>
        </button>
      )}

      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <CommandInput
          placeholder="Buscar conteúdo, questões, flashcards…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isPending && (
            <div className="flex items-center justify-center py-6 text-muted-foreground gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando…
            </div>
          )}

          {!isPending && query.length >= 2 && results.length === 0 && (
            <CommandEmpty>Nenhum resultado para &ldquo;{query}&rdquo;</CommandEmpty>
          )}

          {!isPending && query.length < 2 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Digite pelo menos 2 caracteres para buscar
            </div>
          )}

          {!isPending && grouped.map((group, i) => {
            const { Icon, label } = TYPE_CONFIG[group.type]
            return (
              <div key={group.type}>
                {i > 0 && <CommandSeparator />}
                <CommandGroup heading={label}>
                  {group.items.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={`${item.type}-${item.id}-${item.title}`}
                      onSelect={() => handleSelect(item.href)}
                      className="gap-3"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{item.title}</p>
                        {item.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </div>
            )
          })}
        </CommandList>
      </CommandDialog>
    </>
  )
}
