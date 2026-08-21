import Link from "next/link"
import { GraduationCap } from "lucide-react"
import { findUniversidade, TIPO_LABEL } from "@/constants/universidades"
import { findCurso, estimateCutoff } from "@/constants/cursos"

/** Resumo da meta: curso + universidade + nota de corte estimada + distância da nota. */
export function TargetInstitutionCard({
  institution,
  cursoSlug,
  estimatedScore,
}: {
  institution: string | null | undefined
  cursoSlug: string
  estimatedScore: number
}) {
  const curso = findCurso(cursoSlug) ?? findCurso("medicina")!
  const uni = findUniversidade(institution)

  if (!uni) {
    return (
      <Link
        href="/profile/settings"
        className="mt-8 flex items-center gap-2 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <GraduationCap className="h-4 w-4" />
        Definir universidade-alvo para {curso.nome}
      </Link>
    )
  }

  const cutoff = estimateCutoff(curso, uni)
  const hasScore = estimatedScore > 0
  const gap = Math.round(cutoff - estimatedScore)
  const reached = hasScore && gap <= 0

  return (
    // w-full, sem max-w: os blocos vizinhos do hero ocupam a largura toda, e
    // um card mais estreito no meio deles lê como desalinhado mesmo estando
    // centralizado — as bordas é que precisam bater.
    <div className="mt-8 w-full rounded-2xl border px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <GraduationCap className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {uni.sigla} · {curso.nome}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {TIPO_LABEL[uni.tipo]} · {uni.cidade}/{uni.uf}
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
            <span className="font-medium text-accent">✓ Sua nota estimada já alcança o corte</span>
          ) : (
            <span className="text-muted-foreground">
              Faltam <b className="font-semibold text-primary">{gap}</b> pontos para o corte
            </span>
          )}
        </div>
      )}
    </div>
  )
}
