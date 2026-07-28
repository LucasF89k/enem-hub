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
  MessageCircle,
  User,
  Layers,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

// Itens diretos da barra. "Estudar" é tratado à parte (abre um menu).
const NAV_ITEMS = [
  { icon: Home, label: "Início", href: "/dashboard" },
  { icon: BarChart2, label: "Evolução", href: "/analytics" },
  { icon: Calendar, label: "Planner", href: "/planner" },
  { icon: Trophy, label: "Conquistas", href: "/conquistas" },
  { icon: MessageCircle, label: "Mentor", href: "/mentor" },
  { icon: User, label: "Perfil", href: "/profile" },
] as const

// Opções que abrem no menu "Estudar".
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
    description: "Provas cronometradas no estilo ENEM",
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

  // Insere o botão "Estudar" na segunda posição.
  const before = NAV_ITEMS.slice(0, 1)
  const after = NAV_ITEMS.slice(1)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background/90 backdrop-blur-md"
      aria-label="Navegação principal"
    >
      <div className="flex items-stretch h-14 safe-area-bottom">
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

        {/* Botão Estudar — abre o menu */}
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <button type="button" className={itemClass(studyActive)} aria-label="Abrir menu de estudo">
              {studyActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />}
              <BookOpen className="w-5 h-5 shrink-0" strokeWidth={studyActive ? 2.5 : 1.75} />
              <span className="w-full truncate text-center text-[9.5px] font-medium leading-none">Estudar</span>
            </button>
          </DrawerTrigger>
          <DrawerContent className="md:hidden">
            <DrawerHeader className="pb-2 text-left">
              <DrawerTitle>O que você quer estudar?</DrawerTitle>
            </DrawerHeader>
            <div className="space-y-2 px-4 pb-8">
              {STUDY_OPTIONS.map(({ icon: Icon, label, description, href }) => (
                <DrawerClose asChild key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-3 rounded-2xl border p-3.5 transition-colors hover:bg-muted/50 active:scale-[0.99]"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{label}</p>
                      <p className="truncate text-xs text-muted-foreground">{description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                </DrawerClose>
              ))}
            </div>
          </DrawerContent>
        </Drawer>

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
