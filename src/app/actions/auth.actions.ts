"use server"

import { signIn, signOut } from "@/lib/auth"
import { db } from "@/lib/db"
import { registerSchema, loginSchema } from "@/lib/validations"
import bcrypt from "bcryptjs"
import { AuthError } from "next-auth"
import { randomBytes } from "crypto"
import { sendEmail, passwordResetEmail } from "@/lib/email"
import { rateLimit, ipDaRequisicao } from "@/lib/rate-limit"

export async function register(data: {
  name: string
  email: string
  password: string
  confirmPassword: string
}) {
  const validated = registerSchema.safeParse(data)

  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  // Trava criação de contas em massa a partir do mesmo IP.
  const ipReg = await ipDaRequisicao()
  const limiteReg = await rateLimit("register", ipReg, 5, 60 * 60 * 1000)
  if (!limiteReg.allowed) {
    return { error: "Muitas contas criadas. Tente novamente mais tarde." }
  }

  const { name, email, password } = validated.data

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return { error: "Este email já está em uso" }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      profile: {
        create: { theme: "dark" },
      },
    },
  })

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/onboarding",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Erro ao fazer login automático, entre manualmente" }
    }
    throw error // re-throw NEXT_REDIRECT
  }
}

export async function login(data: {
  email: string
  password: string
  callbackUrl?: string
}) {
  const validated = loginSchema.safeParse(data)

  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  // Trava de brute force: no máximo 8 tentativas por IP a cada 5 minutos. É
  // folgado pra quem errou a senha algumas vezes e apertado pra um script
  // que testa milhares. A mensagem não diz se o e-mail existe, mantendo o
  // padrão de não revelar contas.
  const ip = await ipDaRequisicao()
  const limite = await rateLimit("login", ip, 8, 5 * 60 * 1000)
  if (!limite.allowed) {
    return {
      error: `Muitas tentativas. Tente de novo em ${limite.retryAfter} segundos.`,
    }
  }

  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirectTo: data.callbackUrl || "/dashboard",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Email ou senha incorretos" }
        default:
          return { error: "Algo deu errado, tente novamente" }
      }
    }
    throw error // re-throw NEXT_REDIRECT
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" })
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

/** Solicita reset de senha: gera token e envia e-mail. Não revela se o e-mail existe. */
export async function requestPasswordReset(
  email: string,
): Promise<{ success: boolean; error?: string }> {
  const normalized = (email || "").trim().toLowerCase()
  if (!normalized || !normalized.includes("@")) {
    return { success: false, error: "E-mail inválido" }
  }

  // Sem isto, dá pra spammar e-mails de reset pra uma vítima e sondar quais
  // contas existem pelo tempo de resposta. Limita por IP. A resposta segue
  // sendo "sucesso" mesmo quando o limite estoura, pra não abrir outro canal
  // de enumeração; só não dispara mais e-mails.
  const ipReset = await ipDaRequisicao()
  const limiteReset = await rateLimit("reset", ipReset, 5, 60 * 60 * 1000)
  if (!limiteReset.allowed) {
    return { success: true }
  }

  const user = await db.user.findUnique({
    where: { email: normalized },
    select: { name: true },
  })

  // Só envia se existir, mas responde sempre sucesso (privacidade).
  if (user) {
    const token = randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1h
    await db.passwordResetToken.deleteMany({ where: { email: normalized } })
    await db.passwordResetToken.create({ data: { email: normalized, token, expires } })

    const link = `${APP_URL}/reset-password?token=${token}`
    try {
      await sendEmail({
        to: normalized,
        subject: "Redefinir sua senha · Vion",
        html: passwordResetEmail(user.name ?? "", link),
      })
    } catch (e) {
      console.error("[reset] falha ao enviar e-mail:", e)
      return { success: false, error: "Não foi possível enviar o e-mail. Tente novamente." }
    }
  }

  return { success: true }
}

/** Redefine a senha a partir de um token válido. */
export async function resetPassword(
  token: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  if (!token) return { success: false, error: "Link inválido" }
  if (!password || password.length < 6) {
    return { success: false, error: "A senha deve ter ao menos 6 caracteres" }
  }

  const record = await db.passwordResetToken.findUnique({ where: { token } })
  if (!record || record.expires < new Date()) {
    return { success: false, error: "Link expirado ou inválido. Peça um novo." }
  }

  const hashed = await bcrypt.hash(password, 10)
  await db.user.update({
    where: { email: record.email },
    data: { password: hashed },
  })
  await db.passwordResetToken.deleteMany({ where: { email: record.email } })

  return { success: true }
}
