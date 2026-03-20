import assert from "node:assert/strict";
import test from "node:test";

import { defaultOntology } from "../shared/ontologies";
import {
  buildShellSignals,
  deriveShellPosture,
} from "../client/src/lib/shell-control";

test("deriveShellPosture returns stable when queues are quiet", () => {
  const posture = deriveShellPosture({
    stats: {
      bookings: { active: 0, pending: 0 },
      tasks: { pending: 0, done: 0 },
      maintenance: { pending: 0 },
    },
    unreadNotificationsCount: 0,
  });

  assert.equal(posture.tone, "stable");
  assert.equal(posture.label, "Stable");
});

test("deriveShellPosture escalates to attention when alerts and tasks stack up", () => {
  const posture = deriveShellPosture({
    stats: {
      bookings: { active: 1, pending: 1 },
      tasks: { pending: 2, done: 0 },
      maintenance: { pending: 0 },
    },
    unreadNotificationsCount: 1,
  });

  assert.equal(posture.tone, "attention");
  assert.match(posture.summary, /active pressure/i);
});

test("buildShellSignals exposes shell-ready counts and labels", () => {
  const signals = buildShellSignals({
    activeOntology: defaultOntology,
    stats: {
      bookings: { active: 2, pending: 1 },
      tasks: { pending: 4, done: 0 },
      maintenance: { pending: 2 },
    },
    unreadNotificationsCount: 2,
  });

  assert.deepEqual(
    signals.map((signal) => signal.id),
    ["alerts", "tasks", "events", "maintenance"],
  );
  assert.equal(signals[0]?.count, 2);
  assert.equal(signals[1]?.href, "/tasks");
  assert.match(signals[2]?.description ?? "", /pending booking/i);
  assert.equal(signals[3]?.tone, "attention");
});
