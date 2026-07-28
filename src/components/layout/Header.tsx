"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { LevelBadge } from "@/components/dashboard/LevelBadge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function initials(name?: string | null) {
  if (!name) return "U"
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Início",
  "/study": "Estudar",
  "/flashcards": "Flashcards",
  "/simulados": "Simulados",
  "/redacao": "Redação",
  "/planner": "Planner",
  "/notes": "Notas",
  "/analytics": "Analytics",
  "/profile": "Perfil",
  "/mentor": "Mentor ENEM",
  "/conquistas": "Conquistas",
  "/ranking": "Ranking",
  "/onboarding": "Boas-vindas",
}

function getPageTitle(pathname: string): string {
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === path || pathname.startsWith(path + "/")) return title
  }
  return "Vion"
}

interface HeaderProps {
  actions?: React.ReactNode
  className?: string
  user?: { name?: string | null; image?: string | null; level?: number; totalXP?: number }
}

export function Header({ actions, className, user }: HeaderProps) {
  const pathname = usePathname()

  return (
    <header
      className={cn(
        "flex items-center h-12 px-4 gap-3 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40 shrink-0",
        className
      )}
    >
      {/* Logo Vion — desktop */}
      <Link href="/dashboard" className="hidden md:flex items-center gap-2 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-app.png" alt="Vion" className="h-7 w-7 object-contain" />
        <span className="text-lg font-bold tracking-tight">Vion</span>
      </Link>

      {/* Page title — mobile only */}
      <h1 className="text-base font-semibold text-foreground truncate md:hidden">
        {getPageTitle(pathname)}
      </h1>

      {/* Empurra nível/avatar para a direita */}
      <div className="flex-1" />

      {/* Right actions */}
      {actions && <div className="flex items-center gap-1">{actions}</div>}

      {/* Nível/XP */}
      {user && <LevelBadge level={user.level ?? 1} totalXP={user.totalXP ?? 0} />}

      {/* Avatar — canto direito */}
      {user && (
        <Link href="/profile" className="shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? "Avatar"} />
            <AvatarFallback className="bg-primary/15 text-[11px] font-medium text-primary">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
        </Link>
      )}
    </header>
  )
}
