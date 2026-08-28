"use client"

import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Header } from "./Header"
import { BottomNav } from "./BottomNav"

interface AppShellProps {
  children: React.ReactNode
  user?: { name?: string | null; image?: string | null; level?: number; totalXP?: number }
}

// Matches /simulados/[id]/[attemptId] (exactly 3 segments, no trailing /result)
const EXAM_ROUTE = /^\/simulados\/[^/]+\/[^/]+$/

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname()
  const isExam = EXAM_ROUTE.test(pathname)
  // O Mentor tem cabeçalho próprio — esconde a barra de topo para não empilhar logos.
  const hideHeader = pathname === "/mentor" || pathname.startsWith("/mentor/")
  // A Home ganha um fundo de galáxia; o resto do app mantém a vinheta padrão.
  const isHome = pathname === "/dashboard"

  if (isExam) {
    return <>{children}</>
  }

  return (
    <>
      {/* Fundo de galáxia — só na Home, atrás de tudo, com drift lento */}
      {isHome && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[620px] overflow-hidden bg-background"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/opal/space-bg.webp"
            alt=""
            className="opal-space-drift absolute -inset-[8%] h-[116%] w-[116%] object-cover opacity-90 motion-reduce:animate-none"
          />
          {/* glow atrás da gema + fade pro fundo na base, pra não ter linha dura */}
          <div className="absolute inset-0 bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--glow-mint)_10%,transparent),transparent_70%)] bg-[length:70%_55%] bg-[position:50%_36%] bg-no-repeat" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background" />
        </div>
      )}

      {/* Área de conteúdo principal — barra de navegação embaixo em todos os tamanhos */}
      <div className={`${isHome ? "" : "opal-hero-bg"} flex min-h-screen flex-col`}>
        {!hideHeader && <Header user={user} />}

        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={pathname}
            className="flex-1 pb-24"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>

      {/* BottomNav — fixo, em todos os tamanhos */}
      <BottomNav />
    </>
  )
}
