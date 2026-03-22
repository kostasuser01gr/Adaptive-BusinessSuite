import assert from "node:assert/strict";
import test from "node:test";

import {
  defaultPreferences,
  mergePreferences,
  normalizePreferences,
  resolvePostAuthRoute,
} from "../client/src/lib/preferences";

test("normalizePreferences falls back to safe defaults", () => {
  const preferences = normalizePreferences({
    workspace: { postAuthRoute: "/not-real" },
    shell: { density: "dense" },
    dashboard: { showSuggestions: false },
    assistant: { tone: "narrator" },
  });

  assert.deepEqual(preferences, {
    ...defaultPreferences,
    dashboard: {
      ...defaultPreferences.dashboard,
      showSuggestions: false,
    },
  });
});

test("mergePreferences keeps existing sections while applying partial updates", () => {
  const merged = mergePreferences(defaultPreferences, {
    shell: { density: "compact" },
    assistant: { tone: "strategic" },
  });

  assert.equal(merged.shell.density, "compact");
  assert.equal(merged.assistant.tone, "strategic");
  assert.equal(
    merged.dashboard.showGreeting,
    defaultPreferences.dashboard.showGreeting,
  );
});

test("resolvePostAuthRoute returns the persisted route when valid", () => {
  const route = resolvePostAuthRoute({
    ...defaultPreferences,
    workspace: {
      postAuthRoute: "/tasks",
    },
  });

  assert.equal(route, "/tasks");
});

test("resolvePostAuthRoute supports the today surface", () => {
  const route = resolvePostAuthRoute({
    ...defaultPreferences,
    workspace: {
      postAuthRoute: "/today",
    },
  });

  assert.equal(route, "/today");
});
