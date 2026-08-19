"use client"

import { motion } from "framer-motion"

/**
 * O orbe/opala central reutilizado no splash e no intro do onboarding.
 * Não é um "spinner de cor" — tenta simular jogo de cor de opala de
 * verdade: manchas de cor (mint/azul/roxo) sobrepostas em blend "screen"
 * sobre uma base de vidro escura, com brilho especular e sombra interna,
 * e um shimmer lento (hue-rotate) simulando a luz mudando de ângulo.
 * Recriado do zero com CSS — identidade própria, não o asset do Opal.
 */

export function OpalOrb({ size = 112, spin = true }: { size?: number; spin?: boolean }) {
  return (
    <motion.div
      animate={spin ? { rotate: 360 } : undefined}
      transition={spin ? { duration: 50, repeat: Infinity, ease: "linear" } : undefined}
      style={{ width: size, height: size }}
      className="relative"
    >
      <svg viewBox="0 0 132 122" className="h-full w-full overflow-visible">
        <defs>
          <clipPath id="opal-blob-clip" clipPathUnits="objectBoundingBox">
            <path
              transform="scale(0.00758, 0.0082)"
              d="M 76 4 C 96 2 118 14 126 34 C 134 54 130 78 116 96 C 102 114 78 124 56 118 C 34 112 14 96 6 74 C -2 52 4 26 22 12 C 40 -2 56 6 76 4 Z"
            />
          </clipPath>
          <radialGradient id="opal-base" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#22312f" />
            <stop offset="55%" stopColor="#0f1a1c" />
            <stop offset="100%" stopColor="#05080a" />
          </radialGradient>
          <radialGradient id="opal-mint" cx="28%" cy="72%" r="46%">
            <stop offset="0%" stopColor="var(--gauge-to)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--gauge-to)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="opal-blue" cx="78%" cy="38%" r="48%">
            <stop offset="0%" stopColor="var(--gauge-from)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--gauge-from)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="opal-purple" cx="55%" cy="86%" r="42%">
            <stop offset="0%" stopColor="var(--glow-purple)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--glow-purple)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="opal-shine" cx="30%" cy="20%" r="22%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g clipPath="url(#opal-blob-clip)">
          <rect width="132" height="122" fill="url(#opal-base)" />
          <motion.g
            animate={{ filter: ["hue-rotate(0deg)", "hue-rotate(18deg)", "hue-rotate(0deg)"] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            style={{ mixBlendMode: "screen" }}
          >
            <rect width="132" height="122" fill="url(#opal-mint)" />
            <rect width="132" height="122" fill="url(#opal-blue)" />
            <rect width="132" height="122" fill="url(#opal-purple)" />
          </motion.g>
          <rect width="132" height="122" fill="url(#opal-shine)" />
          {/* borda interna escura — dá profundidade de "vidro grosso" */}
          <path
            d="M 76 4 C 96 2 118 14 126 34 C 134 54 130 78 116 96 C 102 114 78 124 56 118 C 34 112 14 96 6 74 C -2 52 4 26 22 12 C 40 -2 56 6 76 4 Z"
            fill="none"
            stroke="black"
            strokeOpacity="0.35"
            strokeWidth="6"
          />
        </g>
      </svg>
    </motion.div>
  )
}
