import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/lib/checks/**/*.ts"],
      exclude: ["src/lib/checks/index.ts"],
    },
    include: ["src/**/*.test.ts"],
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: {
      "~lib": path.resolve(__dirname, "./src/lib"),
    },
  },
})
