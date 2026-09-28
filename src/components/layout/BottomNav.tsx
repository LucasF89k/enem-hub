"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  Home,
  BookOpen,
  MessageCircle,
  Medal,
  CalendarRange,
  MoreHorizontal,
  User,
  Crown,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { usePlano } from "@/hooks/use-plano"
import { PlanoTipo } from "@prisma/client"
import { Mascote } from "@/components/Mascote"

interface Item {
  icon: LucideIcon
  label: string
  href: string
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
]

function ActiveHighlight() {
  return (
    <motion.span
      layoutId="bottom-nav-highlight"
      className="absolute inset-x-1 inset-y-1 -z-10 rounded-2xl bg-primary/10"
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
    />
  )
}

function MaisMenu() {
  const { pro, plano } = usePlano()
  const pathname = usePathname()
  const isActive =
    pathname.startsWith("/profile") || pathname.startsWith("/assine")

  const labelPlano =
    plano === PlanoTipo.PRO_ANUAL
      ? "Pro Anual"
      : plano === PlanoTipo.PRO_MENSAL
        ? "Pro Mensal"
        : null

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          aria-label="Mais opções"
          className={cn(
            "relative flex min-h-[56px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 transition-colors",
            isActive
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {isActive && <ActiveHighlight />}
          <MoreHorizontal
            className="h-5 w-5 shrink-0"
            strokeWidth={isActive ? 2.5 : 1.75}
          />
          <span className="w-full truncate text-center text-[9.5px] font-medium leading-none">
            Mais
          </span>
        </button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="rounded-t-2xl px-0 pb-0"
        // remove o X padrão — não há título, e o overlay fecha ao tocar fora
        aria-describedby={undefined}
      >
        {/* Puxador visual */}
        <div className="mx-auto mb-4 mt-2 h-1 w-10 rounded-full bg-muted" />

        <nav className="flex flex-col divide-y divide-border">
          {/* Perfil */}
          <Link
            href="/profile"
            className="flex items-center gap-4 px-6 py-4 text-base font-semibold transition-colors hover:bg-muted/40"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15">
              <User className="h-5 w-5 text-blue-400" />
            </span>
            Perfil
          </Link>

          {/* Assinatura */}
          <Link
            href="/assine"
            className="flex items-center gap-4 px-6 py-4 text-base font-semibold transition-colors hover:bg-muted/40"
          >
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-violet-500/10">
              <Mascote pose="aprovando" size={40} />
            </span>
            <span className="flex-1">Assinatura</span>
            {pro && labelPlano && (
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-400 ring-1 ring-amber-500/30">
                {labelPlano}
              </span>
            )}
            {!pro && (
              <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-bold text-violet-400">
                Upgrade
              </span>
            )}
          </Link>
        </nav>

        {/* Espaço para safe-area iOS */}
        <div style={{ height: "max(env(safe-area-inset-bottom), 1.5rem)" }} />
      </SheetContent>
    </Sheet>
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
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active && <ActiveHighlight />}
              <Icon
                className="h-5 w-5 shrink-0"
                strokeWidth={active ? 2.5 : 1.75}
              />
              <span className="w-full truncate text-center text-[9.5px] font-medium leading-none">
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* Botão ⋯ com Sheet */}
        <MaisMenu />
      </div>
    </nav>
  )
}
