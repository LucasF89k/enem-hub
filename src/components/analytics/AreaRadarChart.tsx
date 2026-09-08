"use client"

interface AreaRadarChartProps {
  data: { area: string; pct: number; total: number }[]
}

/**
 * Acerto por área, em barras.
 *
 * Era um radar, mas o radar só fecha uma forma legível com 3+ eixos e aqui ele
 * recebia apenas as áreas em que o usuário já tinha respondido algo: com uma
 * única área virava uma linha com um ponto na ponta, sem leitura possível.
 * Barras funcionam com qualquer quantidade, e ainda deixam comparar as áreas
 * lado a lado, que é a pergunta real ("onde estou pior?").
 *
 * A contagem de questões aparece junto de propósito: 50% em 2 questões e 50%
 * em 200 são coisas muito diferentes, e sem esse número a barra engana.
 */
export function AreaRadarChart({ data }: AreaRadarChartProps) {
  const answered = data.filter((d) => d.total > 0)

  if (answered.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center px-6 text-center text-sm text-muted-foreground">
        Responda questões para ver seu desempenho por área
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 py-1">
      {data.map((d) => {
        const semDados = d.total === 0
        return (
          <div key={d.area}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="text-[13px] text-foreground">{d.area}</span>
              {semDados ? (
                <span className="text-[11px] text-muted-foreground">sem questões</span>
              ) : (
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  <b className="text-sm font-semibold text-foreground">{d.pct}%</b>
                  {" · "}
                  {d.total} {d.total === 1 ? "questão" : "questões"}
                </span>
              )}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--gauge-track)]">
              {!semDados && (
                <div
                  className="h-full rounded-full transition-[width] duration-700 ease-out"
                  style={{
                    width: `${Math.max(d.pct, 2)}%`,
                    background:
                      "linear-gradient(90deg, var(--gauge-from), var(--gauge-to))",
                  }}
                />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
