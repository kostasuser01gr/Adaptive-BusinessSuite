import { expect, test } from "@playwright/test";

import { postWithCsrf, uniqueUsername } from "./support";

async function registerAndLogin(page: import("@playwright/test").Page) {
  const username = uniqueUsername();
  const response = await postWithCsrf(page.request, "/api/auth/register", {
    username,
    password: "TestPass123!",
    displayName: "Shell E2E",
  });

  expect(response.ok()).toBeTruthy();
  return username;
}

test.describe("Shell experience", () => {
  test("exposes install metadata and a deterministic install affordance", async ({
    page,
  }) => {
    await registerAndLogin(page);
    await page.goto("/");

    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      "href",
      "/manifest.webmanifest",
    );

    const manifestResponse = await page.request.get("/manifest.webmanifest");
    expect(manifestResponse.ok()).toBeTruthy();
    await expect(manifestResponse.json()).resolves.toMatchObject({
      id: "/",
      display: "standalone",
      shortcuts: expect.arrayContaining([
        expect.objectContaining({ url: "/" }),
        expect.objectContaining({ url: "/bookings" }),
        expect.objectContaining({ url: "/tasks" }),
        expect.objectContaining({ url: "/notes" }),
      ]),
    });

    const offlineResponse = await page.request.get("/offline.html");
    expect(offlineResponse.ok()).toBeTruthy();
    await expect(offlineResponse.text()).resolves.toContain(
      "Nexus OS is still available.",
    );

    const serviceWorkerResponse = await page.request.get("/sw.js");
    expect(serviceWorkerResponse.ok()).toBeTruthy();
    await expect(serviceWorkerResponse.text()).resolves.toContain(
      "nexus-shell-v2",
    );

    await page.evaluate(() => {
      const installEvent = new Event("beforeinstallprompt", {
        cancelable: true,
      });
      Object.defineProperties(installEvent, {
        prompt: {
          value: async () => undefined,
        },
        userChoice: {
          value: Promise.resolve({ outcome: "accepted", platform: "web" }),
        },
      });
      window.dispatchEvent(installEvent);
    });

    await expect(page.getByTestId("button-install-app")).toBeVisible();
    await page.getByTestId("button-install-app").click();
    await expect(page.getByTestId("badge-app-installed")).toBeVisible();
  });

  test("registers the service worker on the production shell", async ({
    page,
  }) => {
    const isProductionShellRun =
      process.env.CI === "1" ||
      process.env.CI === "true" ||
      process.env.PWA_PROD_E2E === "1";
    test.skip(!isProductionShellRun, "Requires the production server path");

    await registerAndLogin(page);
    await page.goto("/");

    await expect
      .poll(async () => {
        return page.evaluate(async () => {
          const registration = await navigator.serviceWorker.getRegistration(
            "/",
          );
          return (
            registration?.active?.scriptURL ??
            registration?.waiting?.scriptURL ??
            registration?.installing?.scriptURL ??
            null
          );
        });
      })
      .toContain("/sw.js");
  });

  test("surfaces unread notifications and can clear them from the shell", async ({
    page,
  }) => {
    const suffix = uniqueUsername().slice(-8);
    const plate = `NXS-${suffix.slice(-5).toUpperCase()}`;

    await registerAndLogin(page);

    const vehicleResponse = await postWithCsrf(page.request, "/api/vehicles", {
      make: "Tesla",
      model: `Model ${suffix.slice(0, 1).toUpperCase()}`,
      plate,
      dailyRate: "95",
      status: "available",
    });
    expect(vehicleResponse.ok()).toBeTruthy();
    const vehicle = await vehicleResponse.json();

    const customerResponse = await postWithCsrf(
      page.request,
      "/api/customers",
      {
        name: `Shell Customer ${suffix}`,
        email: `${suffix}@example.com`,
        phone: `555${suffix.slice(0, 4)}`,
      },
    );
    expect(customerResponse.ok()).toBeTruthy();
    const customer = await customerResponse.json();

    const bookingResponse = await postWithCsrf(page.request, "/api/bookings", {
      vehicleId: vehicle.id,
      customerId: customer.id,
      startDate: "2026-03-20T09:00:00.000Z",
      endDate: "2026-03-22T09:00:00.000Z",
      totalAmount: "190",
      dailyRate: "95",
      status: "confirmed",
      paymentStatus: "paid",
      pickupLocation: "Athens HQ",
      dropoffLocation: "Athens HQ",
    });
    expect(bookingResponse.ok()).toBeTruthy();

    await page.goto("/");
    await expect(page.getByTestId("badge-notification-count")).toContainText(
      "1",
    );

    await page.getByTestId("button-notifications").click();
    await expect(page.getByTestId("sheet-notifications")).toBeVisible();
    await expect(page.getByText("New Booking Created")).toBeVisible();
    await expect(
      page.getByText(/A new booking has been recorded for/i),
    ).toBeVisible();

    await page.getByTestId("button-notifications-read-all").click();

    await expect
      .poll(async () => {
        const notificationsAfterClear = await page.request.get(
          "/api/notifications",
        );
        if (!notificationsAfterClear.ok()) {
          return false;
        }

        const payload = (await notificationsAfterClear.json()) as Array<{
          read: boolean;
        }>;
        return payload.length > 0 && payload.every((notification) => notification.read);
      })
      .toBe(true);

    await expect(page.getByTestId("badge-notification-count")).toHaveCount(0);
    await expect(page.getByTestId("button-notifications-read-all")).toHaveCount(
      0,
    );
  });

  test("persists pinned and recent surfaces in the workspace shell", async ({
    page,
  }) => {
    await registerAndLogin(page);

    await page.goto("/tasks");
    await expect(page.getByTestId("text-tasks-title")).toBeVisible();
    await page.getByTestId("button-favorite-route-tasks").click();

    await page.goto("/notes");
    await expect(page.getByTestId("text-notes-title")).toBeVisible();

    await expect(page.getByTestId("shell-pinned-section")).toBeVisible();
    await expect(page.getByTestId("shell-pinned-item-tasks")).toBeVisible();
    await expect(page.getByTestId("shell-recent-section")).toBeVisible();
    await expect(page.getByTestId("shell-recent-item-notes")).toBeVisible();

    await page.getByTestId("button-command-bar").click();
    await expect(page.getByTestId("command-bar")).toBeVisible();
    await expect(page.getByTestId("command-bar")).toContainText("Pinned");
    await expect(page.getByTestId("command-bar")).toContainText("Tasks");
  });
});
