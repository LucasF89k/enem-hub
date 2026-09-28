"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { abacate, ABACATE_PRODUTOS, PRECOS, type PlanoId } from "@/lib/abacatepay"
import { PlanoTipo } from "@prisma/client"
import { PaymentMethod } from "@abacatepay/types/v2"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

/** Garante que o cliente AbacatePay do usuário existe e retorna o ID. */
async function garantirCliente(
  userId: string,
  nome: string,
  email: string,
): Promise<string> {
  const sub = await db.subscription.findUnique({ where: { userId } })
  if (sub?.abacateCustomerId) return sub.abacateCustomerId

  const resultado = await abacate.customers.create({ name: nome, email })
  if (!resultado.success || !resultado.data) {
    throw new Error(resultado.error ?? "Erro ao criar cliente AbacatePay")
  }

  await db.subscription.upsert({
    where: { userId },
    create: { userId, abacateCustomerId: resultado.data.id },
    update: { abacateCustomerId: resultado.data.id },
  })

  return resultado.data.id
}

/**
 * Cria ou renova a assinatura do usuário.
 * Retorna a URL de checkout do AbacatePay.
 */
export async function iniciarAssinatura(planoId: PlanoId): Promise<{
  ok: boolean
  url?: string
  erro?: string
}> {
  const sessao = await auth()
  if (!sessao?.user?.id) return { ok: false, erro: "Não autenticado" }

  const produtoId = ABACATE_PRODUTOS[planoId]
  if (!produtoId) {
    return {
      ok: false,
      erro: "Produto não configurado. Configure ABACATEPAY_PRODUTO_MENSAL_ID / ABACATEPAY_PRODUTO_ANUAL_ID.",
    }
  }

  const usuario = await db.user.findUnique({
    where: { id: sessao.user.id },
    select: { name: true, email: true },
  })
  if (!usuario?.email) return { ok: false, erro: "Usuário não encontrado" }

  try {
    const customerId = await garantirCliente(
      sessao.user.id,
      usuario.name ?? "Aluno Vion",
      usuario.email,
    )

    const resultado = await abacate.subscriptions.create({
      name: planoId === "PRO_MENSAL" ? "Vion Pro Mensal" : "Vion Pro Anual",
      amount: PRECOS[planoId],
      externalId: `${sessao.user.id}_${planoId}_${Date.now()}`,
      method: PaymentMethod.Card,
      frequency: {
        cycle: planoId === "PRO_MENSAL" ? "MONTHLY" : "YEARLY",
        dayOfProcessing: new Date().getDate(),
      },
      customerId,
      retryPolicy: { maxRetry: 3, retryEvery: 2 },
    })

    if (!resultado.success || !resultado.data) {
      console.error("[assinatura] AbacatePay error:", resultado.error)
      return { ok: false, erro: resultado.error ?? "Erro ao criar assinatura" }
    }

    // Salva o ID da assinatura criada (status virá pelo webhook)
    await db.subscription.update({
      where: { userId: sessao.user.id },
      data: { abacateSubscriptionId: resultado.data.id },
    })

    // A URL de checkout vem no campo url da assinatura
    const url =
      (resultado.data as unknown as Record<string, string>).url ??
      `${APP_URL}/assine/pendente`

    return { ok: true, url }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[assinatura] iniciarAssinatura:", msg, err)
    return { ok: false, erro: `Erro ao iniciar assinatura: ${msg}` }
  }
}

/** Cancela a assinatura ativa do usuário. */
export async function cancelarAssinatura(): Promise<{
  ok: boolean
  erro?: string
}> {
  const sessao = await auth()
  if (!sessao?.user?.id) return { ok: false, erro: "Não autenticado" }

  const sub = await db.subscription.findUnique({
    where: { userId: sessao.user.id },
  })

  if (!sub?.abacateSubscriptionId) {
    return { ok: false, erro: "Nenhuma assinatura ativa encontrada" }
  }

  try {
    const resultado = await abacate.subscriptions.cancel(sub.abacateSubscriptionId)
    if (!resultado.success) {
      return { ok: false, erro: resultado.error ?? "Erro ao cancelar" }
    }

    await db.subscription.update({
      where: { userId: sessao.user.id },
      data: {
        plano: PlanoTipo.FREE,
        status: "CANCELADA",
        canceladoEm: new Date(),
      },
    })

    return { ok: true }
  } catch (err) {
    console.error("[assinatura] cancelarAssinatura:", err)
    return { ok: false, erro: "Erro interno ao cancelar assinatura" }
  }
}

/** Retorna o plano atual do usuário (FREE se não tiver subscription). */
export async function getPlanoAtual(): Promise<{
  plano: PlanoTipo
  pro: boolean
  periodoFim: Date | null
}> {
  const sessao = await auth()
  if (!sessao?.user?.id) return { plano: PlanoTipo.FREE, pro: false, periodoFim: null }

  const sub = await db.subscription.findUnique({
    where: { userId: sessao.user.id },
    select: { plano: true, status: true, periodoFim: true },
  })

  if (!sub) return { plano: PlanoTipo.FREE, pro: false, periodoFim: null }

  // Assinatura válida = ATIVA ou TRIAL e dentro do período
  const ativa =
    sub.status === "ATIVA" || sub.status === "TRIAL"
      ? !sub.periodoFim || sub.periodoFim > new Date()
      : false

  const pro = ativa && sub.plano !== PlanoTipo.FREE

  return {
    plano: pro ? sub.plano : PlanoTipo.FREE,
    pro,
    periodoFim: sub.periodoFim,
  }
}
