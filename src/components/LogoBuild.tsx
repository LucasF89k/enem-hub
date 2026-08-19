"use client"

import { motion } from "framer-motion"

/**
 * Logo do Vion "se montando" — recriada em SVG (o arquivo real é um PNG
 * plano, não dá pra animar peças de dentro dele) pra poder animar cada
 * parte em sequência: anel se desenhando → seta/V subindo → ponto
 * aparecendo → "vion" deslizando por baixo.
 */
export function LogoBuild() {
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 160" className="h-28 w-28 overflow-visible">
        <defs>
          <linearGradient id="logo-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--glow-purple)" />
            <stop offset="100%" stopColor="var(--gauge-from)" />
          </linearGradient>
        </defs>

        {/* Anel se desenhando */}
        <motion.circle
          cx="100"
          cy="80"
          r="52"
          fill="none"
          stroke="url(#logo-ring-grad)"
          strokeWidth="6"
          strokeLinecap="round"
          pathLength={1}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          transform="rotate(-90 100 80)"
        />

        {/* Seta / "V" subindo — desenhada por stroke (traço) */}
        <motion.path
          d="M 72 62 L 100 100 L 132 48"
          fill="none"
          stroke="white"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.55, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.path
          d="M 116 46 L 132 48 L 128 63"
          fill="none"
          stroke="white"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.85, ease: "easeOut" }}
        />

        {/* Ponto no fim do anel */}
        <motion.circle
          cx="152"
          cy="30"
          r="7"
          fill="var(--glow-purple)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, delay: 1.05, type: "spring", stiffness: 300, damping: 14 }}
          style={{ transformOrigin: "152px 30px" }}
        />
      </svg>

      {/* Wordmark "vion" — desliza por baixo do ícone */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.25, ease: [0.16, 1, 0.3, 1] }}
        className="-mt-2 text-2xl font-light tracking-[0.35em] text-foreground"
      >
        vion
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.5 }}
        className="mt-1 text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground"
      >
        Sua visão. Seu futuro.
      </motion.p>
    </div>
  )
}
