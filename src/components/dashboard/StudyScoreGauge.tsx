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
    const raf = requestAnimationFrame(() => setProgress(clamped / 100))
    return () => cancelAnimationFrame(raf)
  }, [clamped])

  useEffect(() => {
    const duration = 1400
    const start = performance.now()
    let raf: number
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
      setDisplay(Math.round(eased * clamped))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [clamped])

  const offset = ARC_LEN * (1 - progress)
  const TrendIcon = trend === "down" ? TrendingDown : TrendingUp

  return (
    <div className="relative flex h-[210px] w-[210px] items-center justify-center">
      <svg viewBox="0 0 200 200" className="h-full w-full">
        <defs>
          <linearGradient id="score-gauge-fill" x1="0%" y1="0%" x2="100%" y2="0%">
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
        {/* progresso */}
        <circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke="url(#score-gauge-fill)"
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${ARC_LEN} ${CIRC - ARC_LEN}`}
          strokeDashoffset={offset}
          transform="rotate(135 100 100)"
          style={{
            transition: "stroke-dashoffset 1400ms cubic-bezier(0.16, 1, 0.3, 1)",
            filter: "drop-shadow(0 0 6px var(--glow-mint))",
          }}
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
