import { AbacatePay } from "@abacatepay/sdk"

// Singleton — reutiliza a mesma instância em hot-reload do Next.js
const globalWithAbacate = global as typeof globalThis & {
  _abacatepay?: ReturnType<typeof AbacatePay>
}

export const abacate =
  globalWithAbacate._abacatepay ??
  (globalWithAbacate._abacatepay = AbacatePay({
    secret: process.env.ABACATEPAY_API_KEY!,
  }))

// IDs dos produtos cadastrados no painel AbacatePay.
// Preencher após criar os produtos em app.abacatepay.com/products.
export const ABACATE_PRODUTOS = {
  PRO_MENSAL: process.env.ABACATEPAY_PRODUTO_MENSAL_ID ?? "",
  PRO_ANUAL: process.env.ABACATEPAY_PRODUTO_ANUAL_ID ?? "",
} as const

// Preços exibidos na UI (fonte da verdade para o frontend).
export const PRECOS = {
  PRO_MENSAL: 1900, // R$19,00 em centavos
  PRO_ANUAL: 15900, // R$159,00 em centavos (~R$13,25/mês)
} as const

export type PlanoId = keyof typeof ABACATE_PRODUTOS

// Verifica assinatura do webhook usando HMAC-SHA256
export async function verificarWebhookAbacate(
  req: Request,
): Promise<{ valido: boolean; payload: unknown }> {
  const assinatura = req.headers.get("x-webhook-signature")
  const segredo = process.env.ABACATEPAY_WEBHOOK_SECRET

  const rawBody = await req.text()

  if (!segredo || !assinatura) {
    // Em dev sem segredo configurado, aceita mesmo assim
    if (process.env.NODE_ENV === "development") {
      return { valido: true, payload: JSON.parse(rawBody) }
    }
    return { valido: false, payload: null }
  }

  const { createHmac, timingSafeEqual } = await import("crypto")
  const esperado = createHmac("sha256", segredo).update(rawBody).digest("hex")

  const valido = timingSafeEqual(
    Buffer.from(assinatura, "hex"),
    Buffer.from(esperado, "hex"),
  )

  return { valido, payload: valido ? JSON.parse(rawBody) : null }
}
