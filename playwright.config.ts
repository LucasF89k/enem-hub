import { defineConfig, devices } from "@playwright/test"

/**
 * Configuracao dos testes E2E.
 *
 * O app e usado quase sempre no celular, entao os testes rodam num viewport
 * de smartphone. Print, video e trace ficam guardados so quando um teste
 * falha: e o que serve de evidencia na hora de investigar.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // os testes compartilham o mesmo banco
  workers: 1,
  retries: 1, // uma repeticao cobre lentidao pontual de rede
  timeout: 60_000,
  expect: { timeout: 15_000 },

  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },

  projects: [
    {
      // Chromium com viewport de celular. O plano de teste ja previa rodar
      // num navegador so; o iPhone 13 do Playwright usa WebKit, que exigiria
      // baixar outro navegador sem ganho pro que esta sendo testado.
      name: "mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
})
