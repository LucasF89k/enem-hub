"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Trophy, Flame } from "lucide-react"
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

// Rotas cuja própria página já mostra um <h1> (com subtítulo, na maioria):
// nelas o título do Header ficaria duplicado no mobile, empilhado em cima
// do título real da página. Só ficam de fora as que não têm título próprio
// (ex: /flashcards).
const PAGES_WITH_OWN_TITLE = [
  "/simulados",
  "/redacao",
  "/analytics",
  "/profile",
  "/conquistas",
]

function hasOwnTitle(pathname: string): boolean {
  return PAGES_WITH_OWN_TITLE.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

interface HeaderProps {
  actions?: React.ReactNode
  className?: string
  user?: { name?: string | null; image?: string | null; level?: number; totalXP?: number; streak?: number }
}

export function Header({ actions, className, user }: HeaderProps) {
  const pathname = usePathname()
  // Telas com hero próprio (fundo de galáxia): header transparente, sem borda.
  const transparentHeader = pathname === "/dashboard" || pathname === "/profile"
  const onHome = pathname === "/dashboard"
  const firstName = user?.name?.split(" ")[0] ?? ""

  return (
    <header
      className={cn(
        "flex items-center h-12 px-4 gap-3 sticky top-0 z-40 shrink-0 transition-colors",
        transparentHeader
          ? "border-b border-transparent bg-transparent"
          : "border-b border-border bg-background/80 backdrop-blur-sm",
        className
      )}
    >
      {/* Logo Vion (desktop) */}
      <Link href="/dashboard" className="hidden md:flex items-center gap-2 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-app.png" alt="Vion" className="h-7 w-7 object-contain" />
        <span className="text-lg font-bold tracking-tight">Vion</span>
      </Link>

      {/* Page title, mobile only. Na Home vira "Olá, Nome" + streak.
          Rotas com título próprio (hasOwnTitle) não repetem aqui: a página
          já mostra o <h1> dela logo abaixo. */}
      {onHome ? (
        <div className="flex items-center gap-2.5 md:hidden">
          <h1 className="text-base font-semibold text-foreground truncate">
            Olá, {firstName}
          </h1>
          <span className="flex items-center gap-1 rounded-full bg-warning/12 px-2 py-0.5 text-xs font-semibold text-warning">
            <Flame className="h-3 w-3 fill-warning" />
            {user?.streak ?? 0}
          </span>
        </div>
      ) : (
        !hasOwnTitle(pathname) && (
          <h1 className="text-base font-semibold text-foreground truncate md:hidden">
            {getPageTitle(pathname)}
          </h1>
        )
      )}

      {/* Empurra nível/avatar para a direita */}
      <div className="flex-1" />

      {/* Right actions */}
      {actions && <div className="flex items-center gap-1">{actions}</div>}

      {/* Conquistas: acesso rápido fixo em qualquer tela, ao lado do nível */}
      {pathname !== "/conquistas" && !pathname.startsWith("/conquistas/") && (
        <Link
          href="/conquistas"
          aria-label="Ver minhas conquistas"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
        >
          <Trophy className="h-4 w-4" />
        </Link>
      )}

      {/* Nível/XP */}
      {user && <LevelBadge level={user.level ?? 1} totalXP={user.totalXP ?? 0} />}

      {/* Avatar no canto direito */}
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
