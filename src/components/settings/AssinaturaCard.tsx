"use client"

import { Crown, Zap, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePlano } from "@/hooks/use-plano"
import { PlanoTipo } from "@prisma/client"
import Link from "next/link"
import { BotaoCancelar } from "@/components/assinatura/BotaoCancelar"

export function AssinaturaCard() {
  const { plano, pro, periodoFim, carregando } = usePlano()

  const labelPlano =
    plano === PlanoTipo.PRO_ANUAL
      ? "Pro Anual"
      : plano === PlanoTipo.PRO_MENSAL
        ? "Pro Mensal"
        : "Grátis"

  const proximaCobranca = periodoFim
    ? periodoFim.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null

  return (
    <Card className={pro ? "border-amber-500/30" : undefined}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Crown className={`h-4 w-4 ${pro ? "text-amber-400" : "text-muted-foreground"}`} />
          Assinatura
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {carregando ? (
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        ) : pro ? (
          <>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/30">
                <Crown className="h-3 w-3" />
                {labelPlano}
              </span>
              <span className="text-xs text-muted-foreground">ativo</span>
            </div>
            {proximaCobranca && (
              <p className="text-xs text-muted-foreground">
                Próxima cobrança: {proximaCobranca}
              </p>
            )}
            <BotaoCancelar />
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Você está no plano <strong>Grátis</strong>. Assine o Pro para remover anúncios e desbloquear todos os recursos.
            </p>
            <Link
              href="/assine"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
            >
              <Zap className="h-3.5 w-3.5" />
              Ver planos Pro
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  )
}
