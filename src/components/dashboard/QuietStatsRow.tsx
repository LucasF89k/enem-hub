import Link from "next/link"

/** 3 colunas silenciosas com divisores finos — sem cards. */
export function QuietStatsRow({
  streak,
  estimatedScore,
  daysUntilExam,
}: {
  streak: number
  estimatedScore: number
  daysUntilExam: number | null
}) {
  return (
    <div className="flex w-full">
      <div className="flex-1 text-center">
        <p className="text-xl font-normal text-foreground">{streak}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">sequência</p>
      </div>

      <div className="my-0.5 w-px bg-border" />

      <div className="flex-1 text-center">
        <p className="text-xl font-normal text-accent">
          {estimatedScore > 0 ? Math.round(estimatedScore) : "—"}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">nota estimada</p>
      </div>

      <div className="my-0.5 w-px bg-border" />

      <div className="flex-1 text-center">
        {daysUntilExam !== null ? (
          <>
            <p className="text-xl font-normal text-primary">{daysUntilExam}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">dias p/ ENEM</p>
          </>
        ) : (
          <>
            <p className="text-xl font-normal text-muted-foreground">—</p>
            <Link href="/profile/settings" className="mt-0.5 block text-[11px] text-primary underline">
              definir data
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
