"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { OpalOrb } from "@/components/OpalOrb"
import { LogoBuild } from "@/components/LogoBuild"

/**
 * Sequência de abertura do app — roda uma vez por sessão, automática, sem
 * precisar de toque: logo do Vion → pedra escura aparece → pedra racha e
 * se desfaz em fragmentos → orbe liso revelado → tela inicial. Igual à
 * lógica do vídeo de referência (Opal), mas com a marca do próprio app.
 *
 * Fica por cima do conteúdo real (que já está montando/buscando dados por
 * baixo em paralelo) e desaparece sozinha — não bloqueia nada, só cobre.
 */

type Phase = "logo" | "rock" | "reveal" | "done"

const SHARDS = [
  { x: -110, y: -60, rotate: -60, delay: 0 },
  { x: 100, y: -85, rotate: 70, delay: 0.05 },
  { x: -125, y: 55, rotate: 35, delay: 0.02 },
  { x: 115, y: 70, rotate: -45, delay: 0.08 },
  { x: -30, y: -120, rotate: 100, delay: 0.04 },
  { x: 40, y: 110, rotate: -80, delay: 0.06 },
  { x: -70, y: 90, rotate: 50, delay: 0.1 },
  { x: 70, y: -100, rotate: -30, delay: 0.03 },
]

export function AppSplash() {
  const [phase, setPhase] = useState<Phase | "hidden">("hidden")

  useEffect(() => {
    let already = true
    try {
      already = sessionStorage.getItem("splash-shown") === "1"
    } catch {
      /* sessionStorage indisponível (SSR/privado) — mostra mesmo assim */
    }
    if (already) return

    // Dispara a sequência de animação (não é estado derivado — é um timeline
    // imperativo de fases, disparado uma vez ao montar).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase("logo")
    const t1 = setTimeout(() => setPhase("rock"), 2000)
    const t2 = setTimeout(() => setPhase("reveal"), 3000)
    const t3 = setTimeout(() => {
      setPhase("done")
      try {
        sessionStorage.setItem("splash-shown", "1")
      } catch {
        /* ignore */
      }
    }, 4200)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

  return (
    <AnimatePresence>
      {phase !== "hidden" && phase !== "done" && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-background"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 45%, color-mix(in srgb, var(--glow-mint) 12%, transparent), transparent 70%)",
            }}
          />

          <AnimatePresence mode="wait">
            {phase === "logo" && (
              <motion.div
                key="logo"
                exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.3 } }}
                className="relative z-10"
              >
                <LogoBuild />
              </motion.div>
            )}

            {(phase === "rock" || phase === "reveal") && (
              <motion.div
                key="object"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 flex h-40 w-40 items-center justify-center"
              >
                <div className="opal-breathing-glow" aria-hidden />

                {phase === "reveal" &&
                  SHARDS.map((s, i) => (
                    <motion.span
                      key={i}
                      initial={{ x: 0, y: 0, opacity: 1, scale: 0.9 }}
                      animate={{ x: s.x, y: s.y, opacity: 0, rotate: s.rotate, scale: 0.3 }}
                      transition={{ duration: 0.9, delay: s.delay, ease: "easeOut" }}
                      className="absolute h-3 w-3 rounded-sm bg-[#2a2f35]"
                      style={{ boxShadow: "0 0 6px 1px rgba(0,0,0,0.5)" }}
                    />
                  ))}

                {/* Pedra — some rápido na virada pro reveal (explosão) */}
                <motion.div
                  initial={{ scale: 0.6, opacity: 1 }}
                  animate={
                    phase === "reveal"
                      ? { scale: 1.15, opacity: 0, filter: "blur(4px)" }
                      : { scale: 0.85, opacity: 1, filter: "blur(0px)" }
                  }
                  transition={{ duration: phase === "reveal" ? 0.45 : 0.9, ease: "easeOut" }}
                  className="absolute h-32 w-32"
                  style={{
                    clipPath:
                      "polygon(50% 2%, 68% 10%, 88% 22%, 98% 42%, 92% 65%, 78% 85%, 55% 98%, 32% 92%, 10% 76%, 2% 52%, 8% 28%, 26% 10%)",
                    background: "linear-gradient(155deg, #3a3f45 0%, #1c2024 45%, #0a0c0e 100%)",
                  }}
                />

                {/* Orbe — só entra na fase reveal, com leve overshoot (explosão "empurra" ele) */}
                {phase === "reveal" && (
                  <motion.div
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: [0.4, 1.12, 1], opacity: 1 }}
                    transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute"
                  >
                    <OpalOrb size={112} />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
