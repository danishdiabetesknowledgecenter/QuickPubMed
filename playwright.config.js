import { defineConfig, devices } from "@playwright/test";

const e2eBase = process.env.MUGIN_E2E_BASE || "http://localhost:5174";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: e2eBase,
    trace: "off",
    screenshot: "off",
  },
  // Local runs keep using a server you already started. CI starts Vite itself.
  ...(process.env.CI
    ? {
        webServer: {
          command: "npm run dev -- --host 127.0.0.1 --port 5174 --strictPort",
          url: e2eBase,
          timeout: 120_000,
        },
      }
    : {}),
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
