/**
 * Testes de API das Server Actions de autenticacao.
 *
 * O banco (Prisma), o NextAuth e o envio de e-mail sao substituidos por mock,
 * entao cada cenario ("e-mail ja existe", "token expirado") acontece sempre do
 * mesmo jeito, sem depender de dado real.
 *
 * Cobre os casos CTA-01 a CTA-12 do plano de teste.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * O next-auth real puxa "next/server", que o Vitest nao resolve fora do
 * runtime do Next. Como aqui so precisamos que o AuthError seja reconhecido
 * pelo instanceof da action, uma classe equivalente resolve. Precisa vir de
 * vi.hoisted porque o vi.mock e icado pro topo do arquivo.
 */
const { AuthError } = vi.hoisted(() => {
  class AuthError extends Error {
    type: string
    constructor(msg: string) {
      super(msg)
      this.name = "AuthError"
      this.type = "CredentialsSignin"
    }
  }
  return { AuthError }
})

const dbMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  passwordResetToken: { findUnique: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
}))
const signInMock = vi.hoisted(() => vi.fn())
const sendEmailMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/db", () => ({ db: dbMock }))
vi.mock("@/lib/auth", () => ({ signIn: signInMock, signOut: vi.fn(), auth: vi.fn() }))
vi.mock("next-auth", () => ({ AuthError }))
vi.mock("@/lib/email", () => ({
  sendEmail: sendEmailMock,
  passwordResetEmail: () => "<html></html>",
}))

import { register, login, requestPasswordReset, resetPassword } from "./auth.actions"

const VALIDO = {
  name: "Ana",
  email: "ana@teste.com",
  password: "Senha123",
  confirmPassword: "Senha123",
}

beforeEach(() => {
  vi.clearAllMocks()
  // por padrao o signIn redireciona, que e o comportamento normal do NextAuth
  signInMock.mockRejectedValue(Object.assign(new Error("NEXT_REDIRECT"), {
    digest: "NEXT_REDIRECT",
  }))
})

describe("register (CTA-01 a CTA-03)", () => {
  it("CTA-01: cria o usuario com senha protegida e o perfil junto", async () => {
    dbMock.user.findUnique.mockResolvedValue(null)
    dbMock.user.create.mockResolvedValue({ id: "u1" })

    await register(VALIDO).catch(() => {}) // o signIn no fim redireciona

    expect(dbMock.user.create).toHaveBeenCalledTimes(1)
    const dados = dbMock.user.create.mock.calls[0][0].data
    expect(dados.email).toBe("ana@teste.com")
    expect(dados.password).not.toBe("Senha123") // esta com hash
    expect(dados.password.startsWith("$2")).toBe(true) // formato do bcrypt
    expect(dados.profile.create).toBeTruthy()
  })

  it("CTA-02: recusa e-mail que ja existe e nao cria nada", async () => {
    dbMock.user.findUnique.mockResolvedValue({ id: "existente" })

    const r = await register(VALIDO)

    expect(r).toEqual({ error: "Este email já está em uso" })
    expect(dbMock.user.create).not.toHaveBeenCalled()
  })

  it("CTA-03: senha fraca falha na validacao, sem consultar o banco", async () => {
    const r = await register({ ...VALIDO, password: "fraca", confirmPassword: "fraca" })

    expect(r?.error).toBeTruthy()
    expect(dbMock.user.findUnique).not.toHaveBeenCalled()
    expect(dbMock.user.create).not.toHaveBeenCalled()
  })

  it("CTA-03b: senhas diferentes sao recusadas", async () => {
    const r = await register({ ...VALIDO, confirmPassword: "Outra123" })

    expect(r?.error).toBe("As senhas não coincidem")
    expect(dbMock.user.create).not.toHaveBeenCalled()
  })
})

describe("login (CTA-04 a CTA-06)", () => {
  it("CTA-04: credenciais certas chamam o signIn com destino /dashboard", async () => {
    await login({ email: "user@teste.com", password: "Senha123" }).catch(() => {})

    expect(signInMock).toHaveBeenCalledWith("credentials", {
      email: "user@teste.com",
      password: "Senha123",
      redirectTo: "/dashboard",
    })
  })

  it("CTA-05: credenciais erradas devolvem mensagem amigavel", async () => {
    const erro = new AuthError("credenciais")
    erro.type = "CredentialsSignin"
    signInMock.mockRejectedValue(erro)

    const r = await login({ email: "user@teste.com", password: "errada" })

    expect(r).toEqual({ error: "Email ou senha incorretos" })
  })

  it("CTA-06: e-mail malformado para na validacao, sem chamar o signIn", async () => {
    const r = await login({ email: "invalido", password: "123" })

    expect(r).toEqual({ error: "Email inválido" })
    expect(signInMock).not.toHaveBeenCalled()
  })

  it("respeita a URL de retorno quando ela e informada", async () => {
    await login({
      email: "user@teste.com",
      password: "Senha123",
      callbackUrl: "/planner",
    }).catch(() => {})

    expect(signInMock.mock.calls[0][1].redirectTo).toBe("/planner")
  })
})

