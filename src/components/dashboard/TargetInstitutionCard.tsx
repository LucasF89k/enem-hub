import Link from "next/link"
import { GraduationCap } from "lucide-react"
import { findFaculdade, TIPO_LABEL } from "@/constants/faculdades-medicina"

/** Faculdade-alvo + nota de corte + distância da nota estimada. */
export function TargetInstitutionCard({
  institution,
  estimatedScore,
}: {
  institution: string | null | undefined
  estimatedScore: number
}) {
  const fac = findFaculdade(institution)

  if (!fac) {
    return (
      <Link
        href="/profile/settings"
        className="mt-8 flex items-center gap-2 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <GraduationCap className="h-4 w-4" />
        Escolher faculdade-alvo
      </Link>
    )
  }

  const cutoff = Math.round(fac.notaCorte)
  const hasScore = estimatedScore > 0
  const gap = Math.round(cutoff - estimatedScore)
  const reached = hasScore && gap <= 0

  return (
    <Link
      href="/profile/settings"
      className="mt-8 w-full max-w-[340px] rounded-2xl border px-4 py-3 transition-colors hover:bg-muted/30"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <GraduationCap className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{fac.sigla}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {TIPO_LABEL[fac.tipo]} · {fac.cidade}/{fac.estado}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-base font-semibold tabular-nums text-foreground">{cutoff}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">nota de corte</p>
        </div>
      </div>

      {hasScore && (
        <div className="mt-2.5 border-t pt-2.5 text-[12px]">
          {reached ? (
            <span className="font-medium text-accent">
              ✓ Sua nota estimada já alcança o corte
            </span>
          ) : (
            <span className="text-muted-foreground">
              Faltam <b className="font-semibold text-primary">{gap}</b> pontos para o corte
            </span>
          )}
        </div>
      )}
    </Link>
  )
}
