"use client"

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts"

interface AreaRadarChartProps {
  data: { area: string; pct: number }[]
}

export function AreaRadarChart({ data }: AreaRadarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-52 text-sm text-muted-foreground">
        Responda questões para ver seu desempenho por área
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis
          dataKey="area"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
        />
        <Radar
          dataKey="pct"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
