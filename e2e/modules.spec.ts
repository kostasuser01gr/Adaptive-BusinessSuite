import { expect, test } from "@playwright/test";
import { postWithCsrf, uniqueUsername } from "./support";

async function registerAndLogin(page: import("@playwright/test").Page) {
  const username = uniqueUsername();
  const response = await postWithCsrf(page.request, "/api/auth/register", {
    username,
    password: "TestPass123!",
    displayName: "Module E2E",
  });

  expect(response.ok()).toBeTruthy();
  return username;
}

test.describe("Module journeys", () => {
  test("sidebar navigation reaches the main operator surfaces", async ({
    page,
  }) => {
    await registerAndLogin(page);
    await page.goto("/");

    await expect(page.getByTestId("text-dashboard-title")).toBeVisible({
      timeout: 10000,
    });

    await page.getByTestId("link-fleet").click();
    await expect(page).toHaveURL(/\/fleet/);
    await expect(page.getByTestId("text-fleet-title")).toBeVisible();

    await page.getByTestId("link-customers").click();
    await expect(page).toHaveURL(/\/customers/);
    await expect(page.getByTestId("text-customers-title")).toBeVisible();

    await page.getByTestId("link-bookings").click();
    await expect(page).toHaveURL(/\/bookings/);
    await expect(page.getByTestId("text-bookings-title")).toBeVisible();
  });

  test("fleet flow supports create, search, status update, and delete", async ({
    page,
  }) => {
    const plate = `E2E-${uniqueUsername().slice(-6).toUpperCase()}`;

    await registerAndLogin(page);
    await page.goto("/fleet");
    await expect(page.getByTestId("text-fleet-title")).toBeVisible();

    await page.getByTestId("button-add-vehicle").click();
    await page.getByTestId("input-vehicle-make").fill("Tesla");
    await page.getByTestId("input-vehicle-model").fill("Model 3");
    await page.getByTestId("input-vehicle-plate").fill(plate);
    await page.getByTestId("input-vehicle-rate").fill("89");

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/vehicles") &&
          response.request().method() === "POST",
      ),
      page.getByTestId("button-save-vehicle").click(),
    ]);

    await page.getByTestId("input-search-vehicles").fill(plate);
    const card = page.locator('[data-testid^="vehicle-card-"]').filter({
      hasText: plate,
    });
    await expect(card).toHaveCount(1);

    const statusButton = card.locator('[data-testid^="vehicle-status-"]');
    await expect(statusButton).toContainText("available");

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/vehicles/") &&
          response.request().method() === "PATCH",
      ),
      statusButton.click(),
    ]);
    await expect(statusButton).toContainText("rented");

    await card.hover();
    await card.locator('[data-testid^="button-vehicle-menu-"]').click();
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/vehicles/") &&
          response.request().method() === "DELETE",
      ),
      page.getByRole("menuitem", { name: "Delete" }).click(),
    ]);

    await expect(card).toHaveCount(0);
    const vehiclesAfterDelete = await page.request.get("/api/vehicles");
    expect(vehiclesAfterDelete.ok()).toBeTruthy();
    await expect(vehiclesAfterDelete.json()).resolves.not.toContainEqual(
      expect.objectContaining({ plate }),
    );
  });

  test("customers flow supports create, search, and delete", async ({
    page,
  }) => {
    const suffix = uniqueUsername().slice(-8);
    const name = `E2E Customer ${suffix}`;
    const email = `${suffix}@example.com`;
    const phone = `555${suffix.slice(0, 4)}`;

    await registerAndLogin(page);
    await page.goto("/customers");
    await expect(page.getByTestId("text-customers-title")).toBeVisible();

    await page.getByTestId("button-add-customer").click();
    await page.getByTestId("input-customer-name").fill(name);
    await page.getByTestId("input-customer-email").fill(email);
    await page.getByTestId("input-customer-phone").fill(phone);

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/customers") &&
          response.request().method() === "POST",
      ),
      page.getByTestId("button-save-customer").click(),
    ]);

    await page.getByTestId("input-search-customers").fill(suffix);
    const card = page.locator('[data-testid^="customer-card-"]').filter({
      hasText: name,
    });
    await expect(card).toHaveCount(1);

    await card.hover();
    await card.locator('[data-testid^="button-customer-menu-"]').click();
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/customers/") &&
          response.request().method() === "DELETE",
      ),
      page.getByRole("menuitem", { name: "Delete" }).click(),
    ]);

    await expect(card).toHaveCount(0);
    const customersAfterDelete = await page.request.get("/api/customers");
    expect(customersAfterDelete.ok()).toBeTruthy();
    await expect(customersAfterDelete.json()).resolves.not.toContainEqual(
      expect.objectContaining({ email }),
    );
  });

  test("tasks flow supports create, completion toggle, and delete", async ({
    page,
  }) => {
    const suffix = uniqueUsername().slice(-8);
    const title = `Follow up ${suffix}`;

    await registerAndLogin(page);
    await page.goto("/tasks");
    await expect(page.getByTestId("text-tasks-title")).toBeVisible();

    await page.getByTestId("input-task-title").fill(title);
    await page.getByTestId("select-task-priority").selectOption("high");
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/tasks") &&
          response.request().method() === "POST",
      ),
      page.getByTestId("button-add-task").click(),
    ]);

    const task = page.locator('[data-testid^="task-item-"]').filter({
      hasText: title,
    });
    await expect(task).toHaveCount(1);
    await expect(task).toContainText("high");

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/tasks/") &&
          response.request().method() === "PATCH",
      ),
      task.locator('[data-testid^="button-toggle-task-"]').click(),
    ]);

    await expect(page.getByText(`Completed (1)`)).toBeVisible();
    const completedTaskRow = page.locator('[data-testid^="task-item-"]').filter({
      hasText: title,
    });
    await expect(completedTaskRow).toHaveCount(1);
    await completedTaskRow.hover();
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/tasks/") &&
          response.request().method() === "DELETE",
      ),
      completedTaskRow.locator('[data-testid^="button-delete-task-"]').click(),
    ]);

    await expect(page.getByText(title, { exact: true })).toHaveCount(0);
    const tasksAfterDelete = await page.request.get("/api/tasks");
    expect(tasksAfterDelete.ok()).toBeTruthy();
    await expect(tasksAfterDelete.json()).resolves.not.toContainEqual(
      expect.objectContaining({ title }),
    );
  });

  test("notes flow supports create and delete", async ({ page }) => {
    const suffix = uniqueUsername().slice(-8);
    const title = `Desk note ${suffix}`;
    const content = `Capture note ${suffix}`;

    await registerAndLogin(page);
    await page.goto("/notes");
    await expect(page.getByTestId("text-notes-title")).toBeVisible();

    await page.getByTestId("input-note-title").fill(title);
    await page.getByTestId("input-note-content").fill(content);
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/notes") &&
          response.request().method() === "POST",
      ),
      page.getByTestId("button-save-note").click(),
    ]);

    const card = page.locator('[data-testid^="note-card-"]').filter({
      hasText: title,
    });
    await expect(card).toHaveCount(1);
    await expect(card).toContainText(content);

    await card.hover();
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/notes/") &&
          response.request().method() === "DELETE",
      ),
      card.locator('[data-testid^="button-delete-note-"]').click(),
    ]);

    await expect(card).toHaveCount(0);
    const notesAfterDelete = await page.request.get("/api/notes");
    expect(notesAfterDelete.ok()).toBeTruthy();
    await expect(notesAfterDelete.json()).resolves.not.toContainEqual(
      expect.objectContaining({ title, content }),
    );
  });

  test("bookings flow supports create and complete with live customer and vehicle data", async ({
    page,
  }) => {
    const suffix = uniqueUsername().slice(-8);
    await registerAndLogin(page);

    const vehicleCreate = await postWithCsrf(page.request, "/api/vehicles", {
      make: "Toyota",
      model: `Corolla ${suffix}`,
      year: 2026,
      plate: `BK-${suffix.toUpperCase()}`,
      color: "Silver",
      category: "sedan",
      dailyRate: "79",
      status: "available",
    });
    expect(vehicleCreate.ok()).toBeTruthy();
    const vehicle = await vehicleCreate.json();

    const customerCreate = await postWithCsrf(page.request, "/api/customers", {
      name: `Booking Customer ${suffix}`,
      email: `${suffix}@example.com`,
      phone: `555${suffix.slice(0, 4)}`,
      idNumber: "",
      licenseNumber: "",
      address: "",
    });
    expect(customerCreate.ok()).toBeTruthy();
    const customer = await customerCreate.json();

    await page.goto("/bookings");
    await expect(page.getByTestId("text-bookings-title")).toBeVisible();

    await page.getByTestId("button-add-booking").click();
    await page.getByTestId("select-booking-vehicle").selectOption(vehicle.id);
    await page
      .getByTestId("select-booking-customer")
      .selectOption(customer.id);
    await page.getByTestId("input-booking-start").fill("2026-04-01");
    await page.getByTestId("input-booking-end").fill("2026-04-05");

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/bookings") &&
          response.request().method() === "POST",
      ),
      page.getByTestId("button-save-booking").click(),
    ]);

    const card = page.locator('[data-testid^="booking-card-"]').filter({
      hasText: `Booking Customer ${suffix}`,
    });
    await expect(card).toHaveCount(1);
    await expect(card).toContainText(`Toyota Corolla ${suffix}`);
    await expect(card).toContainText("active");

    const returnButton = card.locator('[data-testid^="button-complete-"]');
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/bookings/") &&
          response.request().method() === "PATCH",
      ),
      returnButton.click(),
    ]);

    await expect(card).toContainText("completed");
    await expect(returnButton).toHaveCount(0);

    const vehiclesAfterReturn = await page.request.get("/api/vehicles");
    expect(vehiclesAfterReturn.ok()).toBeTruthy();
    await expect(vehiclesAfterReturn.json()).resolves.toContainEqual(
      expect.objectContaining({
        id: vehicle.id,
        status: "available",
      }),
    );
  });

  test("command bar and assistant surfaces support operator navigation", async ({
    page,
  }) => {
    await registerAndLogin(page);
    await page.goto("/");

    await expect(page.getByTestId("text-dashboard-title")).toBeVisible();

    await page.getByTestId("button-command-bar").click();
    await expect(page.getByTestId("command-bar")).toBeVisible();
    await page.getByTestId("input-command-bar").fill("settings");
    await page.getByTestId("command-settings").click();

    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByTestId("text-settings-title")).toBeVisible();
    await expect(page.getByTestId("settings-mode-rental")).toBeVisible();

    await page.getByTestId("button-open-assistant").click();
    await expect(page.getByTestId("input-chat")).toBeVisible();
    await page.getByTestId("button-close-chat").click();
    await expect(page.getByTestId("input-chat")).toHaveCount(0);
  });
});
