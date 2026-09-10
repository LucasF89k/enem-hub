import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    // Só os testes unitários e de API. Os E2E ficam em e2e/*.spec.ts e rodam
    // pelo Playwright, que tem API própria.
    include: ["src/**/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**"],
    pool: "threads",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/lib/**/*.ts"],
    },
  },
})
