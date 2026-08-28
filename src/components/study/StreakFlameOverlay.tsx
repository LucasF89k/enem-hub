"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lottie } from "lottie-react"
import fireAnimation from "./fire.json"

interface Props {
  open: boolean
  onClose: () => void
  /** true = a sequência de dias subiu; false = só um acerto normal */
  streakIncreased: boolean
  streak: number
  xp?: number
}

/**
 * Overlay comemorativo ao acertar uma questão — a chama "acende" (escala +
 * tremor), solta brasas, e some sozinho em ~2s (ou ao toque). Inspirado no
 * feedback de streak do Duolingo/Opal.
 */
export function StreakFlameOverlay({ open, onClose, streakIncreased, streak, xp = 10 }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    const t = setTimeout(onClose, streakIncreased ? 2600 : 1600)
    return () => clearTimeout(t)
  }, [open, streakIncreased, onClose])

  const EMBERS = 7

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          role="status"
          aria-live="polite"
        >
          <div className="relative flex flex-col items-center">
            {/* halo pulsante */}
            <motion.div
              aria-hidden
              className="absolute h-48 w-48 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, color-mix(in srgb, var(--warning) 45%, transparent), transparent 70%)",
                filter: "blur(24px)",
              }}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.3, 1.15, 1], opacity: [0, 0.9, 0.65] }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />

            {/* brasas subindo */}
            {Array.from({ length: EMBERS }).map((_, i) => {
              const angle = (i / EMBERS) * Math.PI - Math.PI / 2
              const dist = 60 + (i % 3) * 22
              return (
                <motion.span
                  key={i}
                  aria-hidden
                  className="absolute h-1.5 w-1.5 rounded-full bg-warning"
                  initial={{ x: 0, y: 10, opacity: 0, scale: 1 }}
                  animate={{
                    x: Math.cos(angle) * dist,
                    y: -Math.abs(Math.sin(angle)) * dist - 40,
                    opacity: [0, 1, 0],
                    scale: [1, 0.6, 0.2],
                  }}
                  transition={{ duration: 1.1, delay: 0.1 + i * 0.04, ease: "easeOut" }}
                />
              )
            })}

            {/* a chama — Lottie */}
            <motion.div
              initial={{ scale: 0.3, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 240, damping: 18, delay: 0.05 }}
            >
              {mounted && (
                <Lottie
                  src={fireAnimation}
                  loop
                  autoplay
                  style={{ width: 150, height: 150 }}
                />
              )}
            </motion.div>

            {/* texto */}
            <motion.div
              className="mt-3 text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              {streakIncreased ? (
                <>
                  <p className="text-3xl font-extrabold tracking-tight text-warning">{streak}</p>
                  <p className="text-sm font-medium text-foreground">
                    {streak === 1 ? "dia de sequência!" : "dias seguidos!"}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold text-foreground">Resposta certa!</p>
                  <p className="text-sm font-medium text-warning">+{xp} XP</p>
                </>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
