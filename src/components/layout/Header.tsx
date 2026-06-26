"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { GlobalSearch } from "@/components/search/GlobalSearch"

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Início",
  "/study": "Estudar",
  "/flashcards": "Revisões",
  "/questions": "Questões",
  "/simulados": "Simulados",
  "/redacao": "Redação",
  "/planner": "Planner",
  "/notes": "Notas",
  "/analytics": "Analytics",
  "/profile": "Perfil",
  "/mentor": "Mentor ENEM",
  "/conquistas": "Conquistas",
  "/onboarding": "Boas-vindas",
}

function getPageTitle(pathname: string): string {
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === path || pathname.startsWith(path + "/")) return title
  }
  return "ENEM Hub"
}

interface HeaderProps {
  actions?: React.ReactNode
  className?: string
}

export function Header({ actions, className }: HeaderProps) {
  const pathname = usePathname()

  return (
    <header
      className={cn(
        "flex items-center h-12 px-4 gap-3 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40 shrink-0",
        className
      )}
    >
      {/* Page title — mobile only */}
      <h1 className="text-base font-semibold text-foreground truncate md:hidden flex-1">
        {getPageTitle(pathname)}
      </h1>

      {/* Search bar — expands on desktop */}
      <div className="hidden md:flex flex-1">
        <GlobalSearch />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {actions}
      </div>

      {/* Search icon — mobile */}
      <div className="md:hidden">
        <GlobalSearch iconOnly />
      </div>
    </header>
  )
}
