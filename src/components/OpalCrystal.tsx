"use client"

import { motion } from "framer-motion"

/**
 * A pedra de opala, nas 4 fases da animação de abertura:
 *
 *   stage 0 — rocha bruta opaca
 *   stage 1 — os primeiros veios de fogo acendem nas fendas
 *   stage 2 — os cacos se abrem e o núcleo aparece
 *   stage 3 — a gema pura, exposta
 *
 * As artes são imagens reais (geradas para o projeto e recortadas por
 * `scripts/prepare-opal.js`, que remove o fundo preto por flood fill). Antes
 * isso era desenhado à mão em SVG e nunca ia passar de uma aproximação de
 * pedra; com as imagens a leitura é fotorrealista.
 *
 * A troca entre fases é um crossfade: as quatro ficam empilhadas e só a opacidade
 * muda, então não há "pulo" de forma nem recarregamento no meio da animação.
 */

const STAGES = [0, 1, 2, 3] as const

export function OpalCrystal({
  size = 150,
  stage = 3,
  slime = false,
  icon = false,
  slimeScale = 12,
}: {
  size?: number
  stage?: 0 | 1 | 2 | 3
  /** ondulação contínua de gelatina — usada na gema exposta, no hero da Home */
  slime?: boolean
  /** modo ícone: sem flutuação e sem halo. Em tamanho pequeno (avatar de chat,
   *  cabeçalho) o balanço lê como tremido e o halo desfocado vira um borrão. */
  icon?: boolean
  /** intensidade do deslocamento do slime (px). Em avatares pequenos precisa
   *  ser maior pra a ondulação ficar perceptível. */
  slimeScale?: number
}) {
  const slimeId = `opal-slime-${slimeScale}`

  // Movimento do wrapper: no modo normal flutua e gira devagar; no modo ícone
  // com slime, um wobble sutil e contínuo — garante vida visível mesmo em
  // avatar pequeno, onde só o filtro SVG mal se percebe.
  const wrapperAnim = icon
    ? slime
      ? { scale: [1, 1.06, 0.97, 1.04, 1], rotate: [0, 1.5, -1.5, 1, 0] }
      : undefined
    : { y: [-5, 5, -5], rotate: [-2, 2, -2] }
  const wrapperTransition = icon
    ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" as const }
    : { duration: 9, repeat: Infinity, ease: "easeInOut" as const }

  return (
    <motion.div
      animate={wrapperAnim}
      transition={wrapperAnim ? wrapperTransition : undefined}
      style={{ width: size, height: size }}
      className="relative"
    >
      {/* Halo — a luz que escapa da pedra, cresce conforme ela se abre */}
      {!icon && (
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: size * 1.15,
            height: size * 1.15,
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--glow-mint) 42%, transparent), transparent 70%)",
            filter: "blur(18px)",
          }}
          animate={{ opacity: [0.25 + stage * 0.16, 0.45 + stage * 0.16, 0.25 + stage * 0.16] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* As 4 fases empilhadas — só a opacidade muda entre elas */}
      {STAGES.map((s) => (
        <motion.img
          key={s}
          src={`/opal/stage-${s}.webp`}
          alt=""
          aria-hidden={s !== stage}
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-contain"
          style={
            slime && s === 3 ? { filter: `url(#${slimeId})`, willChange: "filter" } : undefined
          }
          initial={false}
          animate={{ opacity: s === stage ? 1 : 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      ))}

      {/* Filtro do "slime": a frequência do ruído oscila, deformando a gema como
          gelatina, em loop infinito. Animado por SMIL (<animate>) de propósito —
          o Framer Motion não anima atributos dentro de <filter> de forma
          confiável. Só é montado quando o efeito é pedido. */}
      {slime && (
        <svg
          width="1"
          height="1"
          className="pointer-events-none absolute"
          style={{ position: "absolute", overflow: "hidden" }}
          aria-hidden
        >
          <defs>
            <filter id={slimeId} x="-30%" y="-30%" width="160%" height="160%">
              <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="5" result="w">
                <animate
                  attributeName="baseFrequency"
                  dur="4s"
                  values="0.014;0.03;0.02;0.036;0.014"
                  repeatCount="indefinite"
                />
              </feTurbulence>
              <feDisplacementMap
                in="SourceGraphic"
                in2="w"
                scale={slimeScale}
                xChannelSelector="R"
                yChannelSelector="G"
              >
                <animate
                  attributeName="scale"
                  dur="4s"
                  values={`${slimeScale};${slimeScale * 1.8};${slimeScale};${slimeScale * 1.4};${slimeScale}`}
                  repeatCount="indefinite"
                />
              </feDisplacementMap>
            </filter>
          </defs>
        </svg>
      )}
    </motion.div>
  )
}
