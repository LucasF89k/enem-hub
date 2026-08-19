"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

/**
 * Intro cinematográfica antes do formulário de onboarding — mesma sensação do
 * Opal: objeto central que se aproxima devagar (zoom + glow), textos curtos
 * que se revezam em fade, e "toque para continuar" pulsando no rodapé.
 * O objeto é um orbe/cristal recriado com CSS/SVG, com identidade própria
 * (não é o asset do Opal, que é protegido — só a linguagem visual).
 */

const CAPTIONS = ["Mais perto.", "Cada foco importa.", "Vamos começar."]

export function OnboardingIntro({ onContinue }: { onContinue: () => void }) {
  const [captionIndex, setCaptionIndex] = useState(0)
  const [canSkip, setCanSkip] = useState(false)

  useEffect(() => {
    const timers = CAPTIONS.map((_, i) =>
      setTimeout(() => setCaptionIndex(i), i * 1600),
    )
    const skipTimer = setTimeout(() => setCanSkip(true), 900)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(skipTimer)
    }
  }, [])

  return (
    <motion.button
      type="button"
      onClick={() => canSkip && onContinue()}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background px-6 text-center"
      aria-label="Toque para continuar"
    >
      {/* Vinheta de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 42%, color-mix(in srgb, var(--glow-mint) 14%, transparent), transparent 70%), radial-gradient(ellipse 90% 60% at 50% 100%, black, transparent 60%)",
        }}
      />

      {/* Orbe central: zoom + glow respirando, morphing de "pedra" pra "opala" */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex h-40 w-40 items-center justify-center"
      >
        <div className="opal-breathing-glow" aria-hidden />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="h-28 w-28 rounded-[42%_58%_63%_37%/41%_44%_56%_59%]"
          style={{
            background:
              "conic-gradient(from 120deg, var(--gauge-from), var(--gauge-to), var(--glow-purple), var(--gauge-from))",
            filter: "blur(0.3px) saturate(1.15)",
            boxShadow:
              "0 0 40px 6px color-mix(in srgb, var(--glow-mint) 35%, transparent), inset 0 0 24px color-mix(in srgb, black 45%, transparent)",
          }}
        />
      </motion.div>

      {/* Legenda em cascata */}
      <div className="relative z-10 mt-10 h-7">
        <AnimatePresence mode="wait">
          <motion.p
            key={captionIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5 }}
            className="text-lg font-light text-foreground"
          >
            {CAPTIONS[captionIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Toque para continuar */}
      <motion.span
        initial={{ opacity: 0.35 }}
        animate={{ opacity: canSkip ? [0.35, 1, 0.35] : 0.35 }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-14 z-10 text-[11px] font-medium uppercase tracking-[0.2em] text-accent"
      >
        Toque para continuar
      </motion.span>
    </motion.button>
  )
}
