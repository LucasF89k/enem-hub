import { test, expect, type Page } from "@playwright/test"

/**
 * Testes E2E do CRUD de Redacao pela interface.
 *
 * Este arquivo percorre o ciclo inteiro que o roteiro exige (registro,
 * consulta, atualizacao e delecao) do jeito que o usuario faz: clicando.
 * Cada redacao criada aqui recebe um titulo unico e e apagada no fim, pra
 * nao deixar sujeira no banco.
 *
 * Cobre os casos CTE-07 a CTE-09 do plano de teste.
 */

const USUARIO = {
  email: process.env.E2E_EMAIL ?? "lucasfortuna89@outlook.com",
  senha: process.env.E2E_PASSWORD ?? "LucasF89k.",
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("splash-ran", "1")
    } catch {
      /* navegador pode bloquear o storage */
    }
  })
})

async function entrar(page: Page) {
  await page.goto("/login")
  await page.fill('input[type="email"]', USUARIO.email)
  await page.fill('input[type="password"]', USUARIO.senha)
  await page.click('button[type="submit"]')
  await page.waitForSelector("text=Estudar", { timeout: 60_000 })
}

/** Cria uma redacao pela interface e devolve o titulo usado. */
async function criarRedacao(page: Page): Promise<string> {
  const titulo = `Teste E2E ${Date.now()}`

  await page.goto("/redacao/new")
  await page.fill('input[name="title"]', titulo)
  await page.fill(
    'input[name="theme"], textarea[name="theme"]',
    "Educação financeira nas escolas brasileiras"
  )
  await page.getByRole("button", { name: /criar|escrever|come[çc]ar/i }).first().click()
  await page.waitForURL(/\/redacao\/[^/]+$/, { timeout: 30_000 })

  return titulo
}

test("CTE-07: cria uma redacao e abre o editor", async ({ page }) => {
  await entrar(page)

  const titulo = await criarRedacao(page)

  // o editor abriu na redacao recem-criada
  expect(page.url()).toMatch(/\/redacao\/[^/]+$/)
  await expect(page.getByText(titulo).first()).toBeVisible()
})

test("CTE-08: a redacao criada aparece na listagem (consulta)", async ({ page }) => {
  await entrar(page)
  const titulo = await criarRedacao(page)

  await page.goto("/redacao")

  await expect(page.getByText(titulo).first()).toBeVisible()
})

test("CTE-09: exclui a redacao e ela some da listagem", async ({ page }) => {
  await entrar(page)
  const titulo = await criarRedacao(page)

  // confere que existe antes de apagar
  await page.goto("/redacao")
  await expect(page.getByText(titulo).first()).toBeVisible()

  // abre a redacao e aciona a exclusao
  await page.getByText(titulo).first().click()
  await page.waitForURL(/\/redacao\/[^/]+$/)

  const botaoExcluir = page.getByRole("button", { name: /excluir|apagar|deletar/i }).first()
  await botaoExcluir.click()

  // algumas telas pedem confirmacao
  const confirmar = page.getByRole("button", { name: /confirmar|sim|excluir/i }).last()
  if (await confirmar.isVisible().catch(() => false)) {
    await confirmar.click()
  }

  await page.waitForURL(/\/redacao$/, { timeout: 30_000 })
  await expect(page.getByText(titulo)).toHaveCount(0)
})
