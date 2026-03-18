/**
 * Integration tests for the DatabaseStorage layer.
 * Requires DATABASE_URL to be set and the schema to be pushed (npm run db:push).
 * Skipped automatically when DATABASE_URL is absent.
 */
import assert from "node:assert/strict";
import test from "node:test";

const HAS_DB = Boolean(process.env.DATABASE_URL);
const skip = (name: string, fn: () => Promise<void>) =>
  HAS_DB ? test(name, fn) : test.skip(name, fn);

// Lazy-import so missing DATABASE_URL doesn't crash the test runner
async function getStorage() {
  const { storage } = await import("../server/storage");
  return storage;
}

// Unique prefix to isolate test data across parallel runs
const uid = () =>
  `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

skip("storage: create and retrieve user", async () => {
  const s = await getStorage();
  const username = uid();
  const user = await s.createUser({
    username,
    password: "hashed.salt",
    mode: "rental",
  });
  assert.equal(user.username, username);
  assert.equal(user.mode, "rental");

  const found = await s.getUser(user.id);
  assert.equal(found?.id, user.id);

  const byName = await s.getUserByUsername(username);
  assert.equal(byName?.id, user.id);
});

skip("storage: create booking with Date objects", async () => {
  const s = await getStorage();
  const user = await s.createUser({
    username: uid(),
    password: "hashed.salt",
    mode: "rental",
  });

  const start = new Date("2025-06-01T00:00:00.000Z");
  const end = new Date("2025-06-07T00:00:00.000Z");

  const booking = await s.createBooking({
    userId: user.id,
    status: "pending",
    startDate: start,
    endDate: end,
  });

  assert.ok(booking.id);
  // Dates round-trip through postgres as Date objects
  assert.ok(booking.startDate instanceof Date, "startDate should be a Date");
  assert.ok(booking.endDate instanceof Date, "endDate should be a Date");
  assert.equal(booking.startDate!.toISOString(), start.toISOString());
  assert.equal(booking.endDate!.toISOString(), end.toISOString());
});

skip("storage: create booking with null dates", async () => {
  const s = await getStorage();
  const user = await s.createUser({
    username: uid(),
    password: "hashed.salt",
    mode: "rental",
  });

  const booking = await s.createBooking({
    userId: user.id,
    status: "pending",
    startDate: null,
    endDate: null,
  });

  assert.ok(booking.id);
  assert.equal(booking.startDate, null);
  assert.equal(booking.endDate, null);
});

skip("storage: update booking status and dates", async () => {
  const s = await getStorage();
  const user = await s.createUser({
    username: uid(),
    password: "hashed.salt",
    mode: "rental",
  });
  const booking = await s.createBooking({ userId: user.id, status: "pending" });

  const updated = await s.updateBooking(booking.id, {
    status: "active",
    startDate: new Date("2025-07-01T00:00:00.000Z"),
  });
  assert.equal(updated?.status, "active");
  assert.ok(updated?.startDate instanceof Date);
});

skip("storage: create maintenance record with dates", async () => {
  const s = await getStorage();
  const user = await s.createUser({
    username: uid(),
    password: "hashed.salt",
    mode: "rental",
  });

  const scheduled = new Date("2025-08-01T00:00:00.000Z");
  const rec = await s.createMaintenance({
    userId: user.id,
    type: "oil_change",
    scheduledDate: scheduled,
    completedDate: null,
    status: "scheduled",
  });

  assert.ok(rec.id);
  assert.equal(rec.type, "oil_change");
  assert.ok(rec.scheduledDate instanceof Date);
  assert.equal(rec.scheduledDate!.toISOString(), scheduled.toISOString());
  assert.equal(rec.completedDate, null);
});

skip("storage: vehicle CRUD", async () => {
  const s = await getStorage();
  const user = await s.createUser({
    username: uid(),
    password: "hashed.salt",
    mode: "rental",
  });

  const vehicle = await s.createVehicle({
    userId: user.id,
    make: "Toyota",
    model: "Corolla",
    status: "available",
  });
  assert.equal(vehicle.make, "Toyota");
  assert.equal(vehicle.status, "available");

  const updated = await s.updateVehicle(vehicle.id, { status: "rented" });
  assert.equal(updated?.status, "rented");

  await s.deleteVehicle(vehicle.id);
  const gone = await s.getVehicle(vehicle.id);
  assert.equal(gone, undefined);
});

skip("storage: memory key-value upsert", async () => {
  const s = await getStorage();
  const user = await s.createUser({
    username: uid(),
    password: "hashed.salt",
    mode: "rental",
  });

  const first = await s.setMemory(user.id, "theme", "dark");
  assert.equal(first.value, "dark");

  // Upsert same key
  const second = await s.setMemory(user.id, "theme", "light");
  assert.equal(second.value, "light");
  assert.equal(second.id, first.id, "upsert should reuse same row id");

  const all = await s.getMemory(user.id);
  const themeEntry = all.find((m) => m.key === "theme");
  assert.equal(themeEntry?.value, "light");
});
