"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Play, Loader2, Clock, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { XpBadge } from "@/components/gamification/XpBadge"
import { startSimuladoAndRedirect } from "@/app/actions/simulado.actions"

interface DayInfo {
  count: number
  inProgressId: string | null
}

const DAYS = [
  {
    day: 1,
    title: "1º dia",
    areas: "Linguagens e Ciências Humanas",
    baseMin: 330,
    baseLabel: "5h30",
  },
  {
    day: 2,
    title: "2º dia",
    areas: "Matemática e Ciências da Natureza",
    baseMin: 300,
    baseLabel: "5h",
  },
] as const

export function SimuladoStart({
  simuladoId,
  day1,
  day2,
}: {
  simuladoId: string
  day1: DayInfo
  day2: DayInfo
}) {
  const [extraTime, setExtraTime] = useState(false)
  const [startingDay, setStartingDay] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  const info: Record<number, DayInfo> = { 1: day1, 2: day2 }

  function iniciar(day: number) {
    setStartingDay(day)
    startTransition(async () => {
      await startSimuladoAndRedirect(simuladoId, day, extraTime)
    })
  }

  const totalLabel = (baseMin: number) => {
    const min = baseMin + (extraTime ? 60 : 0)
    const h = Math.floor(min / 60)
    const m = min % 60
    return m ? `${h}h${m}` : `${h}h`
  }

  return (
    <div className="space-y-4">
      {/* Modo oficial: hora adicional */}
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-3.5">
        <Checkbox
          checked={extraTime}
          onCheckedChange={(v) => setExtraTime(v === true)}
          className="mt-0.5"
        />
        <div>
          <p className="text-sm font-medium">Tenho tempo adicional (+1h)</p>
          <p className="text-xs text-muted-foreground">
            Como no atendimento especializado do ENEM — acrescenta 1 hora ao cronômetro.
          </p>
        </div>
      </label>

      {/* Dias */}
      <div className="space-y-3">
        {DAYS.map((d) => {
          const di = info[d.day]
          const disabled = di.count === 0
          const loading = isPending && startingDay === d.day
          return (
            <div
              key={d.day}
              className={cn(
                "rounded-2xl border p-4",
                disabled ? "opacity-60" : "bg-card",
              )}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{d.title}</p>
                  <p className="text-xs text-muted-foreground">{d.areas}</p>
                  <XpBadge label="até +70 XP" className="mt-1.5" />
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {di.count} questões
                  </span>
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {totalLabel(d.baseMin)}
                  </span>
                </div>
              </div>

              {disabled ? (
                <Button disabled variant="outline" className="w-full">
                  Sem questões deste dia
                </Button>
              ) : di.inProgressId ? (
                <Button asChild className="w-full gap-2">
                  <Link href={`/simulados/${simuladoId}/${di.inProgressId}`}>
                    <Play className="h-4 w-4 fill-current" />
                    Continuar {d.title}
                  </Link>
                </Button>
              ) : (
                <Button
                  className="w-full gap-2"
                  disabled={isPending}
                  onClick={() => iniciar(d.day)}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 fill-current" />
                  )}
                  {loading ? "Iniciando…" : `Iniciar ${d.title}`}
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
