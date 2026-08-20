"use client"

import { motion } from "framer-motion"

/**
 * A pedra do vídeo de referência, nas 4 fases da animação:
 *
 *   stage 0 — rocha bruta totalmente opaca, sem nenhuma cor
 *   stage 1 — os primeiros veios de opala acendem pelas frestas
 *   stage 2 — os cacos começam a se afastar, muito mais fogo aparece
 *   stage 3 — a rocha some por completo e sobra a opala lisa e iridescente
 *
 * A opala é uma única forma orgânica desenhada POR BAIXO; os cacos de rocha
 * cobrem ela por cima. Cada caco é encolhido em torno do próprio centro
 * (scale < 1), o que abre as frestas por onde a luz vaza — e depois cada um
 * foge na sua própria direção, revelando a gema inteira.
 *
 * Recriado do zero em SVG — identidade própria, não o asset 3D do Opal.
 */

// Contorno orgânico e irregular — opala bruta não é um oval perfeito
const OPAL =
  "M 104 30 C 141 31 172 60 176 104 C 180 149 161 190 122 208 C 84 224 45 203 31 165 C 18 129 26 82 56 52 C 70 38 88 30 104 30 Z"

/**
 * "Células" da opala — o fogo de uma opala real não é um degradê contínuo:
 * são placas de cor com bordas definidas (efeito play-of-color). Sem isso a
 * gema final saía com cara de bolha borrada.
 */
const CELLS: { p: string; c: string }[] = [
  { p: "58,52 96,40 110,70 82,88 60,76", c: "#00E9A6" },
  { p: "96,40 136,56 144,86 110,70", c: "#12C8FF" },
  { p: "144,86 168,102 154,126 132,112 110,70", c: "#3E7BFF" },
  { p: "34,86 60,76 82,88 74,116 42,120", c: "#FF74D4" },
  { p: "82,88 110,70 132,112 100,124 74,116", c: "#CBFF4A" },
  { p: "132,112 154,126 148,152 118,146 100,124", c: "#E9FFFB" },
  { p: "42,120 74,116 84,150 52,158", c: "#12C8FF" },
  { p: "74,116 100,124 118,146 112,168 84,150", c: "#00E9A6" },
  { p: "148,152 168,138 172,164 146,180 118,146", c: "#9B6BFF" },
  { p: "52,158 84,150 92,186 60,180", c: "#67FFE0" },
  { p: "84,150 112,168 122,192 92,186", c: "#FF74D4" },
  { p: "112,168 146,180 130,202 122,192", c: "#00E9A6" },
  { p: "28,96 34,86 42,120 30,126", c: "#3E7BFF" },
  { p: "168,102 176,120 168,138 154,126", c: "#9B6BFF" },
  { p: "60,180 92,186 88,204 68,196", c: "#CBFF4A" },
  { p: "92,186 122,192 118,206 96,208", c: "#12C8FF" },
]

/** d = caco · c = centro (para encolher no lugar) · f = direção de fuga */
const ROCKS: { d: string; cx: number; cy: number; fx: number; fy: number; fill: string }[] = [
  { d: "M 96 26 L 138 44 L 128 86 L 92 80 L 74 50 Z", cx: 106, cy: 57, fx: 8, fy: -90, fill: "url(#rk-a)" },
  { d: "M 74 50 L 92 80 L 62 104 L 34 84 L 44 52 Z", cx: 61, cy: 74, fx: -58, fy: -69, fill: "url(#rk-b)" },
  { d: "M 138 44 L 170 74 L 160 108 L 128 86 Z", cx: 149, cy: 78, fx: 68, fy: -59, fill: "url(#rk-c)" },
  { d: "M 34 84 L 62 104 L 58 148 L 28 136 Z", cx: 45, cy: 118, fx: -90, fy: -3, fill: "url(#rk-c)" },
  { d: "M 92 80 L 128 86 L 124 132 L 88 138 L 62 104 Z", cx: 99, cy: 108, fx: 0, fy: -72, fill: "url(#rk-b)" },
  { d: "M 160 108 L 172 140 L 150 166 L 124 132 L 128 86 Z", cx: 147, cy: 126, fx: 89, fy: 11, fill: "url(#rk-a)" },
  { d: "M 28 136 L 58 148 L 70 190 L 44 178 Z", cx: 50, cy: 163, fx: -68, fy: 59, fill: "url(#rk-b)" },
  { d: "M 88 138 L 124 132 L 130 178 L 100 206 L 70 190 L 58 148 Z", cx: 95, cy: 166, fx: -10, fy: 89, fill: "url(#rk-c)" },
  { d: "M 150 166 L 160 196 L 130 178 L 124 132 Z", cx: 141, cy: 168, fx: 58, fy: 68, fill: "url(#rk-a)" },
]

// Por fase: o quanto os cacos encolhem (abrindo frestas), o quanto fogem,
// se ainda são visíveis, e o quanto a opala brilha por baixo.
const STAGE = [
  { shrink: 1.0, flee: 0, rockOpacity: 1, opal: 0, glow: 0 },
  { shrink: 0.9, flee: 0.04, rockOpacity: 1, opal: 0.75, glow: 0.35 },
  { shrink: 0.82, flee: 0.42, rockOpacity: 0.95, opal: 0.95, glow: 0.7 },
  { shrink: 0.8, flee: 1.7, rockOpacity: 0, opal: 1, glow: 1 },
]

