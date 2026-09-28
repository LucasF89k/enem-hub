import { test, expect, type Page } from "@playwright/test"

/**
 * Testes E2E do fluxo de flashcards pela interface.
 *
 * A revisão em si (avaliar card com Errei/Difícil/Bom/Fácil) é por gesto de
 * swipe, que é frágil de automatizar e não vale o risco de teste
 * quebradiço; a lógica do SM-2 já tem cobertura unitária em src/lib/sm2.
 * Aqui o E2E cobre o que o unitário não vê: a navegação real até a revisão,
 * a tela de revisão carregando com o conteúdo esperado, e o comportamento
 * quando não há cards a revisar (redireciona de volta).
 *
 * Complementa os testes unitários da Sessão 21 (parte 1).
 */

const USUARIO = {
  email: process.env.E2E_EMAIL ?? "lucasfortuna89@outlook.com",
  senha: process.env.E2E_PASSWORD ?? "LucasF89k.",
}

test.beforeEach(async ({ page }) => {
  // A animação de abertura cobre a tela; marcar que já rodou evita esperá-la.
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

test("CTE-12: a tela de flashcards mostra a ação de revisar", async ({ page }) => {
  await entrar(page)
  await page.goto("/flashcards")

  // O botão principal de revisão está sempre na página.
  await expect(
    page.getByRole("link", { name: /revisar tudo agora/i }),
  ).toBeVisible()
})

test("CTE-13: iniciar a revisão abre a tela de card ou volta se não há o que revisar", async ({
  page,
}) => {
  await entrar(page)
  await page.goto("/flashcards/review")

  // Dois desfechos legítimos e ambos corretos:
  //  - há cards: a tela de revisão mostra "Toque para ver a resposta";
  //  - não há: a página redireciona de volta pra /flashcards.
  // O teste passa em qualquer um, sem depender do estado do banco.
  await page.waitForLoadState("networkidle")

  const naRevisao = await page
    .getByText(/toque para ver a resposta/i)
    .first()
    .isVisible()
    .catch(() => false)

  if (naRevisao) {
    expect(page.url()).toContain("/flashcards/review")
  } else {
    await expect(page).toHaveURL(/\/flashcards$/)
  }
})
