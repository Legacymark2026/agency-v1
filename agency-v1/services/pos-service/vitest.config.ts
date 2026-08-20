import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/tests/integration/**",
      "**/tests/e2e/**",
      "**/tests/unit/**"
    ]
  }
});
