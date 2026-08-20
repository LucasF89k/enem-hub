"use client"

import { useEffect, useState } from "react"
import { OpalCrystal } from "@/components/OpalCrystal"

const R = 90
const CIRC = 2 * Math.PI * R
const ARC_FRACTION = 0.75 // arco de 270° (não círculo completo, como no Opal)
const ARC_LEN = CIRC * ARC_FRACTION
const START_DEG = 135 // início do arco: embaixo à esquerda

/**
 * Hero da Home: a opala ao centro com o anel de progresso em volta.
 * O anel é a meta de estudo do dia (minutos / meta), animando do 0 até o
 * valor junto com o count-up do número, e uma bolinha marca a ponta do
 * progresso. Não é um "score" abstrato — é o progresso da meta de hoje.
 */
export function StudyScoreGauge({
  minutes,
  goalMinutes,
  label = "Meta de estudo hoje",
}: {
  minutes: number
  goalMinutes: number
  label?: string
}) {
  const pct = goalMinutes > 0 ? Math.min(100, (minutes / goalMinutes) * 100) : 0
  const [progress, setProgress] = useState(0)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const duration = 1400
    const start = performance.now()
    let raf: number
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
      setProgress(eased * (pct / 100))
      setDisplay(Math.round(eased * minutes))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [pct, minutes])

  // Comprimento visível do arco preenchido — NÃO usar strokeDashoffset aqui:
  // como o dash (270°) e o gap (90°) somam exatamente a circunferência, deslocar
  // o offset só GIRA o segmento já cheio ao redor do círculo, não o encolhe (era
  // o bug: em qualquer valor o arco aparecia quase inteiro). O comprimento do
  // dash precisa ser proporcional ao progresso, ponto.
  const visibleLen = ARC_LEN * progress

  // Bolinha na ponta do progresso (como na referência)
  const tipRad = ((START_DEG + 270 * progress) * Math.PI) / 180
  const tipX = 100 + R * Math.cos(tipRad)
  const tipY = 100 + R * Math.sin(tipRad)

  return (
    <div className="relative flex h-[270px] w-[270px] items-center justify-center">
      <div className="opal-breathing-glow" aria-hidden />

      {/* A opala vive dentro do anel, na metade de cima */}
      <div className="absolute left-1/2 top-[13%] -translate-x-1/2">
        <OpalCrystal size={92} stage={3} />
      </div>

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
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${ARC_LEN} ${CIRC - ARC_LEN}`}
          transform={`rotate(${START_DEG} 100 100)`}
        />
        {/* progresso — dash = comprimento visível (cresce com a meta), gap gigante
            pra nunca repetir o padrão dentro do círculo */}
        <circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke="url(#score-gauge-fill)"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${visibleLen} ${CIRC}`}
          transform={`rotate(${START_DEG} 100 100)`}
          style={{ filter: "drop-shadow(0 0 4px color-mix(in srgb, var(--glow-mint) 60%, transparent))" }}
        />
        {/* marcador na ponta do progresso */}
        <circle
          cx={tipX}
          cy={tipY}
          r={6}
          fill="var(--gauge-to)"
          style={{ filter: "drop-shadow(0 0 6px var(--glow-mint))" }}
        />
      </svg>

      {/* Tempo dentro do anel, logo abaixo da opala */}
      <div className="absolute inset-x-0 top-[52%] flex flex-col items-center">
        <div className="flex items-baseline gap-1">
          <span className="text-[46px] font-semibold leading-none tracking-tight text-foreground">
            {display}
          </span>
          <span className="text-base font-medium text-muted-foreground">/{goalMinutes} min</span>
        </div>
        <p className="mt-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
