import { test, expect } from "@playwright/test";
import { postWithCsrf, uniqueUsername } from "./support";

// Unique username per test run to avoid state collisions between reruns
const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "abs.sid";

test.describe("Authentication flows", () => {
  test("health endpoint is reachable", async ({ request }) => {
    const res = await request.get("/health");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe("ok");
  });

  test("unauthenticated root redirects to /auth", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/auth/);
    await expect(page.getByTestId("text-app-title")).toBeVisible();
  });

  test("register a new user and reach dashboard", async ({ page }) => {
    const username = uniqueUsername();
    await page.goto("/auth");

    // Switch to register tab
    await page.getByTestId("button-register-tab").click();

    await page.getByTestId("input-display-name").fill("E2E User");
    await page.getByTestId("input-username").fill(username);
    await page.getByTestId("input-password").fill("TestPass123!");

    // Wait for the register API response and the submit click simultaneously
    const [registerRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/auth/register")),
      page.getByTestId("button-auth-submit").click(),
    ]);
    expect(registerRes.status()).toBe(200);

    // Should land on dashboard — allow enough time for React Query to refetch /api/auth/me
    await expect(page).toHaveURL("/", { timeout: 10000 });
    await expect(page.getByTestId("text-dashboard-title")).toBeVisible();
  });

  test("login with valid credentials", async ({ page }) => {
    const username = uniqueUsername();

    // Register first via API
    await postWithCsrf(page.request, "/api/auth/register", {
      username,
      password: "TestPass123!",
      displayName: "E2E",
    });

    // Log out any existing session
    await postWithCsrf(page.request, "/api/auth/logout");

    await page.goto("/auth");
    await expect(page.getByTestId("button-login-tab")).toBeVisible();

    await page.getByTestId("input-username").fill(username);
    await page.getByTestId("input-password").fill("TestPass123!");

    const [loginRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/auth/login")),
      page.getByTestId("button-auth-submit").click(),
    ]);
    expect(loginRes.status()).toBe(200);

    await expect(page).toHaveURL("/", { timeout: 10000 });
    await expect(page.getByTestId("text-dashboard-title")).toBeVisible();
  });

  test("login with wrong password shows error", async ({ page }) => {
    const username = uniqueUsername();
    await postWithCsrf(page.request, "/api/auth/register", {
      username,
      password: "CorrectPass1!",
      displayName: "E2E",
    });
    await postWithCsrf(page.request, "/api/auth/logout");

    await page.goto("/auth");
    await page.getByTestId("input-username").fill(username);
    await page.getByTestId("input-password").fill("WrongPass999!");
    await page.getByTestId("button-auth-submit").click();

    await expect(page.getByTestId("text-auth-error")).toBeVisible();
    await expect(page).toHaveURL(/\/auth/);
  });

  test("logout button clears session and redirects to /auth", async ({
    page,
  }) => {
    const username = uniqueUsername();
    // Register and verify session is working before navigating
    const regRes = await postWithCsrf(page.request, "/api/auth/register", {
      username,
      password: "TestPass123!",
      displayName: "E2E",
    });
    expect(regRes.ok()).toBeTruthy();

    // Confirm the session is recognised before navigating
    const meRes = await page.request.get("/api/auth/me");
    expect(meRes.ok()).toBeTruthy();

    // Navigate directly — session cookie shared with browser context
    await page.goto("/");
    await expect(page.getByTestId("text-dashboard-title")).toBeVisible({
      timeout: 10000,
    });

    await page.getByTestId("button-logout").click();
    await expect(page).toHaveURL(/\/auth/);
    await expect(page.getByTestId("input-username")).toBeVisible();

    const meResAfter = await page.request.get("/api/auth/me");
    expect(meResAfter.status()).toBe(401);
  });

  test("duplicate username registration returns error", async ({ page }) => {
    const username = uniqueUsername();
    await postWithCsrf(page.request, "/api/auth/register", {
      username,
      password: "TestPass123!",
      displayName: "First",
    });
    await postWithCsrf(page.request, "/api/auth/logout");

    await page.goto("/auth");
    await page.getByTestId("button-register-tab").click();
    await page.getByTestId("input-display-name").fill("Second");
    await page.getByTestId("input-username").fill(username);
    await page.getByTestId("input-password").fill("AnotherPass1!");
    await page.getByTestId("button-auth-submit").click();

    await expect(page.getByTestId("text-auth-error")).toBeVisible();
  });

  test("session cookie has httpOnly and sameSite flags", async ({ page }) => {
    const username = uniqueUsername();
    // Register via page.request and check that the session cookie is in the
    // browser's cookie jar with the expected security attributes.
    const res = await postWithCsrf(page.request, "/api/auth/register", {
      username,
      password: "TestPass123!",
      displayName: "E2E",
    });
    expect(res.ok()).toBeTruthy();

    // Playwright stores Set-Cookie into the browser context's jar — inspect it there
    const cookies = await page.context().cookies("http://localhost:5000");
    const sessionCookie = cookies.find((c) => c.name === sessionCookieName);
    expect(sessionCookie, "session cookie must exist").toBeTruthy();
    expect(sessionCookie?.httpOnly).toBe(true);
    // SameSite is stored as "Lax", "Strict", or "None" in Playwright's cookie model
    expect(sessionCookie?.sameSite).toBe("Lax");
  });

  test("auth rate limiter returns 429 after threshold", async ({ request }) => {
    // Fire 21 login attempts with a non-existent user from a fresh isolated
    // request context (separate IP-key bucket from page tests).
    const bogus = uniqueUsername();
    let lastStatus = 0;
    for (let i = 0; i < 21; i++) {
      const r = await postWithCsrf(request, "/api/auth/login", {
        username: bogus,
        password: "WrongPass1!",
      });
      lastStatus = r.status();
    }
    expect(lastStatus).toBe(429);
  });
});
