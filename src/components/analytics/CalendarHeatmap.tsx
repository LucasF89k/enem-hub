"use client"

import { format, startOfWeek, addDays, subDays } from "date-fns"
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
  const today = new Date()
  const endDate = today
  const startDate = subDays(today, 364)

  // Build grid: 53 weeks × 7 days
  const weeks: Date[][] = []
  let current = startOfWeek(startDate, { weekStartsOn: 0 })

  while (current <= endDate) {
    const week: Date[] = []
    for (let d = 0; d < 7; d++) {
      week.push(addDays(current, d))
    }
    weeks.push(week)
    current = addDays(current, 7)
  }

  const CELL = 11
  const GAP = 2
  const totalWidth = weeks.length * (CELL + GAP) + 28
  const totalHeight = 7 * (CELL + GAP) + 20

  return (
    <div className="overflow-x-auto">
      <svg
        width={totalWidth}
        height={totalHeight}
        className="min-w-[600px]"
      >
        {/* Day labels */}
        {[1, 3, 5].map((d) => (
          <text
            key={d}
            x={0}
            y={20 + d * (CELL + GAP) + CELL / 2 + 4}
            fontSize={8}
            fill="var(--muted-foreground)"
          >
            {DAY_LABELS[d]}
          </text>
        ))}

        {/* Month labels */}
        {weeks.map((week, wi) => {
          const firstOfMonth = week.find((d) => d.getDate() === 1)
          if (!firstOfMonth) return null
          return (
            <text
              key={wi}
              x={28 + wi * (CELL + GAP)}
              y={10}
              fontSize={8}
              fill="var(--muted-foreground)"
            >
              {format(firstOfMonth, "MMM", { locale: ptBR })}
            </text>
          )
        })}

        {/* Cells */}
        {weeks.map((week, wi) =>
          week.map((day, di) => {
            const key = format(day, "yyyy-MM-dd")
            const mins = data[key] ?? 0
            const isFuture = day > today
            const color = isFuture ? "transparent" : getColor(mins)
            const x = 28 + wi * (CELL + GAP)
            const y = 20 + di * (CELL + GAP)
            return (
              <rect
                key={key}
                x={x}
                y={y}
                width={CELL}
                height={CELL}
                rx={2}
                fill={color}
                opacity={isFuture ? 0 : 1}
              >
                <title>{key}: {mins} min</title>
              </rect>
            )
          })
        )}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
        <span>Menos</span>
        {[0, 30, 60, 120, 180].map((m) => (
          <div
            key={m}
            className="h-2.5 w-2.5 rounded-sm"
            style={{ background: getColor(m) }}
          />
        ))}
        <span>Mais</span>
      </div>
    </div>
  )
}
