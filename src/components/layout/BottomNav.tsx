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
  Medal,
  MessageCircle,
  User,
  Layers,
  PenLine,
  LineChart,
  ChevronRight,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Opt {
  icon: LucideIcon
  label: string
  description: string
  href: string
}
type Item =
  | { kind: "link"; icon: LucideIcon; label: string; href: string }
  | { kind: "launcher"; icon: LucideIcon; label: string; routes: string[]; options: Opt[] }

const STUDY_OPTIONS: Opt[] = [
  { icon: Layers, label: "Conteúdos", description: "Teoria, resumos, vídeos e questões", href: "/study" },
  { icon: Brain, label: "Flashcards", description: "Revisão espaçada (SM-2)", href: "/flashcards" },
  { icon: ClipboardList, label: "Simulados", description: "Provas no estilo ENEM", href: "/simulados" },
  { icon: PenLine, label: "Redação", description: "Escreva e receba correção", href: "/redacao" },
]

const PROGRESS_OPTIONS: Opt[] = [
  { icon: BarChart2, label: "Evolução", description: "Seu desempenho e evolução", href: "/analytics" },
  { icon: Calendar, label: "Plano de estudos", description: "Sua rotina no Planner", href: "/planner" },
]

const ITEMS: Item[] = [
  { kind: "link", icon: Home, label: "Início", href: "/dashboard" },
  { kind: "launcher", icon: BookOpen, label: "Estudar", routes: ["/study", "/flashcards", "/simulados", "/redacao"], options: STUDY_OPTIONS },
  { kind: "launcher", icon: LineChart, label: "Progresso", routes: ["/analytics", "/planner"], options: PROGRESS_OPTIONS },
  { kind: "link", icon: MessageCircle, label: "Mentor", href: "/mentor" },
  { kind: "link", icon: Medal, label: "Ranking", href: "/ranking" },
  { kind: "link", icon: User, label: "Perfil", href: "/profile" },
]

function itemClass(active: boolean) {
  return cn(
    "flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors relative min-w-0 px-0.5 min-h-[56px]",
    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
  )
}

function ActiveBar() {
  return <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
}

function NavLink({ item, active }: { item: Extract<Item, { kind: "link" }>; active: boolean }) {
  const Icon = item.icon
  return (
    <Link href={item.href} className={itemClass(active)} aria-current={active ? "page" : undefined}>
      {active && <ActiveBar />}
      <Icon className="w-5 h-5 shrink-0" strokeWidth={active ? 2.5 : 1.75} />
      <span className="w-full truncate text-center text-[9.5px] font-medium leading-none">{item.label}</span>
    </Link>
  )
}

function NavLauncher({
  item,
  active,
}: {
  item: Extract<Item, { kind: "launcher" }>
  active: boolean
}) {
  const [open, setOpen] = useState(false)
  const Icon = item.icon
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={itemClass(active)} aria-label={`Abrir ${item.label}`}>
          {active && <ActiveBar />}
          <Icon className="w-5 h-5 shrink-0" strokeWidth={active ? 2.5 : 1.75} />
          <span className="w-full truncate text-center text-[9.5px] font-medium leading-none">{item.label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="center" sideOffset={10} className="w-64 rounded-2xl p-1.5 shadow-xl">
        {item.options.map(({ icon: OptIcon, label, description, href }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-muted/60 active:scale-[0.99]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <OptIcon className="h-4 w-4 text-primary" />
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
  )
}

export function BottomNav() {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-md"
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex max-w-2xl items-stretch h-14 safe-area-bottom">
        {ITEMS.map((item) =>
          item.kind === "link" ? (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ) : (
            <NavLauncher key={item.label} item={item} active={item.routes.some(isActive)} />
          ),
        )}
      </div>
    </nav>
  )
}
