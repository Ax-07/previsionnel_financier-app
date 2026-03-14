import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/paie/**/*.ts", "src/lib/finance/**/*.ts"],
      exclude: [
        "src/lib/paie/**/__tests__/**",
        "src/lib/finance/**/__tests__/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
