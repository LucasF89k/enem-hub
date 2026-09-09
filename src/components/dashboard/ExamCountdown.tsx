"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CalendarClock, Route } from "lucide-react"
import { cn } from "@/lib/utils"

function diff(target: number) {
  const ms = Math.max(0, target - Date.now())
  const s = Math.floor(ms / 1000)
  return {
    dias: Math.floor(s / 86400),
    horas: Math.floor((s % 86400) / 3600),
    min: Math.floor((s % 3600) / 60),
    seg: s % 60,
    done: ms === 0,
  }
}

/** Contador regressivo, ao vivo, até a data do ENEM. */
export function ExamCountdown({
  examDate,
  trailLabel,
  trailPeriod,
  trailColor,
}: {
  examDate: string | null
  trailLabel?: string
  trailPeriod?: string
  /** classes bg+text da trilha (ver TRAIL_CONFIGS em lib/trail.ts) */
  trailColor?: string
}) {
  const target = examDate ? new Date(examDate).getTime() : null
  const [t, setT] = useState(() => (target ? diff(target) : null))

  useEffect(() => {
    if (!target) return
    setT(diff(target))
    const id = setInterval(() => setT(diff(target)), 1000)
    return () => clearInterval(id)
  }, [target])

  if (!target) {
    return (
      <Link
        href="/profile/settings"
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed py-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <CalendarClock className="h-4 w-4" />
        Definir a data do ENEM para ativar a contagem
      </Link>
    )
  }

  const cells = [
    { v: t!.dias, l: "dias" },
    { v: t!.horas, l: "horas" },
    { v: t!.min, l: "min" },
    { v: t!.seg, l: "seg" },
  ]

  return (
    // O card em si (números) fica neutro: eles já se destacam pelo tamanho,
    // sem precisar de tinta no fundo. A cor da trilha, mais abaixo, é outra
    // história: ali ela carrega informação (qual fase o aluno está).
    <div className="w-full rounded-2xl border bg-gradient-to-b from-foreground/[0.04] to-transparent px-4 py-4">
      <div className="mb-3 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
        <CalendarClock className="h-3.5 w-3.5" />
        {t!.done ? "É hoje. Boa prova!" : "Contagem para o ENEM"}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {cells.map((c) => (
          <div key={c.l} className="flex flex-col items-center">
            <span className="text-2xl font-semibold tabular-nums text-foreground md:text-3xl">
              {String(c.v).padStart(2, "0")}
            </span>
            <span className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              {c.l}
            </span>
          </div>
        ))}
      </div>

      {trailLabel && (
        // Cor da trilha (uma por tipo, ver TRAIL_CONFIGS): é a única
        // informação nessa tela que muda de sentido junto com a cor (quanto
        // mais "quente", mais perto do ENEM), então continua destacada.
        <div className={cn("mt-3 flex items-center justify-center gap-2 rounded-xl py-2", trailColor ?? "bg-foreground/[0.04] text-foreground")}>
          <Route className="h-4 w-4" />
          <span className="text-[13px] font-medium">Trilha {trailLabel}</span>
          {trailPeriod && (
            <span className="text-[11px] opacity-80">· {trailPeriod}</span>
          )}
        </div>
      )}
    </div>
  )
}
