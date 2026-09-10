import { test, expect } from "@playwright/test"

/**
 * Testes E2E de autenticacao e controle de acesso.
 *
 * Aqui nada e mockado: o navegador de verdade preenche formulario, clica e
 * navega, e o app conversa com o banco. E o teste mais proximo do que o
 * usuario faz.
 *
 * Cobre os casos CTE-01 a CTE-05 e CTE-10 do plano de teste.
 */

const USUARIO = {
  email: process.env.E2E_EMAIL ?? "lucasfortuna89@outlook.com",
  senha: process.env.E2E_PASSWORD ?? "LucasF89k.",
}

/**
 * A animacao de abertura cobre a tela por alguns segundos. Marcar que ela ja
 * rodou evita esperar por ela em cada teste.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("splash-ran", "1")
    } catch {
      /* navegador pode bloquear o storage */
    }
  })
})

async function entrar(page: import("@playwright/test").Page) {
  await page.goto("/login")
  await page.fill('input[type="email"]', USUARIO.email)
  await page.fill('input[type="password"]', USUARIO.senha)
  await page.click('button[type="submit"]')
  // a barra de navegacao do app so existe depois de autenticar
  await page.waitForSelector("text=Estudar", { timeout: 60_000 })
}

test("CTE-01: a tela de cadastro pede nome, e-mail e confirmacao de senha", async ({ page }) => {
  await page.goto("/register")

  await expect(page.locator('input[type="email"]')).toBeVisible()
  await expect(page.locator('input[type="password"]')).toHaveCount(2) // senha e confirmacao
  await expect(page.getByRole("button", { name: /criar conta/i })).toBeVisible()
})

test("CTE-02: cadastro com senha fraca mostra as regras de senha", async ({ page }) => {
  await page.goto("/register")

  await page.fill('input[name="name"]', "Usuário Teste")
  await page.fill('input[type="email"]', `teste+${Date.now()}@teste.com`)
  await page.locator('input[type="password"]').first().fill("fraca")

  // a tela lista os requisitos assim que a pessoa comeca a digitar a senha
  await expect(page.getByText(/8 caracteres/i)).toBeVisible()
  await expect(page.getByText(/mai[úu]scula/i)).toBeVisible()
  await expect(page.getByText(/n[úu]mero/i)).toBeVisible()
})

test("CTE-03: login com credenciais validas da acesso ao painel", async ({ page }) => {
  await entrar(page)

  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByText(/meta de estudo hoje/i)).toBeVisible()
})

test("CTE-04: login com senha errada mostra mensagem e nao autentica", async ({ page }) => {
  await page.goto("/login")
  await page.fill('input[type="email"]', USUARIO.email)
  await page.fill('input[type="password"]', "senhaErrada123")
  await page.click('button[type="submit"]')

  await expect(page.getByText(/email ou senha incorretos/i)).toBeVisible()
  await expect(page).toHaveURL(/\/login/)
})

test("CTE-05: rota protegida sem sessao manda pro login", async ({ page }) => {
  await page.goto("/dashboard")

  await expect(page).toHaveURL(/\/login/)
})

test("CTE-05b: outras rotas protegidas tambem exigem sessao", async ({ page }) => {
  for (const rota of ["/redacao", "/planner", "/conquistas"]) {
    await page.goto(rota)
    await expect(page).toHaveURL(/\/login/)
  }
})
