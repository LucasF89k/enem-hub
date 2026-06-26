"use server"

import { signIn, signOut } from "@/lib/auth"
import { db } from "@/lib/db"
import { registerSchema, loginSchema } from "@/lib/validations"
import bcrypt from "bcryptjs"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"

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
