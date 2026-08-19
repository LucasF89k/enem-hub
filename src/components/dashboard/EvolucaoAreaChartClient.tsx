"use client"

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

interface AreaStat {
  area: string
  slug: string
  accuracy: number
  total: number
}

export function EvolucaoAreaChartClient({ data }: { data: AreaStat[] }) {
  const hasData = data.some((d) => d.total > 0)

  if (!hasData) {
    return (
      <div className="flex h-52 flex-col items-center justify-center gap-2 text-muted-foreground">
        <p className="text-sm">Nenhuma questão respondida ainda</p>
        <p className="text-xs">Responda questões para ver sua evolução por área</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis
          dataKey="area"
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <PolarRadiusAxis
          domain={[0, 100]}
          tick={false}
          axisLine={false}
        />
        <Radar
          dataKey="accuracy"
          stroke="var(--glow-mint)"
          fill="var(--glow-mint)"
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Tooltip
          formatter={(value) => [`${value}%`, "Acertos"]}
          contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            fontSize: "12px",
            color: "var(--foreground)",
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
