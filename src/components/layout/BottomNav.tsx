"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BookOpen, Brain, HelpCircle, ClipboardList, MessageCircle, User } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { icon: Home, label: "Início", href: "/dashboard" },
  { icon: BookOpen, label: "Estudar", href: "/study" },
  { icon: Brain, label: "Flashcards", href: "/flashcards" },
  { icon: HelpCircle, label: "Questões", href: "/questions" },
  { icon: ClipboardList, label: "Simulados", href: "/simulados" },
  { icon: MessageCircle, label: "Mentor", href: "/mentor" },
  { icon: User, label: "Perfil", href: "/profile" },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background/90 backdrop-blur-md"
      aria-label="Navegação principal"
    >
      <div className="flex items-stretch h-14 safe-area-bottom">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors relative min-w-0 px-0.5",
                "min-h-[56px]", // área de toque mínima
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
              )}
              <Icon className="w-5 h-5 shrink-0" strokeWidth={active ? 2.5 : 1.75} />
              <span className="w-full truncate text-center text-[9.5px] font-medium leading-none">
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
