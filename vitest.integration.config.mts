import path from "node:path";
import { defineConfig } from "vitest/config";

// Integration tests run against a real PostgreSQL database (DATABASE_URL_TEST).
// The global setup resets that database with the project migrations first.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    globalSetup: ["tests/integration/global-setup.ts"],
    setupFiles: ["tests/integration/env.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
