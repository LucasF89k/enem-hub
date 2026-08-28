"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

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

            {/* a chama */}
            <motion.div
              initial={{ scale: 0.2, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.05 }}
            >
              <motion.div
                animate={{ rotate: [-2.5, 2.5, -1.5, 2, -2.5], scale: [1, 1.04, 0.98, 1.03, 1] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg width="96" height="120" viewBox="0 0 96 120" fill="none">
                  <defs>
                    <linearGradient id="flame-outer" x1="48" y1="8" x2="48" y2="116" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor="#FFD36B" />
                      <stop offset="0.45" stopColor="#F5A623" />
                      <stop offset="1" stopColor="#F26D6D" />
                    </linearGradient>
                    <linearGradient id="flame-inner" x1="48" y1="34" x2="48" y2="112" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor="#FFF6D8" />
                      <stop offset="1" stopColor="#FFC24B" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M48 6c6 16 26 26 26 52a26 26 0 0 1-52 0c0-8 3-14 7-20-13 6-24 18-24 40a44 44 0 0 0 88 0c0-38-26-50-45-72z"
                    fill="url(#flame-outer)"
                  />
                  <path
                    d="M50 44c3 9 13 15 13 30a15 15 0 0 1-30 0c0-8 5-14 9-19-1 10 8 14 8 6 0-9-4-14 0-17z"
                    fill="url(#flame-inner)"
                  />
                </svg>
              </motion.div>
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
