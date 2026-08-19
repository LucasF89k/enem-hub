"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

/**
 * Intro cinematográfica antes do formulário de onboarding — recriando o que
 * o vídeo de referência mostra: uma pedra escura e áspera que a câmera
 * aproxima devagar, rachando/se desfazendo em fragmentos que se afastam,
 * revelando um orbe liso e iridescente por baixo. Legendas curtas em fade
 * acompanham cada fase, e "toque para continuar" pulsa fixo no rodapé.
 *
 * Recriado do zero com CSS/SVG/Framer Motion — identidade própria, não o
 * asset 3D do Opal (que é protegido).
 */

const CAPTIONS = ["Olha mais de perto.", "Por trás do bruto...", "...tem foco puro."]

// Fragmentos que se soltam da pedra e flutuam pra fora enquanto ela racha
const SHARDS = [
  { x: -70, y: -40, rotate: -35, delay: 0.15 },
  { x: 65, y: -55, rotate: 40, delay: 0.3 },
  { x: -80, y: 35, rotate: 20, delay: 0.05 },
  { x: 75, y: 45, rotate: -25, delay: 0.4 },
  { x: -20, y: -75, rotate: 60, delay: 0.25 },
  { x: 25, y: 70, rotate: -50, delay: 0.1 },
]

export function OnboardingIntro({ onContinue }: { onContinue: () => void }) {
  const [captionIndex, setCaptionIndex] = useState(0)
  const [canSkip, setCanSkip] = useState(false)

  useEffect(() => {
    const timers = CAPTIONS.map((_, i) =>
      setTimeout(() => setCaptionIndex(i), i * 1500),
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
            "radial-gradient(ellipse 70% 50% at 50% 42%, color-mix(in srgb, var(--glow-mint) 12%, transparent), transparent 70%), radial-gradient(ellipse 90% 60% at 50% 100%, black, transparent 60%)",
        }}
      />

      <div className="relative z-10 flex h-44 w-44 items-center justify-center">
        <div className="opal-breathing-glow" aria-hidden />

        {/* Fragmentos da pedra — se soltam e somem enquanto ela racha */}
        {SHARDS.map((s, i) => (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0.8 }}
            animate={{ x: s.x, y: s.y, opacity: [0, 0.9, 0], rotate: s.rotate, scale: 0.5 }}
            transition={{ duration: 1.6, delay: s.delay, ease: "easeOut" }}
            className="absolute h-3 w-3 rounded-sm bg-[#2a2f35]"
            style={{ boxShadow: "0 0 6px 1px rgba(0,0,0,0.5)" }}
          />
        ))}

        {/* Pedra — áspera, escura, distante — dissolve enquanto a câmera aproxima */}
        <motion.div
          initial={{ scale: 0.55, opacity: 1, filter: "blur(0px)" }}
          animate={{ scale: 0.85, opacity: 0, filter: "blur(3px)" }}
          transition={{ duration: 1.7, delay: 0.2, ease: [0.4, 0, 0.6, 1] }}
          className="absolute h-32 w-32"
          style={{
            clipPath:
              "polygon(50% 2%, 68% 10%, 88% 22%, 98% 42%, 92% 65%, 78% 85%, 55% 98%, 32% 92%, 10% 76%, 2% 52%, 8% 28%, 26% 10%)",
            background: "linear-gradient(155deg, #3a3f45 0%, #1c2024 45%, #0a0c0e 100%)",
          }}
        />

        {/* Orbe liso e iridescente — revelado por baixo, cresce e assume o centro */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.8, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="absolute flex items-center justify-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="h-28 w-28 rounded-[42%_58%_63%_37%/41%_44%_56%_59%]"
            style={{
              background:
                "conic-gradient(from 120deg, var(--gauge-from), var(--gauge-to), var(--glow-purple), var(--gauge-from))",
              filter: "saturate(1.15)",
              boxShadow:
                "0 0 40px 6px color-mix(in srgb, var(--glow-mint) 35%, transparent), inset 0 0 24px color-mix(in srgb, black 45%, transparent)",
            }}
          />
        </motion.div>
      </div>

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
