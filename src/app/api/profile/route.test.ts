/**
 * Testes de API do endpoint HTTP GET /api/profile.
 *
 * Diferente das Server Actions, aqui o que se testa e a resposta HTTP de
 * verdade: o status e o corpo em JSON. Interessa tanto o caminho feliz quanto
 * o bloqueio de quem nao esta autenticado.
 *
 * Cobre os casos CTA-13 e CTA-14 do plano de teste.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

const dbMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  userProfile: { findUnique: vi.fn() },
}))
const authMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/db", () => ({ db: dbMock }))
vi.mock("@/lib/auth", () => ({ auth: authMock }))

import { GET } from "./route"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("GET /api/profile (CTA-13 e CTA-14)", () => {
  it("CTA-13: sem sessao responde 401 e nao consulta o banco", async () => {
    authMock.mockResolvedValue(null)

    const res = await GET()

    expect(res.status).toBe(401)
    expect(await res.text()).toBe("Unauthorized")
    expect(dbMock.user.findUnique).not.toHaveBeenCalled()
  })

  it("CTA-14: usuario sem perfil recebe os valores padrao da rota", async () => {
    authMock.mockResolvedValue({ user: { id: "u1" } })
    dbMock.user.findUnique.mockResolvedValue({ name: "Teste", email: "t@teste.com" })
    dbMock.userProfile.findUnique.mockResolvedValue(null)

    const res = await GET()
    const corpo = await res.json()

    expect(res.status).toBe(200)
    expect(corpo).toEqual({
      name: "Teste",
      email: "t@teste.com",
      targetScore: 950,
      targetCourse: "Medicina",
      targetInstitution: "",
      examDate: "",
      dailyStudyGoal: 120,
      theme: "dark",
    })
  })

  it("devolve os dados do perfil quando eles existem", async () => {
    const data = new Date("2026-11-08T00:00:00.000Z")
    authMock.mockResolvedValue({ user: { id: "u1" } })
    dbMock.user.findUnique.mockResolvedValue({ name: "Ana", email: "ana@teste.com" })
    dbMock.userProfile.findUnique.mockResolvedValue({
      targetScore: 850,
      targetCourse: "medicina",
      targetInstitution: "unicamp",
      examDate: data,
      dailyStudyGoal: 180,
      theme: "light",
    })

    const corpo = await (await GET()).json()

    expect(corpo.targetScore).toBe(850)
    expect(corpo.dailyStudyGoal).toBe(180)
    expect(corpo.theme).toBe("light")
    expect(corpo.examDate).toBe(data.toISOString())
  })

  it("consulta sempre o usuario da sessao, nunca um id vindo de fora", async () => {
    authMock.mockResolvedValue({ user: { id: "u-da-sessao" } })
    dbMock.user.findUnique.mockResolvedValue({ name: "X", email: "x@teste.com" })
    dbMock.userProfile.findUnique.mockResolvedValue(null)

    await GET()

    expect(dbMock.user.findUnique.mock.calls[0][0].where.id).toBe("u-da-sessao")
    expect(dbMock.userProfile.findUnique.mock.calls[0][0].where.userId).toBe("u-da-sessao")
  })
})
