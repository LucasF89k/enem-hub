"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
// LogoBuild.tsx (mask-reveal geométrico) deu lugar ao vídeo real do Kling —
// fica no repo sem uso, é o fallback se algum dia precisar de novo.

/**
 * Sequência de abertura do app — roda uma vez por sessão, automática, sem
 * precisar de toque:
 *
 *   logo se monta (vídeo) → a pedra racha, se abre e revela a gema (vídeo)
 *   → a câmera recua até a posição do hero → entra o app
 *
 * As duas fases são VÍDEO, não sequências de imagem: tanto a montagem da
 * logo (anel fechando, seta se formando) quanto a fratura da pedra (cacos
 * se soltando, partículas) são movimento de verdade — crossfade entre
 * quadros estáticos sempre dava aparência de slideshow. As imagens estáticas
 * seguem no projeto como poster/fallback de cada vídeo.
 *
 * Fica por cima do conteúdo real (que já está montando/buscando dados por
 * baixo em paralelo) e desaparece sozinha — não bloqueia nada, só cobre.
 */

type Step = "hidden" | "logo" | "reveal" | "pullback" | "done"

const LOGO_MS = 4200 // duração do vídeo da logo (4.04s) + respiro
const REVEAL_MS = 5000 // duração do vídeo da pedra
const PULLBACK_MS = 1000

export function AppSplash() {
  const [step, setStep] = useState<Step>("hidden")
  const [logoFailed, setLogoFailed] = useState(false)
  const [stoneFailed, setStoneFailed] = useState(false)
  const logoVideoRef = useRef<HTMLVideoElement | null>(null)
  const stoneVideoRef = useRef<HTMLVideoElement | null>(null)

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

  // autoPlay via atributo HTML é o que o Chrome/Safari mobile mais recusa
  // quando o <video> monta um instante depois da navegação (aqui ele só
  // entra no DOM quando step vira "logo", dentro de AnimatePresence) — sem
  // o play() imperativo, o navegador cai pro estado pausado e mostra o
  // controle de play nativo por cima. A Promise do play() rejeita em vários
  // casos que NÃO são falha real de decodificação (ex.: chamado antes do
  // readyState ideal, ou a política de autoplay já resolveu sozinha logo
  // em seguida) — tratar a rejeição como erro fatal foi o que fez o
  // fallback (logo estática) aparecer JUNTO com o vídeo já tocando. Quem
  // decide "falha real" é o onError do próprio elemento.
  useEffect(() => {
    if (step !== "logo") return
    const el = logoVideoRef.current
    if (!el) return
    // Forçar muted/playsInline no elemento DOM (não só via prop JSX) antes do
    // play(): é o padrão que evita a corrida de autoplay no Chrome/Safari
    // mobile — se `muted` não estiver setado no objeto no exato instante do
    // play(), a política de autoplay recusa e cai pro controle nativo (o
    // botão de play por cima do vídeo), mesmo com o atributo já presente
    // no JSX.
    el.muted = true
    el.playsInline = true
    el.play().catch(() => {
      /* rejeição de play() não é falha de decodificação — onError cobre isso */
    })
  }, [step])

  // O vídeo da pedra é pré-carregado durante a fase da logo (mesma lógica
  // de antes) — assim que a logo sai de cena ele já está pronto pra tocar,
  // sem os ~2s de tela preta que apareciam quando ele só começava a baixar
  // na hora da troca de fase.
  useEffect(() => {
    if (step !== "reveal") return
    stoneVideoRef.current?.play().catch(() => setStoneFailed(true))
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
          {/* Logo se montando — vídeo, não mais o mask-reveal geométrico do
              LogoBuild.tsx. object-cover: o app é 100% mobile e o vídeo já
              nasceu em 9:16, mas nenhum aparelho bate essa proporção exata
              (iPhone é mais alongado, ~19.5:9), então object-contain deixaria
              tarjas. cover evita tarja recortando só a margem preta de cima/
              baixo, que já sobra generosa em volta da logo. */}
          <AnimatePresence>
            {step === "logo" && (
              <motion.div
                key="logo"
                exit={{ opacity: 0, transition: { duration: 0.35 } }}
                className="absolute inset-0 z-10"
              >
                <video
                  ref={logoVideoRef}
                  src="/opal/logo-reveal.mp4"
                  autoPlay
                  muted
                  playsInline
                  preload="auto"
                  onError={() => setLogoFailed(true)}
                  className="h-full w-full object-cover"
                />
                {logoFailed && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="/logo-app.png"
                    alt="Vion"
                    className="absolute inset-0 m-auto h-40 w-40 object-contain"
                  />
                )}
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
              ref={stoneVideoRef}
              src="/opal/reveal.mp4"
              // O poster é a rocha fechada: é o primeiro quadro do vídeo, então
              // a espera pelo carregamento não mostra nada fora de lugar.
              poster="/opal/stage-0.webp"
              muted
              playsInline
              preload="auto"
              onError={() => setStoneFailed(true)}
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
            {stoneFailed && (
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
