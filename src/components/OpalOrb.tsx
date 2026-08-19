"use client"

import { motion } from "framer-motion"

/**
 * O cristal facetado central, reutilizado no splash e no intro do
 * onboarding. Baseado na análise quadro a quadro do vídeo de referência:
 * cristal de corte irregular tipo "pedra bruta lapidada" — um ápice no
 * topo, uma "cintura" irregular de facetas no meio, e uma base mais larga
 * embaixo (não é um leque saindo de um ponto só, senão lê como gráfico de
 * pizza) — cada faceta plana reflete uma cor diferente (mint/azul/roxo).
 *
 * Recriado do zero em SVG (facetas triangulares, sem foto/asset) —
 * identidade própria, não o modelo 3D do Opal (que é protegido).
 */

const TOP: [number, number] = [58, 6]
const BOTTOM: [number, number] = [50, 122]

// "Cintura" irregular — pontos de raio variável pra não ficar um círculo
// perfeito (lê como pedra lapidada à mão, não como sólido geométrico).
const RIDGE: [number, number][] = [
  [92, 38],
  [100, 62],
  [80, 90],
  [56, 108],
  [24, 100],
  [4, 72],
  [10, 42],
  [30, 18],
]

const CROWN_COLORS = ["#EAF6F2", "#8FF0D6", "#79D3EE", "var(--gauge-from)", "#B9A6E8", "var(--glow-purple)", "#63B8D8", "#3FD8A8"]
const PAVILION_COLORS = ["#4A6FA8", "var(--glow-purple)", "#2C4A5E", "#3FD8A8", "#5AA9E6", "#8FF0D6", "var(--gauge-from)", "#79D3EE"]

function ring(a: [number, number], b: [number, number]) {
  return `${a[0]},${a[1]} ${b[0]},${b[1]}`
}

function facets() {
  const tris: { d: string; fill: string }[] = []
  const n = RIDGE.length
  for (let i = 0; i < n; i++) {
    const a = RIDGE[i]
    const b = RIDGE[(i + 1) % n]
    // Coroa: topo → dois pontos vizinhos da cintura
    tris.push({ d: `M ${TOP[0]} ${TOP[1]} L ${ring(a, b)} Z`, fill: CROWN_COLORS[i % CROWN_COLORS.length] })
    // Base: fundo → dois pontos vizinhos da cintura
    tris.push({ d: `M ${BOTTOM[0]} ${BOTTOM[1]} L ${ring(a, b)} Z`, fill: PAVILION_COLORS[i % PAVILION_COLORS.length] })
  }
  return tris
}

const OUTLINE_PATH =
  `M ${TOP[0]} ${TOP[1]} ` +
  RIDGE.map((p) => `L ${p[0]} ${p[1]}`).join(" ") +
  ` L ${TOP[0]} ${TOP[1]} M ${BOTTOM[0]} ${BOTTOM[1]} ` +
  RIDGE.slice().reverse().map((p) => `L ${p[0]} ${p[1]}`).join(" ") +
  ` L ${BOTTOM[0]} ${BOTTOM[1]}`

export function OpalOrb({ size = 112, pedestal = false }: { size?: number; pedestal?: boolean }) {
  return (
    <motion.div
      animate={{ rotate: [-2, 2, -2] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      style={{ width: size, height: (size * 130) / 112 }}
      className="relative"
    >
      <svg viewBox="0 0 112 130" className="h-full w-full overflow-visible">
        {pedestal && <ellipse cx="54" cy="126" rx="26" ry="6" fill="black" fillOpacity="0.55" />}
        <g style={{ filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.5))" }}>
          {facets().map((f, i) => (
            <path key={i} d={f.d} fill={f.fill} stroke="black" strokeOpacity="0.28" strokeWidth="0.6" />
          ))}
          {/* shimmer sutil por cima — respira o brilho sem trocar a cor da faceta */}
          <motion.path
            d={OUTLINE_PATH}
            fill="white"
            animate={{ opacity: [0.03, 0.12, 0.03] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </g>
      </svg>
    </motion.div>
  )
}
