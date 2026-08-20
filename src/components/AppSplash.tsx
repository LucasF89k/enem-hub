"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { OpalCrystal } from "@/components/OpalCrystal"
import { LogoBuild } from "@/components/LogoBuild"

/**
 * Sequência de abertura do app — roda uma vez por sessão, automática, sem
 * precisar de toque. Segue a mesma progressão do vídeo de referência:
 *
 *   logo se montando → rocha bruta opaca → primeiros veios acendem →
 *   os cacos se afastam → a opala pura fica exposta → entra o app
 *
 * Fica por cima do conteúdo real (que já está montando/buscando dados por
 * baixo em paralelo) e desaparece sozinha — não bloqueia nada, só cobre.
 */

type Step = "hidden" | "logo" | "s0" | "s1" | "s2" | "s3" | "done"

const CRYSTAL_STAGE: Record<string, 0 | 1 | 2 | 3> = { s0: 0, s1: 1, s2: 2, s3: 3 }

// [passo, quando dispara em ms]
// A montagem da logo termina em ~1.9s (o wordmark entra com delay 1.35s +
// 0.55s de duração), então a primeira fase da pedra só pode começar depois
// disso — antes eu cortava em 1.8s e o wordmark nem chegava a aparecer.
const TIMELINE: [Step, number][] = [
  ["s0", 2350],
  ["s1", 3050],
  ["s2", 3750],
  ["s3", 4450],
  ["done", 5750],
]

export function AppSplash() {
  const [step, setStep] = useState<Step>("hidden")

  useEffect(() => {
    let already = true
    try {
      already = sessionStorage.getItem("splash-shown") === "1"
    } catch {
      /* sessionStorage indisponível (SSR/privado) — mostra mesmo assim */
    }
    if (already) return

    // Timeline imperativa de fases, disparada uma vez ao montar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStep("logo")
    const timers = TIMELINE.map(([s, at]) =>
      setTimeout(() => {
        setStep(s)
        if (s === "done") {
          try {
            sessionStorage.setItem("splash-shown", "1")
          } catch {
            /* ignore */
          }
        }
      }, at),
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  const showingCrystal = step === "s0" || step === "s1" || step === "s2" || step === "s3"

  return (
    <AnimatePresence>
      {step !== "hidden" && step !== "done" && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-background"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 45%, color-mix(in srgb, var(--glow-mint) 10%, transparent), transparent 70%)",
            }}
          />

          <AnimatePresence mode="wait">
            {step === "logo" && (
              <motion.div
                key="logo"
                exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.3 } }}
                className="relative z-10"
              >
                <LogoBuild />
              </motion.div>
            )}

            {showingCrystal && (
              <motion.div
                key="crystal"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10"
              >
                <OpalCrystal size={200} stage={CRYSTAL_STAGE[step]} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
