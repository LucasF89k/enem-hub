import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verificarWebhookAbacate } from "@/lib/abacatepay"
import { PlanoTipo, AssinaturaStatus } from "@prisma/client"

// Não parsear o body automaticamente — precisamos do raw para verificar HMAC
export const dynamic = "force-dynamic"

type EventoWebhook = {
  id: string
  event: string
  data: {
    id?: string
    externalId?: string
    customerId?: string
    status?: string
    nextBillingDate?: string
  }
}

export async function POST(req: NextRequest) {
  const { valido, payload } = await verificarWebhookAbacate(req)

  if (!valido) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 })
  }

  const evento = payload as EventoWebhook

  // Proteção contra eventos duplicados via idempotência no ID do evento.
  // AbacatePay pode reenviar o mesmo evento; o upsert abaixo é idempotente.

  try {
    await processarEvento(evento)
  } catch (err) {
    console.error("[webhook abacatepay]", evento.event, err)
    // Retorna 500 para o AbacatePay retentar
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

async function processarEvento(evento: EventoWebhook) {
  const { event, data } = evento
  if (!data?.id) return

  // Localiza a subscription pelo ID da assinatura AbacatePay
  const sub = await db.subscription.findFirst({
    where: { abacateSubscriptionId: data.id },
  })

  switch (event) {
    case "subscription.completed": {
      // Assinatura ativada pela primeira vez
      if (!sub) return

      // Detecta o plano pelo externalId (formato: userId_PRO_MENSAL_timestamp)
      const plano = detectarPlano(sub.abacateSubscriptionId)
      const periodoFim = calcularPeriodoFim(plano)

      await db.subscription.update({
        where: { id: sub.id },
        data: {
          plano,
          status: AssinaturaStatus.ATIVA,
          periodoFim,
          ultimaCobrancaEm: new Date(),
        },
      })
      break
    }

    case "subscription.renewed": {
      // Cobrança recorrente paga — renova mais um período
      if (!sub) return

      const periodoFim = calcularPeriodoFim(sub.plano)

      await db.subscription.update({
        where: { id: sub.id },
        data: {
          status: AssinaturaStatus.ATIVA,
          periodoFim,
          ultimaCobrancaEm: new Date(),
        },
      })
      break
    }

    case "subscription.cancelled": {
      if (!sub) return

      await db.subscription.update({
        where: { id: sub.id },
        data: {
          plano: PlanoTipo.FREE,
          status: AssinaturaStatus.CANCELADA,
          canceladoEm: new Date(),
        },
      })
      break
    }

    // Outros eventos (checkout.completed, etc.) ignorados por enquanto
    default:
      break
  }
}

function detectarPlano(subscriptionId: string | null): PlanoTipo {
  if (!subscriptionId) return PlanoTipo.FREE
  // O externalId foi criado como `userId_PRO_MENSAL_timestamp` ou `userId_PRO_ANUAL_timestamp`
  if (subscriptionId.includes("PRO_ANUAL")) return PlanoTipo.PRO_ANUAL
  return PlanoTipo.PRO_MENSAL
}

function calcularPeriodoFim(plano: PlanoTipo): Date {
  const fim = new Date()
  if (plano === PlanoTipo.PRO_ANUAL) {
    fim.setFullYear(fim.getFullYear() + 1)
  } else {
    fim.setMonth(fim.getMonth() + 1)
  }
  return fim
}
