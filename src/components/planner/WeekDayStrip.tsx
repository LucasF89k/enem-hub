"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DaySummary {
  date: Date
  totalItems: number
  completedItems: number
  isToday: boolean
}

const DOW = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"]

function sameDay(a: Date, b: Date) {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10)
}

export function WeekDayStrip({
  days,
  selectedDate,
  onSelectDay,
}: {
  days: DaySummary[]
  selectedDate: Date
  onSelectDay: (date: Date) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none sm:justify-between">
      {days.map((d) => {
        const selected = sameDay(d.date, selectedDate)
        const empty = d.totalItems === 0
        const done = d.totalItems > 0 && d.completedItems >= d.totalItems
        const pct = d.totalItems > 0 ? d.completedItems / d.totalItems : 0

        return (
          <button
            key={d.date.toISOString()}
            type="button"
            onClick={() => onSelectDay(d.date)}
            className={cn(
              "flex w-[52px] shrink-0 flex-col items-center gap-1.5 rounded-2xl border py-2.5 transition-colors sm:flex-1",
              selected ? "border-primary bg-primary/10" : "border-border hover:bg-muted/40",
            )}
          >
            <span
              className={cn(
                "text-[10.5px] font-medium tracking-wide",
                d.isToday ? "text-primary" : "text-muted-foreground",
              )}
            >
              {DOW[d.date.getUTCDay()]}
            </span>
            <span
              className={cn(
                "text-[15px] leading-none",
                selected || d.isToday ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {d.date.toISOString().slice(8, 10)}
            </span>

            {/* anel de status */}
            {empty ? (
              <span className="h-5 w-5 rounded-full border-[1.5px] border-dashed border-muted-foreground/50" />
            ) : done ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                <Check className="h-3 w-3 text-white" strokeWidth={3} />
              </span>
            ) : (
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(var(--primary) ${pct * 360}deg, var(--border) 0)`,
                }}
              >
                <span className="h-3 w-3 rounded-full bg-background" />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
