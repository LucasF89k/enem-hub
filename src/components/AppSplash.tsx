"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { LogoBuild } from "@/components/LogoBuild"

/**
 * Sequência de abertura do app — roda uma vez por sessão, automática, sem
 * precisar de toque:
 *
 *   logo se montando → a pedra racha, se abre e revela a gema → a câmera
 *   recua até a posição do hero → entra o app
 *
 * O reveal é um VÍDEO, não uma sequência de imagens: a fratura acontece na
 * geometria da própria pedra (cacos se soltando, partículas), coisa que
 * crossfade entre quadros estáticos nunca reproduz — dava aparência de
 * slideshow. As imagens por fase seguem no projeto e são o fallback quando
 * o vídeo não pode tocar.
 *
 * Fica por cima do conteúdo real (que já está montando/buscando dados por
 * baixo em paralelo) e desaparece sozinha — não bloqueia nada, só cobre.
 */

type Step = "hidden" | "logo" | "reveal" | "pullback" | "done"

const LOGO_MS = 2350 // a montagem da logo termina em ~1.9s; sobra respiro
const REVEAL_MS = 5000 // duração do vídeo
const PULLBACK_MS = 1000

export function AppSplash() {
  const [step, setStep] = useState<Step>("hidden")
  const [canPlay, setCanPlay] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

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
    const timers = [
      setTimeout(() => setStep("reveal"), LOGO_MS),
      setTimeout(() => setStep("pullback"), LOGO_MS + REVEAL_MS),
      setTimeout(() => {
        setStep("done")
        try {
          sessionStorage.setItem("splash-shown", "1")
        } catch {
          /* ignore */
        }
      }, LOGO_MS + REVEAL_MS + PULLBACK_MS),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const showingStone = step === "reveal" || step === "pullback"
  const pulling = step === "pullback"

  return (
    <AnimatePresence>
      {step !== "hidden" && step !== "done" && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          // Preto PURO, não var(--background). O vídeo do reveal não tem canal
          // alpha e seu fundo é #000; com qualquer outro tom aqui, a moldura
          // quadrada dele fica visível na tela. (mix-blend-mode no vídeo não
          // resolve: o transform que o Framer aplica no elemento pai cria um
          // stacking context e o blend não alcança o fundo da splash.)
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black"
        >
          {/* brilho de fundo só enquanto a logo está em cena — durante o vídeo
              ele quebraria a fusão com o preto */}
          {step === "logo" && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 70% 50% at 50% 45%, color-mix(in srgb, var(--glow-mint) 10%, transparent), transparent 70%)",
              }}
            />
          )}

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

            {showingStone && (
              // No "pullback" a câmera recua: a gema encolhe e sobe até onde ela
              // fica no hero da Home, e o overlay some por cima disso — a
              // sensação é de continuidade, não de troca de tela.
              <motion.div
                key="stone"
                initial={{ opacity: 0, scale: 0.9, y: 0 }}
                animate={
                  pulling ? { opacity: 1, scale: 0.42, y: -190 } : { opacity: 1, scale: 1, y: 0 }
                }
                transition={{ duration: pulling ? 1 : 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 h-[300px] w-[300px]"
              >
                <video
                  ref={videoRef}
                  src="/opal/reveal.mp4"
                  poster="/opal/stage-0.webp"
                  autoPlay
                  muted
                  playsInline
                  preload="auto"
                  onCanPlay={() => setCanPlay(true)}
                  className="h-full w-full object-contain"
                />
                {/* Fallback: se o vídeo não puder tocar (autoplay bloqueado, codec
                    indisponível), a gema estática entra no lugar para a abertura
                    não terminar num quadrado preto. */}
                {!canPlay && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src="/opal/stage-3.webp"
                    alt=""
                    aria-hidden
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
