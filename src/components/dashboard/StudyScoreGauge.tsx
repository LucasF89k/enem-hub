"use client"

import { useEffect, useState } from "react"
import { TrendingDown, TrendingUp } from "lucide-react"

const R = 90
const CIRC = 2 * Math.PI * R
const ARC_FRACTION = 0.75 // arco de 270° (não círculo completo, como no Opal)
const ARC_LEN = CIRC * ARC_FRACTION

/**
 * Gauge circular estilo Opal: arco de 270° que anima do 0 até o score,
 * com o número central em count-up sincronizado.
 */
export function StudyScoreGauge({
  score,
  label = "Score de Estudo",
  trend,
}: {
  score: number
  label?: string
  trend?: "up" | "down"
}) {
  const clamped = Math.min(100, Math.max(0, score))
  const [progress, setProgress] = useState(0)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const duration = 1400
    const start = performance.now()
    let raf: number
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
      setProgress(eased * (clamped / 100))
      setDisplay(Math.round(eased * clamped))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [clamped])

  // Comprimento visível do arco preenchido — NÃO usar strokeDashoffset aqui:
  // como o dash (270°) e o gap (90°) somam exatamente a circunferência, deslocar
  // o offset só GIRA o segmento já cheio ao redor do círculo, não o encolhe (era
  // o bug: em qualquer score o arco aparecia quase inteiro). O comprimento do
  // dash precisa ser proporcional ao progresso, ponto.
  const visibleLen = ARC_LEN * progress
  const TrendIcon = trend === "down" ? TrendingDown : TrendingUp

  return (
    <div className="relative flex h-[210px] w-[210px] items-center justify-center">
      <div className="opal-breathing-glow" aria-hidden />
      <svg viewBox="0 0 200 200" className="h-full w-full">
        <defs>
          {/* userSpaceOnUse alinhado à diagonal do arco (135°→45°) — acompanha a curva
              em vez do gradiente "borrado" que um linearGradient objectBoundingBox
              produz sobre um <circle> rotacionado. */}
          <linearGradient
            id="score-gauge-fill"
            gradientUnits="userSpaceOnUse"
            x1="36.4"
            y1="163.6"
            x2="163.6"
            y2="36.4"
          >
            <stop offset="0%" stopColor="var(--gauge-from)" />
            <stop offset="100%" stopColor="var(--gauge-to)" />
          </linearGradient>
        </defs>
        {/* trilha */}
        <circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke="var(--gauge-track)"
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${ARC_LEN} ${CIRC - ARC_LEN}`}
          transform="rotate(135 100 100)"
        />
        {/* progresso — dash = comprimento visível (cresce com o score), gap gigante
            pra nunca repetir o padrão dentro do círculo */}
        <circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke="url(#score-gauge-fill)"
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${visibleLen} ${CIRC}`}
          transform="rotate(135 100 100)"
          style={{ filter: "drop-shadow(0 0 4px color-mix(in srgb, var(--glow-mint) 60%, transparent))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
        <div className="flex items-center gap-1.5">
          <span className="text-[52px] font-semibold leading-none tracking-tight text-foreground">
            {display}
          </span>
          {clamped > 0 && (
            <TrendIcon
              className={trend === "down" ? "h-4 w-4 text-destructive" : "h-4 w-4 text-accent"}
            />
          )}
        </div>
        <p className="mt-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
