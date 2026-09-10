/**
 * Testes de API do CRUD de Redacao.
 *
 * O modulo de Redacao e o CRUD completo que o roteiro exige: consulta,
 * registro, atualizacao e delecao. Alem do caminho feliz, cada operacao e
 * testada contra acesso indevido, porque uma redacao so pode ser lida ou
 * alterada pelo proprio dono.
 *
 * Cobre os casos CTA-15 a CTA-20 do plano de teste.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

const dbMock = vi.hoisted(() => ({
  essay: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
}))
const authMock = vi.hoisted(() => vi.fn())
const redirectMock = vi.hoisted(() =>
  vi.fn((url: string) => {
    // o redirect do Next lanca uma excecao especial pra interromper a acao
    throw Object.assign(new Error("NEXT_REDIRECT"), { digest: `NEXT_REDIRECT;${url}` })
  })
)
const revalidateMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/db", () => ({ db: dbMock }))
vi.mock("@/lib/auth", () => ({ auth: authMock }))
vi.mock("next/navigation", () => ({ redirect: redirectMock }))
vi.mock("next/cache", () => ({ revalidatePath: revalidateMock }))
vi.mock("@/lib/mimo", () => ({ generateMimoJSON: vi.fn() }))
vi.mock("@/lib/xp", () => ({ awardXP: vi.fn() }))

import { createEssay, saveEssayBody, deleteEssay } from "./essay.actions"

const SESSAO = { user: { id: "u1" } }

function formulario(campos: Record<string, string>) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(campos)) fd.set(k, v)
  return fd
}

beforeEach(() => {
  vi.clearAllMocks()
  authMock.mockResolvedValue(SESSAO)
})

describe("createEssay: registro (CTA-15 a CTA-17)", () => {
  it("CTA-15: cria a redacao com corpo vazio e leva pro editor", async () => {
    dbMock.essay.create.mockResolvedValue({ id: "e1" })

    await expect(
      createEssay(formulario({
        theme: "Os desafios da mobilidade urbana no Brasil",
        title: "Redação 1",
      }))
    ).rejects.toThrow("NEXT_REDIRECT")

    expect(dbMock.essay.create).toHaveBeenCalledTimes(1)
    const dados = dbMock.essay.create.mock.calls[0][0].data
    expect(dados.userId).toBe("u1")
    expect(dados.theme).toBe("Os desafios da mobilidade urbana no Brasil")
    expect(dados.title).toBe("Redação 1")
    expect(dados.body).toBe("")
    expect(redirectMock).toHaveBeenCalledWith("/redacao/e1")
  })

  it("CTA-16: sem sessao lanca Unauthorized e nao cria nada", async () => {
    authMock.mockResolvedValue(null)

    await expect(
      createEssay(formulario({ theme: "Tema válido aqui", title: "Redação 1" }))
    ).rejects.toThrow("Unauthorized")

    expect(dbMock.essay.create).not.toHaveBeenCalled()
  })

  it("CTA-17: titulo curto demais e recusado", async () => {
    await expect(
      createEssay(formulario({ theme: "Tema válido aqui", title: "ab" }))
    ).rejects.toThrow("Dados inválidos")

    expect(dbMock.essay.create).not.toHaveBeenCalled()
  })

  it("CTA-17b: tema curto demais e recusado", async () => {
    await expect(
      createEssay(formulario({ theme: "abc", title: "Título válido" }))
    ).rejects.toThrow("Dados inválidos")

    expect(dbMock.essay.create).not.toHaveBeenCalled()
  })
})

describe("saveEssayBody: atualizacao (CTA-18 e CTA-19)", () => {
  it("CTA-18: o dono salva o texto com a contagem de palavras e linhas", async () => {
    dbMock.essay.findFirst.mockResolvedValue({ id: "e1" })
    dbMock.essay.update.mockResolvedValue({})

    const r = await saveEssayBody("e1", "Texto da redação...", 42, 7)

    expect(r).toEqual({ saved: true })
    const dados = dbMock.essay.update.mock.calls[0][0].data
    expect(dados.body).toBe("Texto da redação...")
    expect(dados.wordCount).toBe(42)
    expect(dados.lineCount).toBe(7)
  })

  it("CTA-19: redacao de outro usuario nao e alterada", async () => {
    // a busca filtra por userId, entao nao encontra e devolve null
    dbMock.essay.findFirst.mockResolvedValue(null)

    const r = await saveEssayBody("e-de-outro", "texto", 10, 2)

    expect(r).toEqual({ saved: false })
    expect(dbMock.essay.update).not.toHaveBeenCalled()
  })

  it("a consulta filtra pelo usuario da sessao", async () => {
    dbMock.essay.findFirst.mockResolvedValue({ id: "e1" })
    dbMock.essay.update.mockResolvedValue({})

    await saveEssayBody("e1", "texto", 1, 1)

    expect(dbMock.essay.findFirst.mock.calls[0][0].where).toEqual({
      id: "e1",
      userId: "u1",
    })
  })

  it("sem sessao lanca Unauthorized", async () => {
    authMock.mockResolvedValue(null)

    await expect(saveEssayBody("e1", "texto", 1, 1)).rejects.toThrow("Unauthorized")
    expect(dbMock.essay.update).not.toHaveBeenCalled()
  })
})

describe("deleteEssay: delecao (CTA-20)", () => {
  it("CTA-20: exclui a redacao filtrando pelo dono e volta pra listagem", async () => {
    dbMock.essay.deleteMany.mockResolvedValue({ count: 1 })

    await expect(deleteEssay("e1")).rejects.toThrow("NEXT_REDIRECT")

    expect(dbMock.essay.deleteMany).toHaveBeenCalledWith({
      where: { id: "e1", userId: "u1" },
    })
    expect(revalidateMock).toHaveBeenCalledWith("/redacao")
    expect(redirectMock).toHaveBeenCalledWith("/redacao")
  })

  it("nao apaga redacao de outro usuario, porque o filtro inclui o userId", async () => {
    dbMock.essay.deleteMany.mockResolvedValue({ count: 0 })

    await expect(deleteEssay("e-de-outro")).rejects.toThrow("NEXT_REDIRECT")

    // o filtro por userId e o que protege: nada e apagado
    expect(dbMock.essay.deleteMany.mock.calls[0][0].where.userId).toBe("u1")
  })

  it("sem sessao lanca Unauthorized e nao apaga nada", async () => {
    authMock.mockResolvedValue(null)

    await expect(deleteEssay("e1")).rejects.toThrow("Unauthorized")
    expect(dbMock.essay.deleteMany).not.toHaveBeenCalled()
  })
})