describe("requestPasswordReset (CTA-07 a CTA-09)", () => {
  it("CTA-07: e-mail existente gera token de 1h e dispara o envio", async () => {
    dbMock.user.findUnique.mockResolvedValue({ name: "Ana" })
    dbMock.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 })
    dbMock.passwordResetToken.create.mockResolvedValue({})
    sendEmailMock.mockResolvedValue(undefined)

    const antes = Date.now()
    const r = await requestPasswordReset("user@teste.com")

    expect(r).toEqual({ success: true })
    expect(dbMock.passwordResetToken.deleteMany).toHaveBeenCalled()
    expect(dbMock.passwordResetToken.create).toHaveBeenCalledTimes(1)

    const { expires, token } = dbMock.passwordResetToken.create.mock.calls[0][0].data
    const umaHora = 60 * 60 * 1000
    expect(expires.getTime() - antes).toBeGreaterThan(umaHora - 5000)
    expect(expires.getTime() - antes).toBeLessThan(umaHora + 5000)
    expect(token).toHaveLength(64) // 32 bytes em hexadecimal

    expect(sendEmailMock).toHaveBeenCalledTimes(1)
    expect(sendEmailMock.mock.calls[0][0].to).toBe("user@teste.com")
  })

  it("CTA-08: e-mail inexistente responde sucesso mas nao gera token nem envia", async () => {
    dbMock.user.findUnique.mockResolvedValue(null)

    const r = await requestPasswordReset("naoexiste@teste.com")

    // responde sucesso de proposito, pra nao revelar se a conta existe
    expect(r).toEqual({ success: true })
    expect(dbMock.passwordResetToken.create).not.toHaveBeenCalled()
    expect(sendEmailMock).not.toHaveBeenCalled()
  })

  it("CTA-09: entrada sem arroba e recusada antes de consultar o banco", async () => {
    const r = await requestPasswordReset("texto-qualquer")

    expect(r).toEqual({ success: false, error: "E-mail inválido" })
    expect(dbMock.user.findUnique).not.toHaveBeenCalled()
  })

  it("normaliza o e-mail para minusculas e sem espaco", async () => {
    dbMock.user.findUnique.mockResolvedValue(null)

    await requestPasswordReset("  USER@TESTE.COM  ")

    expect(dbMock.user.findUnique.mock.calls[0][0].where.email).toBe("user@teste.com")
  })
})

describe("resetPassword (CTA-10 a CTA-12)", () => {
  it("CTA-10: token valido troca a senha com hash e invalida o token", async () => {
    dbMock.passwordResetToken.findUnique.mockResolvedValue({
      email: "user@teste.com",
      token: "token-valido",
      expires: new Date(Date.now() + 30 * 60 * 1000),
    })
    dbMock.user.update.mockResolvedValue({})
    dbMock.passwordResetToken.deleteMany.mockResolvedValue({ count: 1 })

    const r = await resetPassword("token-valido", "novaSenha1")

    expect(r).toEqual({ success: true })
    const nova = dbMock.user.update.mock.calls[0][0].data.password
    expect(nova).not.toBe("novaSenha1")
    expect(nova.startsWith("$2")).toBe(true)
    expect(dbMock.passwordResetToken.deleteMany).toHaveBeenCalled()
  })

  it("CTA-11: token expirado nao troca a senha", async () => {
    dbMock.passwordResetToken.findUnique.mockResolvedValue({
      email: "user@teste.com",
      token: "token-expirado",
      expires: new Date(Date.now() - 60 * 1000),
    })

    const r = await resetPassword("token-expirado", "novaSenha1")

    expect(r).toEqual({
      success: false,
      error: "Link expirado ou inválido. Peça um novo.",
    })
    expect(dbMock.user.update).not.toHaveBeenCalled()
  })

  it("CTA-11b: token inexistente e recusado", async () => {
    dbMock.passwordResetToken.findUnique.mockResolvedValue(null)

    const r = await resetPassword("nao-existe", "novaSenha1")

    expect(r.success).toBe(false)
    expect(dbMock.user.update).not.toHaveBeenCalled()
  })

  it("CTA-12: senha com menos de 6 caracteres e recusada", async () => {
    const r = await resetPassword("qualquer", "123")

    expect(r).toEqual({
      success: false,
      error: "A senha deve ter ao menos 6 caracteres",
    })
    expect(dbMock.passwordResetToken.findUnique).not.toHaveBeenCalled()
  })

  it("token vazio e recusado", async () => {
    const r = await resetPassword("", "novaSenha1")

    expect(r).toEqual({ success: false, error: "Link inválido" })
  })
})
