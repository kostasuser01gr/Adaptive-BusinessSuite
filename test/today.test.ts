import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAttentionStack,
  buildSchedule,
  describeSuggestionCount,
} from "../client/src/lib/today";

test("buildAttentionStack prioritizes alerts, high-priority tasks, and live work", () => {
  const attention = buildAttentionStack({
    notifications: [
      {
        id: "n1",
        title: "Unread alert",
        message: "Operator action needed",
        read: false,
      },
    ],
    tasks: [
      {
        id: "t1",
        title: "High priority task",
        status: "todo",
        priority: "high",
        dueDate: "2026-03-20T09:00:00.000Z",
      },
      {
        id: "t2",
        title: "Low priority task",
        status: "todo",
        priority: "low",
      },
    ],
    bookings: [
      {
        id: "b1",
        status: "active",
        startDate: "2026-03-20T08:00:00.000Z",
        endDate: "2026-03-21T08:00:00.000Z",
      },
    ],
    maintenance: [
      {
        id: "m1",
        status: "scheduled",
        type: "service",
        scheduledDate: "2026-03-22T08:00:00.000Z",
      },
    ],
  });

  assert.equal(attention[0]?.id, "notification-n1");
  assert.equal(attention[1]?.id, "task-t1");
  assert.equal(attention[2]?.id, "task-t2");
  assert.equal(attention[3]?.id, "booking-b1");
  assert.equal(attention[4]?.id, "maintenance-m1");
});

test("buildSchedule sorts bookings and maintenance by the nearest known date", () => {
  const schedule = buildSchedule({
    bookings: [
      {
        id: "b1",
        status: "pending",
        startDate: "2026-03-23T08:00:00.000Z",
      },
      {
        id: "b2",
        status: "active",
        endDate: "2026-03-21T10:00:00.000Z",
      },
    ],
    maintenance: [
      {
        id: "m1",
        status: "scheduled",
        type: "repair",
        scheduledDate: "2026-03-20T07:00:00.000Z",
      },
    ],
  });

  assert.deepEqual(
    schedule.map((item) => item.id),
    ["maintenance-m1", "booking-b2", "booking-b1"],
  );
});

test("describeSuggestionCount returns stable operator-facing copy", () => {
  assert.equal(describeSuggestionCount([]), "No proactive suggestions right now.");
  assert.equal(
    describeSuggestionCount([{ title: "Review bookings" }]),
    "1 active suggestion is ready for review.",
  );
  assert.equal(
    describeSuggestionCount([{ title: "One" }, { title: "Two" }]),
    "2 active suggestions are ready for review.",
  );
});
