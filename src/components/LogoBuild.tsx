"use client"

import { motion } from "framer-motion"

/**
 * Logo do Vion "se montando".
 *
 * A logo NÃO é redesenhada em SVG — recriá-la de olho sempre saía diferente
 * do arquivo real (foi o que deixou a seta com cara de "bandeirinha"). O que
 * aparece na tela é sempre o próprio `logo-app.png`; o que anima é a
 * revelação de cada peça, então o resultado é pixel-perfect por construção.
 *
 * Cada peça é uma <image> do MESMO png recortada por uma máscara ESTÁTICA, e
 * o que anima é o <g> que a envolve (opacity/translate). Isso é proposital:
 * dentro de um <mask> o Framer Motion só consegue animar `pathLength` —
 * `r`, `rx`, `ry`, `x`, `y` e `scale` não animam ali (viram transform CSS ou
 * são ignorados), e a máscara fica travada no valor inicial. O anel é a única
 * peça cuja máscara anima, justamente porque usa `pathLength`.
 *
 * Coordenadas medidas no PNG (279x263) varrendo os pixels:
 *   anel  → centro (140.5, 100), raio 72.5
 *   V     → todos os traços caem dentro de r≈50 do ponto (141, 105)
 *   ponto → (196, 44), raio ≈ 18
 *   texto → "vion" y 192..219 · tagline y≈240
 */

const PNG = "/logo-app.png"
const RING_C = { cx: 140.5, cy: 100 }
const DOT = { cx: 196, cy: 44, r: 21 }

export function LogoBuild() {
  return (
    <svg
      viewBox="0 0 279 263"
      className="w-[300px] max-w-[80vw] overflow-visible"
      role="img"
      aria-label="Vion"
    >
      <defs>
        {/* Anel — única máscara animada (pathLength funciona dentro de mask).
            O furo preto tira o ponto roxo daqui, pra ele entrar depois sozinho. */}
        <mask id="lg-ring" maskUnits="userSpaceOnUse" x="0" y="0" width="279" height="263">
          <motion.circle
            {...RING_C}
            r="72.5"
            fill="none"
            stroke="white"
            strokeWidth="26"
            pathLength={1}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            transform={`rotate(-90 ${RING_C.cx} ${RING_C.cy})`}
          />
          <circle {...DOT} fill="black" />
        </mask>

        {/* Máscaras estáticas das outras peças */}
        <mask id="lg-v" maskUnits="userSpaceOnUse" x="0" y="0" width="279" height="263">
          <circle cx="141" cy="105" r="54" fill="white" />
        </mask>
        <mask id="lg-dot" maskUnits="userSpaceOnUse" x="0" y="0" width="279" height="263">
          <circle {...DOT} fill="white" />
        </mask>
        <mask id="lg-text" maskUnits="userSpaceOnUse" x="0" y="0" width="279" height="263">
          <rect x="12" y="178" width="256" height="88" fill="white" />
        </mask>
      </defs>

      {/* 1. Anel se desenhando */}
      <image href={PNG} x="0" y="0" width="279" height="263" mask="url(#lg-ring)" />

      {/* 2. V + seta */}
      <motion.g
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <image href={PNG} x="0" y="0" width="279" height="263" mask="url(#lg-v)" />
      </motion.g>

      {/* 3. Ponto roxo */}
      <motion.g
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.15, type: "spring", stiffness: 340, damping: 15 }}
      >
        <image href={PNG} x="0" y="0" width="279" height="263" mask="url(#lg-dot)" />
      </motion.g>

      {/* 4. Wordmark + tagline */}
      <motion.g
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 1.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <image href={PNG} x="0" y="0" width="279" height="263" mask="url(#lg-text)" />
      </motion.g>
    </svg>
  )
}
