"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  BookOpen,
  Brain,
  ClipboardList,
  BarChart2,
  Calendar,
  Trophy,
  Medal,
  MessageCircle,
  User,
  Layers,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Itens diretos da barra. "Estudar" é tratado à parte (abre um balão).
const NAV_ITEMS = [
  { icon: Home, label: "Início", href: "/dashboard" },
  { icon: BarChart2, label: "Evolução", href: "/analytics" },
  { icon: Calendar, label: "Planner", href: "/planner" },
  { icon: MessageCircle, label: "Mentor", href: "/mentor" },
  { icon: Medal, label: "Ranking", href: "/ranking" },
  { icon: Trophy, label: "Conquistas", href: "/conquistas" },
  { icon: User, label: "Perfil", href: "/profile" },
] as const

// Opções que abrem no balão "Estudar".
const STUDY_OPTIONS = [
  {
    icon: Layers,
    label: "Conteúdos",
    description: "Teoria, resumos, vídeos e questões",
    href: "/study",
  },
  {
    icon: Brain,
    label: "Flashcards",
    description: "Revisão espaçada (SM-2)",
    href: "/flashcards",
  },
  {
    icon: ClipboardList,
    label: "Simulados",
    description: "Provas no estilo ENEM",
    href: "/simulados",
  },
] as const

const STUDY_ROUTES = ["/study", "/flashcards", "/simulados"]

function itemClass(active: boolean) {
  return cn(
    "flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors relative min-w-0 px-0.5 min-h-[56px]",
    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
  )
}

export function BottomNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const studyActive = STUDY_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"))

  const before = NAV_ITEMS.slice(0, 1)
  const after = NAV_ITEMS.slice(1)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-md"
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex max-w-2xl items-stretch h-14 safe-area-bottom">
        {before.map(({ icon: Icon, label, href }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link key={href} href={href} className={itemClass(active)} aria-current={active ? "page" : undefined}>
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />}
              <Icon className="w-5 h-5 shrink-0" strokeWidth={active ? 2.5 : 1.75} />
              <span className="w-full truncate text-center text-[9.5px] font-medium leading-none">{label}</span>
            </Link>
          )
        })}

        {/* Botão Estudar — abre um balão flutuante */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button type="button" className={itemClass(studyActive)} aria-label="Abrir menu de estudo">
              {studyActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />}
              <BookOpen className="w-5 h-5 shrink-0" strokeWidth={studyActive ? 2.5 : 1.75} />
              <span className="w-full truncate text-center text-[9.5px] font-medium leading-none">Estudar</span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="center"
            sideOffset={10}
            className="w-64 rounded-2xl p-1.5 shadow-xl"
          >
            {STUDY_OPTIONS.map(({ icon: Icon, label, description, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-muted/60 active:scale-[0.99]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight">{label}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{description}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </PopoverContent>
        </Popover>

        {after.map(({ icon: Icon, label, href }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link key={href} href={href} className={itemClass(active)} aria-current={active ? "page" : undefined}>
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />}
              <Icon className="w-5 h-5 shrink-0" strokeWidth={active ? 2.5 : 1.75} />
              <span className="w-full truncate text-center text-[9.5px] font-medium leading-none">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
