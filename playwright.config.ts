import { defineConfig, devices } from "@playwright/test";

/**
 * E2E configuration.
 * The app must be running before tests execute (web server auto-started below).
 * In CI, DATABASE_URL and SESSION_SECRET are injected by the workflow.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:5000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "node dist/index.cjs",
    url: "http://localhost:5000/health",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    env: {
      NODE_ENV: "test",
      PORT: "5000",
      DATABASE_URL: process.env.DATABASE_URL ?? "",
      SESSION_SECRET: process.env.SESSION_SECRET ?? "e2e-test-only-secret",
      // Disable Secure cookie flag for the plain-HTTP test server.
      // The production bundle hardcodes NODE_ENV=production at build time,
      // so this separate runtime escape hatch is required.
      SESSION_COOKIE_SECURE: "false",
    },
  },
});
