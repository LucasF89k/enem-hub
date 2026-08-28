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
  const isMentor = pathname === "/mentor" || pathname.startsWith("/mentor/")
  const hideHeader = isMentor
  // A Home ganha um fundo de galáxia; o resto do app mantém a vinheta padrão.
  const isHome = pathname === "/dashboard"

  if (isExam) {
    return <>{children}</>
  }

  // Mentor: a própria tela se posiciona (fixed) até a BottomNav; aqui só
  // não envolvemos em <main> com padding, pra não sobrar espaço.
  if (isMentor) {
    return (
      <>
        {children}
        <BottomNav />
      </>
    )
  }

  return (
    <>
      {/* Área de conteúdo principal — barra de navegação embaixo em todos os tamanhos */}
      <div className={`relative ${isHome ? "" : "opal-hero-bg"} flex min-h-screen flex-col`}>
        {/* Nebulosa da Home — só um halo atrás do cristal, no topo da tela.
            Rola junto com a página (não é fixed) e some nas bordas via máscara radial. */}
        {isHome && (
          <div
            aria-hidden
            className="opal-nebula pointer-events-none absolute inset-x-0 top-0 z-0 h-[460px] overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/opal/space-bg.webp"
              alt=""
              className="opal-space-drift h-full w-full object-cover motion-reduce:animate-none"
            />
          </div>
        )}

        {!hideHeader && <Header user={user} />}

        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={pathname}
            className="relative z-10 flex-1 pb-24"
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
