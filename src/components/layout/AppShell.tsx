"use client"

import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { BottomNav } from "./BottomNav"

interface AppShellProps {
  children: React.ReactNode
  user?: { name?: string | null; email?: string | null; image?: string | null }
}

// Matches /simulados/[id]/[attemptId] (exactly 3 segments, no trailing /result)
const EXAM_ROUTE = /^\/simulados\/[^/]+\/[^/]+$/

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname()
  const isExam = EXAM_ROUTE.test(pathname)

  if (isExam) {
    return <>{children}</>
  }

  return (
    <>
      {/* Sidebar — fixa, apenas tablet+ */}
      <Sidebar user={user} />

      {/* Área de conteúdo principal */}
      <div className="min-h-screen flex flex-col md:pl-60 lg:pl-64">
        <Header />

        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={pathname}
            className="flex-1 pb-24 md:pb-8"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>

      {/* BottomNav — fixo, apenas mobile */}
      <BottomNav />
    </>
  )
}
