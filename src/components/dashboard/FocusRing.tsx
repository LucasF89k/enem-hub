"use client"

import { useEffect, useState } from "react"

const R = 100
const STROKE = 10
const CIRC = 2 * Math.PI * R // ~628

/** Anel de foco: progresso do tempo de estudo do dia. Anima na montagem. */
export function FocusRing({
  minutesToday,
  dailyGoalMinutes,
}: {
  minutesToday: number
  dailyGoalMinutes: number
}) {
  const pct = Math.min(1, Math.max(0, dailyGoalMinutes > 0 ? minutesToday / dailyGoalMinutes : 0))
  const targetOffset = CIRC - pct * CIRC

  // Começa "vazio" (offset = circunferência) e anima até o alvo.
  const [offset, setOffset] = useState(CIRC)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setOffset(targetOffset))
    return () => cancelAnimationFrame(raf)
  }, [targetOffset])

  return (
    <div className="relative w-[230px] h-[230px] md:w-[260px] md:h-[260px]">
      <svg viewBox="0 0 230 230" className="w-full h-full -rotate-90">
        <circle cx="115" cy="115" r={R} fill="none" className="stroke-border" strokeWidth={STROKE} />
        <circle
          cx="115"
          cy="115"
          r={R}
          fill="none"
          className="stroke-primary"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 800ms ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[40px] font-light leading-none text-foreground">
          {minutesToday}
          <span className="text-[17px] font-light text-muted-foreground">/{dailyGoalMinutes} min</span>
        </p>
        <p className="mt-1.5 text-xs tracking-wide text-muted-foreground">estudados hoje</p>
      </div>
    </div>
  )
}
