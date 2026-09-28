import { test, expect, type Page } from "@playwright/test"

/**
 * Testes E2E do fluxo de simulados pela interface.
 *
 * Cobre a listagem e o início de uma tentativa. A resolução completa da
 * prova (responder todas as questões e finalizar) depende de haver
 * simulados cadastrados no banco e seria um teste longo e frágil; aqui o
 * foco é garantir que a lista carrega e que iniciar leva à tela de prova.
 * O teste é escrito pra passar tenha ou não simulados no banco.
 *
 * Complementa os testes unitários da Sessão 21 (parte 1).
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

test("CTE-14: a listagem de simulados carrega", async ({ page }) => {
  await entrar(page)
  await page.goto("/simulados")

  // O cabeçalho está sempre presente, com ou sem simulados cadastrados.
  await expect(page.getByRole("heading", { name: "Simulados" })).toBeVisible()

  // Ou há simulados na lista, ou o estado vazio explica que virão em breve.
  const temLista = await page
    .getByRole("link", { name: /iniciar|continuar|tentar novamente/i })
    .first()
    .isVisible()
    .catch(() => false)
  const vazio = await page
    .getByText(/nenhum simulado disponível/i)
    .isVisible()
    .catch(() => false)

  expect(temLista || vazio).toBeTruthy()
})

test("CTE-15: iniciar um simulado abre a tela de configuração da prova", async ({
  page,
}) => {
  await entrar(page)
  await page.goto("/simulados")

  const abrir = page
    .getByRole("link", { name: /iniciar|continuar|tentar novamente/i })
    .first()

  // Sem simulados no banco não há o que iniciar: encerra sem falhar, porque
  // a ausência de dados não é um defeito do fluxo.
  if (!(await abrir.isVisible().catch(() => false))) {
    test.skip(true, "Nenhum simulado cadastrado no banco de teste.")
    return
  }

  await abrir.click()
  await page.waitForURL(/\/simulados\/[^/]+$/, { timeout: 30_000 })

  // A tela de detalhe traz o botão que de fato começa a prova.
  await expect(
    page.getByRole("button", { name: /iniciar/i }).first(),
  ).toBeVisible()
})
