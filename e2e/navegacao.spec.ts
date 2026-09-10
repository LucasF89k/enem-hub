import { test, expect, type Page } from "@playwright/test"

/**
 * Testes E2E de navegacao pelo conteudo de estudo.
 *
 * Cobre os casos CTE-06 e CTE-11 do plano de teste.
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

test("CTE-06: navega de area ate disciplina no modulo Estudar", async ({ page }) => {
  await entrar(page)
  await page.goto("/study")

  // as quatro areas do ENEM aparecem na listagem
  await expect(page.getByText("Ciências da Natureza")).toBeVisible()
  await expect(page.getByText("Ciências Humanas")).toBeVisible()
  await expect(page.getByText("Linguagens e Códigos")).toBeVisible()
  await expect(page.getByText("Matemática")).toBeVisible()

  await page.getByText("Ciências da Natureza").first().click()
  await expect(page).toHaveURL(/\/study\/ciencias-natureza/)
})

test("CTE-11: a barra de navegacao leva aos modulos principais", async ({ page }) => {
  await entrar(page)

  const rotas: [string, RegExp][] = [
    ["Estudar", /\/study/],
    ["Plano", /\/planner/],
    ["Ranking", /\/ranking/],
    ["Perfil", /\/profile/],
  ]

  for (const [nome, url] of rotas) {
    await page.getByRole("link", { name: nome }).click()
    await expect(page).toHaveURL(url)
  }
})

test("o painel mostra a contagem regressiva e a trilha do usuario", async ({ page }) => {
  await entrar(page)

  await expect(page.getByText(/contagem para o enem/i)).toBeVisible()
  await expect(page.getByText(/trilha/i).first()).toBeVisible()
})
