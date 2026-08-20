"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { OpalCrystal } from "@/components/OpalCrystal"

/**
 * Intro cinematográfica antes do formulário de onboarding — mesma progressão
 * do vídeo de referência, em 4 fases, cada uma com sua legenda:
 *
 *   0. rocha bruta opaca ....... "Uma opala só revela seu brilho..."
 *   1. primeiros veios ......... "Olhe mais de perto."
 *   2. cacos se afastando ...... "Mais perto..."
 *   3. opala pura .............. "Seu foco também é assim."
 *
 * Recriado do zero em SVG/Framer Motion — identidade própria, não o asset
 * 3D do Opal (que é protegido).
 */

const PHASES: { stage: 0 | 1 | 2 | 3; caption: string }[] = [
  { stage: 0, caption: "Uma opala só revela seu brilho para quem desacelera o bastante para olhar." },
  { stage: 1, caption: "Olhe mais de perto." },
  { stage: 2, caption: "Mais perto..." },
  { stage: 3, caption: "Seu foco também é assim." },
]

const PHASE_MS = 2200

export function OnboardingIntro({ onContinue }: { onContinue: () => void }) {
  const [i, setI] = useState(0)
  const [canSkip, setCanSkip] = useState(false)

  useEffect(() => {
    const timers = PHASES.map((_, idx) =>
      setTimeout(() => setI(idx), idx * PHASE_MS),
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
      {/* Vinheta de caverna */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 46%, color-mix(in srgb, var(--glow-mint) 10%, transparent), transparent 70%), radial-gradient(ellipse 90% 60% at 50% 100%, black, transparent 60%)",
        }}
      />

      {/* Legenda da fase — fica ACIMA da pedra, como no vídeo */}
      <div className="relative z-10 mb-10 flex h-16 max-w-[300px] items-end">
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5 }}
            className="text-lg font-medium leading-snug text-foreground"
          >
            {PHASES[i].caption}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* A pedra, avançando de fase */}
      <div className="relative z-10">
        <OpalCrystal size={190} stage={PHASES[i].stage} />
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