export function OpalCrystal({ size = 150, stage = 3 }: { size?: number; stage?: 0 | 1 | 2 | 3 }) {
  const s = STAGE[stage]

  return (
    <motion.div
      animate={{ y: [-5, 5, -5], rotate: [-2, 2, -2] }}
      transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      style={{ width: size, height: (size * 240) / 200 }}
      className="relative"
    >
      <svg viewBox="0 0 200 240" className="h-full w-full overflow-visible">
        <defs>
          {/* Fogo da opala — manchas de cor somadas em "screen" SOBRE BASE
              ESCURA. (Com base clara o screen satura tudo em branco e a pedra
              saía lisa e sem cor nenhuma — era esse o bug.) Por isso as cores
              aqui são bem saturadas: é a soma delas que forma o brilho. */}
          <radialGradient id="fire-1" cx="32%" cy="34%" r="40%">
            <stop offset="0%" stopColor="#00E9A6" />
            <stop offset="100%" stopColor="#00E9A6" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="fire-2" cx="66%" cy="30%" r="38%">
            <stop offset="0%" stopColor="#12C8FF" />
            <stop offset="100%" stopColor="#12C8FF" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="fire-3" cx="26%" cy="70%" r="38%">
            <stop offset="0%" stopColor="#3E7BFF" />
            <stop offset="100%" stopColor="#3E7BFF" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="fire-4" cx="74%" cy="72%" r="36%">
            <stop offset="0%" stopColor="#9B6BFF" />
            <stop offset="100%" stopColor="#9B6BFF" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="fire-5" cx="52%" cy="52%" r="26%">
            <stop offset="0%" stopColor="#CBFF4A" />
            <stop offset="100%" stopColor="#CBFF4A" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="fire-6" cx="46%" cy="82%" r="26%">
            <stop offset="0%" stopColor="#FF74D4" />
            <stop offset="100%" stopColor="#FF74D4" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="fire-7" cx="84%" cy="48%" r="24%">
            <stop offset="0%" stopColor="#67FFE0" />
            <stop offset="100%" stopColor="#67FFE0" stopOpacity="0" />
          </radialGradient>
          {/* Realce especular — o "vidro" molhado por cima */}
          <radialGradient id="fire-hi" cx="36%" cy="26%" r="22%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>

          {/* Tons de rocha — cinza frio, quase preto nas quinas */}
          <linearGradient id="rk-a" x1="18%" y1="0%" x2="82%" y2="100%">
            <stop offset="0%" stopColor="#5C646D" />
            <stop offset="48%" stopColor="#2C323A" />
            <stop offset="100%" stopColor="#0C0F12" />
          </linearGradient>
          <linearGradient id="rk-b" x1="82%" y1="8%" x2="12%" y2="92%">
            <stop offset="0%" stopColor="#4A525A" />
            <stop offset="52%" stopColor="#222830" />
            <stop offset="100%" stopColor="#080B0D" />
          </linearGradient>
          <linearGradient id="rk-c" x1="0%" y1="10%" x2="100%" y2="90%">
            <stop offset="0%" stopColor="#3D444C" />
            <stop offset="60%" stopColor="#1A1F25" />
            <stop offset="100%" stopColor="#0A0D10" />
          </linearGradient>

          <clipPath id="opal-clip">
            <path d={OPAL} />
          </clipPath>
        </defs>

        {/* Halo — a luz que escapa da pedra, cresce a cada fase */}
        <motion.ellipse
          cx="100"
          cy="120"
          rx="82"
          ry="94"
          fill="var(--glow-mint)"
          animate={{ opacity: s.glow * 0.34 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          style={{ filter: "blur(20px)" }}
        />

        {/* A opala, por baixo dos cacos */}
        <motion.g
          clipPath="url(#opal-clip)"
          animate={{ opacity: s.opal }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        >
          {/* base ESCURA — é sobre ela que o "screen" soma as cores */}
          <rect x="0" y="0" width="200" height="240" fill="#0B1620" />

          <motion.g
            animate={{ filter: ["hue-rotate(0deg)", "hue-rotate(26deg)", "hue-rotate(0deg)"] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* placas de cor — dão o padrão; sem elas vira um degradê borrado */}
            <g style={{ mixBlendMode: "screen" }}>
              {CELLS.map((c, i) => (
                <polygon
                  key={i}
                  points={c.p}
                  fill={c.c}
                  fillOpacity="0.8"
                  stroke="#0B1620"
                  strokeOpacity="0.28"
                  strokeWidth="0.8"
                />
              ))}
            </g>
            {/* brumas por cima, unificando as placas num fogo só */}
            <g style={{ mixBlendMode: "screen", opacity: 0.7 }}>
              {["fire-1", "fire-2", "fire-3", "fire-4", "fire-5", "fire-6", "fire-7"].map((id) => (
                <rect key={id} x="0" y="0" width="200" height="240" fill={`url(#${id})`} />
              ))}
            </g>
          </motion.g>

          <rect x="0" y="0" width="200" height="240" fill="url(#fire-hi)" />
        </motion.g>

        {/* Os cacos de rocha por cima */}
        <g style={{ filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.65))" }}>
          {ROCKS.map((r, i) => (
            <motion.g
              key={i}
              animate={{
                x: r.fx * s.flee,
                y: r.fy * s.flee,
                opacity: s.rockOpacity,
                rotate: s.flee * (i % 2 === 0 ? 22 : -19),
              }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: i * 0.03 }}
              style={{ transformOrigin: `${r.cx}px ${r.cy}px` }}
            >
              {/* encolhe em torno do próprio centro — é isso que abre as frestas */}
              <motion.path
                d={r.d}
                fill={r.fill}
                stroke="#04060A"
                strokeOpacity="0.75"
                strokeWidth="1"
                animate={{ scale: s.shrink }}
                transition={{ duration: 1.1, ease: "easeOut" }}
                style={{ transformOrigin: `${r.cx}px ${r.cy}px` }}
              />
            </motion.g>
          ))}
        </g>
      </svg>
    </motion.div>
  )
}
