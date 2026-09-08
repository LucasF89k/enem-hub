"use client"

import { format, startOfWeek, addDays, startOfYear, endOfYear } from "date-fns"
import { ptBR } from "date-fns/locale"

interface CalendarHeatmapProps {
  data: Record<string, number> // key: "YYYY-MM-DD", value: minutes
}

function getColor(minutes: number): string {
  if (minutes === 0) return "var(--muted)"
  if (minutes < 30) return "color-mix(in srgb, var(--primary) 20%, transparent)"
  if (minutes < 60) return "color-mix(in srgb, var(--primary) 45%, transparent)"
  if (minutes < 120) return "color-mix(in srgb, var(--primary) 70%, transparent)"
  return "var(--primary)"
}

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export function CalendarHeatmap({ data }: CalendarHeatmapProps) {
  // Ano-calendário (jan→dez), não uma janela rolante de 365 dias. Era isso
  // que fazia a faixa começar em "ago" e voltar pra "ago" no ano seguinte,
  // uma ordem de mês que não bate com o que qualquer pessoa espera de um
  // calendário. Os dias depois de hoje (dez ainda não vivido) continuam
  // mascarados pelo mesmo `isFuture` de antes.
  const today = new Date()
  const yearStart = startOfYear(today)
  const yearEnd = endOfYear(today)

  const weeks: Date[][] = []
  let current = startOfWeek(yearStart, { weekStartsOn: 0 })
  while (current <= yearEnd) {
    const week: Date[] = []
    for (let d = 0; d < 7; d++) week.push(addDays(current, d))
    weeks.push(week)
    current = addDays(current, 7)
  }

  const CELL = 11
  const GAP = 2
  const LEFT = 28
  const TOP = 20
  const totalWidth = LEFT + weeks.length * (CELL + GAP)
  const totalHeight = TOP + 7 * (CELL + GAP)

  // Um rótulo por mudança de mês. Antes o rótulo só saía na semana que contivesse
  // o dia 1º, então o primeiro mês do intervalo (que quase nunca começa no dia 1)
  // ficava sem identificação: a faixa abria num mês anônimo.
  const monthLabels: { x: number; label: string }[] = []
  let lastMonth = -1
  const targetYear = today.getFullYear()
  weeks.forEach((week, wi) => {
    const first = week[0]
    // A primeira semana do ano quase sempre começa num domingo de dezembro do
    // ano anterior (é só o preenchimento pra fechar a semana, não faz parte do
    // ano exibido). Rotular essa semana criava um "dez" colado no "jan" logo
    // ao lado, e os dois rótulos quase se sobrepunham. As células continuam
    // aparecendo normalmente (se houver estudo registrado nesses dias, ele
    // mostra); só o rótulo de mês de fora do ano-alvo é que não entra.
    if (first.getFullYear() !== targetYear) return
    const m = first.getMonth()
    if (m !== lastMonth) {
      lastMonth = m
      monthLabels.push({
        x: LEFT + wi * (CELL + GAP),
        label: format(first, "MMM", { locale: ptBR }),
      })
    }
  })

  return (
    <div>
      {/* viewBox + width 100%: a faixa inteira (primeiro ao último mês) cabe na
          largura disponível e encolhe junto com o card. Com largura fixa ela
          estourava o container e aparecia uma barra de rolagem horizontal. */}
      <svg
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        width="100%"
        height={totalHeight}
        preserveAspectRatio="xMinYMid meet"
        role="img"
        aria-label={`Atividade de estudo em ${today.getFullYear()}`}
      >
        {/* Day labels */}
        {[1, 3, 5].map((d) => (
          <text
            key={d}
            x={0}
            y={TOP + d * (CELL + GAP) + CELL / 2 + 4}
            fontSize={8}
            fill="var(--muted-foreground)"
          >
            {DAY_LABELS[d]}
          </text>
        ))}

        {/* Month labels */}
        {monthLabels.map((m) => (
          <text key={m.x} x={m.x} y={10} fontSize={8} fill="var(--muted-foreground)">
            {m.label}
          </text>
        ))}

        {/* Cells */}
        {weeks.map((week, wi) =>
          week.map((day, di) => {
            const key = format(day, "yyyy-MM-dd")
            const mins = data[key] ?? 0
            const isFuture = day > today
            return (
              <rect
                key={key}
                x={LEFT + wi * (CELL + GAP)}
                y={TOP + di * (CELL + GAP)}
                width={CELL}
                height={CELL}
                rx={2}
                fill={isFuture ? "transparent" : getColor(mins)}
                opacity={isFuture ? 0 : 1}
              >
                <title>
                  {key}: {mins} min
                </title>
              </rect>
            )
          }),
        )}
      </svg>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span>Menos</span>
        {[0, 30, 60, 120, 180].map((m) => (
          <div key={m} className="h-2.5 w-2.5 rounded-sm" style={{ background: getColor(m) }} />
        ))}
        <span>Mais</span>
      </div>
    </div>
  )
}
