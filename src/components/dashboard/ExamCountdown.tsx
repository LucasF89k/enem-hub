"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CalendarClock } from "lucide-react"

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
}: {
  examDate: string | null
  trailLabel?: string
  trailPeriod?: string
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
    <div className="w-full rounded-2xl border bg-gradient-to-b from-primary/10 to-transparent px-4 py-4">
      <div className="mb-3 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
        <CalendarClock className="h-3.5 w-3.5 text-primary" />
        {t!.done ? "É hoje! Boa prova 🚀" : "Contagem para o ENEM"}
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
        <p className="mt-3 border-t pt-2.5 text-center text-[11px] text-muted-foreground">
          Trilha <b className="font-medium text-primary">{trailLabel}</b>
          {trailPeriod ? ` · ${trailPeriod}` : ""}
        </p>
      )}
    </div>
  )
}
