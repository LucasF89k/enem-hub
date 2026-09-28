import { test, expect, type Page } from "@playwright/test"

/**
 * Testes E2E dos direitos de privacidade (LGPD) pela interface.
 *
 * Valida que a tela de Configurações expõe "Baixar meus dados" e "Excluir
 * minha conta", e que a exportação realmente entrega um arquivo.
 *
 * CUIDADO DELIBERADO: NENHUM teste aqui conclui a exclusão da conta. O login
 * de teste é o mesmo dos outros arquivos E2E; apagá-lo derrubaria a suíte
 * inteira. O teste de exclusão só chega até a tela de confirmação e para,
 * verificando que o botão final exige senha e a palavra EXCLUIR, sem clicar
 * no "Excluir para sempre".
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

test("CTE-16: Configurações mostra os direitos de privacidade da LGPD", async ({
  page,
}) => {
  await entrar(page)
  await page.goto("/profile/settings")

  await expect(page.getByText("Baixar meus dados").first()).toBeVisible()
  await expect(page.getByText("Excluir minha conta").first()).toBeVisible()
})

test("CTE-17: exportar dados pede senha e entrega um arquivo JSON", async ({
  page,
}) => {
  await entrar(page)
  await page.goto("/profile/settings")

  // Abre o formulário de exportação.
  await page.getByRole("button", { name: /baixar meus dados/i }).first().click()

  // Confirma a senha e dispara o download.
  await page.getByLabel(/confirme sua senha/i).fill(USUARIO.senha)

  const downloadPromise = page.waitForEvent("download", { timeout: 30_000 })
  await page.getByRole("button", { name: /^baixar$/i }).click()

  const download = await downloadPromise
  // O arquivo tem o nome padrão da exportação e é um JSON.
  expect(download.suggestedFilename()).toMatch(/meus-dados-vion.*\.json$/)
})

test("CTE-18: excluir conta exige senha e a palavra EXCLUIR (sem concluir)", async ({
  page,
}) => {
  await entrar(page)
  await page.goto("/profile/settings")

  // Abre o formulário de exclusão.
  await page.getByRole("button", { name: /excluir minha conta/i }).first().click()

  // A tela de confirmação pede senha e a digitação de EXCLUIR: os dois campos
  // têm que estar presentes. NÃO preenchemos nem clicamos no botão final,
  // pra não apagar a conta de teste.
  await expect(page.getByLabel(/confirme sua senha/i)).toBeVisible()
  await expect(page.getByText(/digite EXCLUIR para confirmar/i)).toBeVisible()
  await expect(
    page.getByRole("button", { name: /excluir para sempre/i }),
  ).toBeVisible()
})
