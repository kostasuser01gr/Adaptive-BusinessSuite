import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env.CI);
const useProductionServer =
  isCI || process.env.PLAYWRIGHT_USE_PROD_SERVER === "1";

const sessionSecret =
  process.env.SESSION_SECRET ??
  "playwright-local-session-secret-not-for-production-0001";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5000",
    trace: "on-first-retry",
  },
  projects: isCI
    ? [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
    : [
        { name: "chromium", use: { ...devices["Desktop Chrome"] } },
        { name: "firefox", use: { ...devices["Desktop Firefox"] } },
        { name: "webkit", use: { ...devices["Desktop Safari"] } },
      ],
  webServer: {
    command: useProductionServer ? "npm run start:e2e" : "npm run dev",
    port: 5000,
    reuseExistingServer: !useProductionServer,
    timeout: 120 * 1000,
    env: {
      PORT: "5000",
      DATABASE_URL: process.env.DATABASE_URL ?? "",
      DATABASE_SSL_MODE: process.env.DATABASE_SSL_MODE ?? (isCI ? "disable" : "auto"),
      SESSION_SECRET: sessionSecret,
      SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME ?? "abs.sid",
      SESSION_COOKIE_SAME_SITE: "lax",
      SESSION_COOKIE_SECURE: "false",
      AI_PROVIDER: "none",
    },
  },
});
