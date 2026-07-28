"use client"

import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Header } from "./Header"
import { BottomNav } from "./BottomNav"

interface AppShellProps {
  children: React.ReactNode
}

// Matches /simulados/[id]/[attemptId] (exactly 3 segments, no trailing /result)
const EXAM_ROUTE = /^\/simulados\/[^/]+\/[^/]+$/

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const isExam = EXAM_ROUTE.test(pathname)
  // O Mentor tem cabeçalho próprio — esconde a barra de topo para não empilhar logos.
  const hideHeader = pathname === "/mentor" || pathname.startsWith("/mentor/")

  if (isExam) {
    return <>{children}</>
  }

  return (
    <>
      {/* Área de conteúdo principal — barra de navegação embaixo em todos os tamanhos */}
      <div className="min-h-screen flex flex-col">
        {!hideHeader && <Header />}

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
