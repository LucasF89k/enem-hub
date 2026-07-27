/**
 * Marca do Vion — um "V" cujo braço direito sobe e vira uma seta pra cima
 * (foco · visão · conquista). Braço esquerdo em gradiente roxo, direito branco,
 * com um ponto roxo no topo.
 */
export function VionLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      role="img"
      aria-label="Vion"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="vion-grad" x1="20" y1="80" x2="60" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5b21b6" />
          <stop offset="55%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>

      {/* Braço esquerdo (roxo) — desce até a base do V */}
      <path
        d="M20 22 L50 82"
        stroke="url(#vion-grad)"
        strokeWidth="15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Braço direito (branco) — sobe da base até a ponta da seta */}
      <path
        d="M50 82 L79 18"
        stroke="#ffffff"
        strokeWidth="15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Cabeça da seta na ponta superior direita */}
      <path
        d="M62 22 L79 15 L84 33"
        stroke="#ffffff"
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Ponto roxo */}
      <circle cx="90" cy="14" r="6.5" fill="url(#vion-grad)" />
    </svg>
  )
}
