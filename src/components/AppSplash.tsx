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
 * slideshow. As imagens por fase seguem no projeto como poster e fallback.
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
  const [failed, setFailed] = useState(false)
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

  // O play só dispara quando a pedra entra em cena. O elemento <video> em si
  // é montado desde o início (invisível) para baixar e decodificar durante os
  // ~2,3s da logo — antes ele só era criado ao trocar de fase e a tela ficava
  // 2s no preto esperando o carregamento.
  useEffect(() => {
    if (step !== "reveal") return
    videoRef.current?.play().catch(() => setFailed(true))
  }, [step])

  const showingStone = step === "reveal" || step === "pullback"
  const pulling = step === "pullback"

  return (
    <AnimatePresence>
      {step !== "hidden" && step !== "done" && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black"
        >
          {/* brilho de fundo só enquanto a logo está em cena — durante o vídeo
              ele quebraria a fusão com o preto */}
          <AnimatePresence>
            {step === "logo" && (
              <motion.div
                key="glow"
                exit={{ opacity: 0 }}
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse 70% 50% at 50% 45%, color-mix(in srgb, var(--glow-mint) 10%, transparent), transparent 70%)",
                }}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {step === "logo" && (
              <motion.div
                key="logo"
                exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.3 } }}
                className="absolute z-10"
              >
                <LogoBuild />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sempre montado (só invisível fora do reveal) para carregar cedo.
              No "pullback" a câmera recua: a gema encolhe e sobe até onde ela
              fica no hero da Home, e o overlay some por cima disso — a
              sensação é de continuidade, não de troca de tela. */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 0 }}
            animate={
              pulling
                ? { opacity: 1, scale: 0.42, y: -190 }
                : { opacity: showingStone ? 1 : 0, scale: 1, y: 0 }
            }
            transition={{ duration: pulling ? 1 : 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 aspect-square w-[min(96vw,460px)]"
          >
            <video
              ref={videoRef}
              src="/opal/reveal.mp4"
              // O poster é a rocha fechada: é o primeiro quadro do vídeo, então
              // a espera pelo carregamento não mostra nada fora de lugar.
              poster="/opal/stage-0.webp"
              muted
              playsInline
              preload="auto"
              onError={() => setFailed(true)}
              className="h-full w-full object-contain"
              // O fundo do vídeo NUNCA chega a preto puro: o pipeline YUV do
              // H.264 devolve ~RGB(20,25,25) por mais que se force o clamp
              // (testado com colorlevels, lutrgb, lutyuv e vinheta por multiply
              // — todos param nessa faixa). Como não dá para igualar a cor de
              // forma confiável entre dispositivos, o alpha resolve: a máscara
              // zera BEM antes da borda do elemento, então não existe aresta
              // possível, independente da cor que o vídeo renderize.
              style={{
                maskImage: "radial-gradient(circle, #000 52%, transparent 80%)",
                WebkitMaskImage: "radial-gradient(circle, #000 52%, transparent 80%)",
              }}
            />
            {/* Fallback SÓ em caso de falha real (codec indisponível, autoplay
                bloqueado) — antes ele entrava enquanto o vídeo carregava, e como
                era a gema pronta, a abertura mostrava a gema, apagava, e só
                então começava pela rocha: parecia um bug de renderização. */}
            {failed && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src="/opal/stage-3.webp"
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-contain"
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
