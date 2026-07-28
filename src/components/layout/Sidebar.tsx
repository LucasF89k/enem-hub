"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home, BookOpen, Brain, HelpCircle, User,
  BarChart2, Calendar, FileText, MessageCircle, Settings, Trophy,
  ChevronLeft, ChevronRight,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const PRIMARY_NAV = [
  { icon: Home, label: "Início", href: "/dashboard" },
  { icon: BookOpen, label: "Estudar", href: "/study" },
  { icon: Brain, label: "Flashcards", href: "/flashcards" },
  { icon: HelpCircle, label: "Questões", href: "/questions" },
  { icon: FileText, label: "Simulados", href: "/simulados" },
  { icon: User, label: "Perfil", href: "/profile" },
] as const

const SECONDARY_NAV = [
  { icon: BarChart2, label: "Analytics", href: "/analytics" },
  { icon: Calendar, label: "Planner", href: "/planner" },
  { icon: Trophy, label: "Conquistas", href: "/conquistas" },
  { icon: MessageCircle, label: "Mentor", href: "/mentor" },
  { icon: Settings, label: "Configurações", href: "/profile/settings" },
] as const

interface SidebarProps {
  user?: { name?: string | null; email?: string | null; image?: string | null }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(true)

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U"

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col fixed left-0 top-0 h-full z-40",
        "bg-card border-r border-border transition-all duration-300 ease-in-out",
        expanded ? "w-60 lg:w-64" : "w-16"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center h-12 border-b border-border shrink-0 px-3",
          expanded ? "gap-2.5" : "justify-center"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-app.png" alt="Vion" className="h-9 w-auto shrink-0 object-contain" />
        {expanded && (
          <span className="text-sm font-bold text-foreground truncate">Vion</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {PRIMARY_NAV.map(({ icon: Icon, label, href }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              title={!expanded ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                !expanded && "justify-center px-2"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
              {expanded && <span>{label}</span>}
            </Link>
          )
        })}

        <div className="my-2 border-t border-border" />

        {SECONDARY_NAV.map(({ icon: Icon, label, href }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              title={!expanded ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                !expanded && "justify-center px-2"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {expanded && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-border p-2 space-y-1">
        {/* Toggle — visível apenas no tablet (md a lg) */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "lg:hidden w-full flex items-center rounded-xl px-2.5 py-2 text-muted-foreground",
            "hover:bg-muted hover:text-foreground transition-colors",
            !expanded && "justify-center"
          )}
          aria-label={expanded ? "Recolher menu" : "Expandir menu"}
        >
          {expanded ? (
            <>
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span className="text-xs ml-2">Recolher</span>
            </>
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {/* User info */}
        {expanded ? (
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "Avatar"} />
              <AvatarFallback className="text-xs bg-primary/20 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.name ?? "Usuário"}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "Avatar"} />
              <AvatarFallback className="text-xs bg-primary/20 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    </aside>
  )
}
