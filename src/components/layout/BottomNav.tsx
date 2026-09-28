"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Home,
  BookOpen,
  MessageCircle,
  Medal,
  CalendarRange,
  MoreHorizontal,
  User,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePlano } from "@/hooks/use-plano"
import { PlanoTipo } from "@prisma/client"

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
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const isActive =
    pathname.startsWith("/profile") || pathname.startsWith("/assine")

  const labelPlano =
    plano === PlanoTipo.PRO_ANUAL
      ? "Pro Anual"
      : plano === PlanoTipo.PRO_MENSAL
        ? "Pro Mensal"
        : null

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div ref={ref} className="relative flex min-h-[56px] min-w-0 flex-1 items-stretch">
      <button
        aria-label="Mais opções"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative flex w-full flex-col items-center justify-center gap-0.5 px-0.5 transition-colors",
          isActive || open
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {(isActive || open) && <ActiveHighlight />}
        <MoreHorizontal
          className="h-5 w-5 shrink-0"
          strokeWidth={isActive || open ? 2.5 : 1.75}
        />
        <span className="w-full truncate text-center text-[9.5px] font-medium leading-none">
          Mais
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute bottom-full right-0 mb-2 w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
          >
            <nav className="flex flex-col divide-y divide-border">
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted/40"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15">
                  <User className="h-4 w-4 text-blue-400" />
                </span>
                Perfil
              </Link>

              <Link
                href="/assine"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mascote/icone-joinha.png"
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
                <span className="flex-1">Assinatura</span>
                {pro && labelPlano && (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 ring-1 ring-amber-500/30">
                    {labelPlano}
                  </span>
                )}
                {!pro && (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-500/30">
                    Upgrade
                  </span>
                )}
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
