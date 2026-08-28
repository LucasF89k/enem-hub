"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  Home,
  BookOpen,
  MessageCircle,
  Medal,
  User,
  CalendarRange,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Item {
  icon: LucideIcon
  label: string
  href: string
  /** Rotas extras que também acendem este item (além de href e href/*). */
  match?: string[]
}

const ITEMS: Item[] = [
  { icon: Home, label: "Início", href: "/dashboard" },
  {
    icon: BookOpen,
    label: "Estudar",
    href: "/study",
    match: ["/flashcards", "/simulados", "/redacao"],
  },
  {
    icon: CalendarRange,
    label: "Plano",
    href: "/planner",
  },
  { icon: MessageCircle, label: "Mentor", href: "/mentor" },
  { icon: Medal, label: "Ranking", href: "/ranking" },
  { icon: User, label: "Perfil", href: "/profile" },
]

/** Cápsula de fundo que desliza entre os itens ativos (Opal §4.6/6.6). */
function ActiveHighlight() {
  return (
    <motion.span
      layoutId="bottom-nav-highlight"
      className="absolute inset-x-1 inset-y-1 -z-10 rounded-2xl bg-primary/10"
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
    />
  )
}

export function BottomNav() {
  const pathname = usePathname()

  const isActive = (item: Item) => {
    const routes = [item.href, ...(item.match ?? [])]
    return routes.some((r) => pathname === r || pathname.startsWith(r + "/"))
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-md"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex h-14 max-w-2xl items-stretch">
        {ITEMS.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-[56px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active && <ActiveHighlight />}
              <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 1.75} />
              <span className="w-full truncate text-center text-[9.5px] font-medium leading-none">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
