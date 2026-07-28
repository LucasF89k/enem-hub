/** Envio de e-mail transacional via Resend (REST API — sem dependência extra). */
const RESEND_ENDPOINT = "https://api.resend.com/emails"

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error("RESEND_API_KEY não configurada")
  const from = process.env.EMAIL_FROM || "Vion <onboarding@resend.dev>"

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Resend ${res.status}: ${body}`)
  }
}

export function passwordResetEmail(name: string, link: string): string {
  return `
  <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a">
    <h2 style="color:#8B5CF6">Vion — Redefinir senha</h2>
    <p>Olá${name ? `, ${name}` : ""}!</p>
    <p>Você pediu para redefinir sua senha. Clique no botão abaixo (o link vale por 1 hora):</p>
    <p style="margin:24px 0">
      <a href="${link}" style="background:#8B5CF6;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;display:inline-block">
        Redefinir senha
      </a>
    </p>
    <p style="color:#666;font-size:13px">Se você não pediu isso, pode ignorar este e-mail com segurança.</p>
    <p style="color:#999;font-size:12px;word-break:break-all">Ou copie e cole: ${link}</p>
  </div>`
}
