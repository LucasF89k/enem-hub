"use client"

import { motion } from "framer-motion"

/**
 * A pedra de opala, nas 4 fases da animação de abertura:
 *
 *   stage 0: rocha bruta opaca
 *   stage 1: os primeiros veios de fogo acendem nas fendas
 *   stage 2: os cacos se abrem e o núcleo aparece
 *   stage 3: a gema pura, exposta
 *
 * As artes são imagens reais (geradas para o projeto e recortadas por
 * `scripts/prepare-opal.js`, que remove o fundo preto por flood fill).
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
}: {
  size?: number
  stage?: 0 | 1 | 2 | 3
  /** ondulação contínua e suave, tipo "gelatina viva" */
  slime?: boolean
  /** modo ícone: sem halo (em avatar pequeno o blur vira borrão). */
  icon?: boolean
  /** @deprecated não usado, mantido pra não quebrar chamadas antigas */
  slimeScale?: number
}) {
  // Movimento do wrapper. Tudo em transform (composto na GPU), curvas longas e
  // senoidais: nada de recalcular filtro por frame, então não trava.
  //   - modo normal (hero): flutua e gira devagar
  //   - modo ícone + slime (bolha do chat): respiração + leve deriva orgânica,
  //     bem lenta e fluida
  //   - modo ícone sem slime (cabeçalho): parado
  const wrapperAnim = !icon
    ? { y: [-5, 5, -5], rotate: [-2, 2, -2] }
    : slime
      ? {
          scale: [1, 1.045, 0.985, 1.03, 1],
          y: [0, -1.5, 0.8, -1, 0],
          rotate: [0, 1, -0.6, 0.4, 0],
        }
      : undefined

  const wrapperTransition = !icon
    ? { duration: 9, repeat: Infinity, ease: "easeInOut" as const }
    : { duration: 6, repeat: Infinity, ease: "easeInOut" as const }

  // Deformação "gelatina": um filtro SVG ESTÁTICO (sem <animate>, custo só uma
  // vez). Combinado com o movimento suave do wrapper, dá leitura de algo mole
  // e vivo sem o engasgo de animar feTurbulence.
  const useJelly = slime

  return (
    <motion.div
      animate={wrapperAnim}
      transition={wrapperAnim ? wrapperTransition : undefined}
      style={{ width: size, height: size, willChange: "transform" }}
      className="relative"
    >
      {/* Halo: a luz que escapa da pedra */}
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

      {/* As 4 fases empilhadas: só a opacidade muda entre elas */}
      {STAGES.map((s) => (
        <motion.img
          key={s}
          src={`/opal/stage-${s}.webp`}
          alt=""
          aria-hidden={s !== stage}
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-contain"
          style={useJelly && s === 3 ? { filter: "url(#opal-jelly)" } : undefined}
          initial={false}
          animate={{ opacity: s === stage ? 1 : 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      ))}

      {/* Filtro estático: deformação fixa, calculada uma vez, sem <animate>.
          A "vida" vem do transform do wrapper, que nunca trava. */}
      {useJelly && (
        <svg width="0" height="0" className="pointer-events-none absolute" aria-hidden>
          <defs>
            <filter id="opal-jelly" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.016"
                numOctaves="2"
                seed="7"
                result="n"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="n"
                scale="6"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      )}
    </motion.div>
  )
}
