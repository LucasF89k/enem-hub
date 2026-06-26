"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts"

interface DataPoint {
  label: string
  score: number
  isCurrent?: boolean
}

export function SimuladoScoreChart({ data }: { data: DataPoint[] }) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-28 rounded-xl border bg-muted/30 text-sm text-muted-foreground">
        Complete mais tentativas para ver sua evolução
      </div>
    )
  }

  const currentPoint = data.find((d) => d.isCurrent)

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip
          formatter={(value) => [`${value}%`, "Acerto"]}
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--card))",
            color: "hsl(var(--foreground))",
          }}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ fill: "hsl(var(--primary))", r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
        {currentPoint && (
          <ReferenceDot
            x={currentPoint.label}
            y={currentPoint.score}
            r={6}
            fill="hsl(var(--primary))"
            stroke="hsl(var(--background))"
            strokeWidth={2}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
