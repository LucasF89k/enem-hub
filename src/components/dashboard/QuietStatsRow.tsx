import Link from "next/link"

/** 3 colunas silenciosas com divisores finos, sem cards. */
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
    // grid de 3 colunas EXATAMENTE iguais: com flex+divider solto as colunas
    // podiam desalinhar quando o texto de um label era mais largo que o outro
    // (flex-basis:0 some com min-width:auto do conteúdo, empurrando a coluna
    // vizinha). divide-x desenha os traços sem consumir espaço de layout.
    <div className="grid w-full grid-cols-3 divide-x divide-border">
      <div className="min-w-0 text-center">
        <p className="text-xl font-normal text-foreground">{streak}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">sequência</p>
      </div>

      <div className="min-w-0 text-center">
        <p className="text-xl font-normal text-accent">
          {estimatedScore > 0 ? Math.round(estimatedScore) : "-"}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">nota estimada</p>
      </div>

      <div className="min-w-0 text-center">
        {daysUntilExam !== null ? (
          <>
            <p className="text-xl font-normal text-primary">{daysUntilExam}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">dias p/ ENEM</p>
          </>
        ) : (
          <>
            <p className="text-xl font-normal text-muted-foreground">-</p>
            <Link href="/profile/settings" className="mt-0.5 block text-[11px] text-primary underline">
              definir data
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
