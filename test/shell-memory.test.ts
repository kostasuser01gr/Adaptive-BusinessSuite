import assert from "node:assert/strict";
import test from "node:test";

import { defaultOntology, ontologies } from "../shared/ontologies";
import {
  buildShellRouteCatalog,
  getShellRouteKey,
  normalizeShellMemory,
  recordRecentPath,
  supportedShellRoutes,
  toggleFavoritePath,
} from "../client/src/lib/shell-memory";

test("buildShellRouteCatalog excludes unsupported ontology routes", () => {
  const personalRoutes = buildShellRouteCatalog(ontologies.personal);
  const paths = personalRoutes.map((route) => route.path);

  assert.equal(paths.includes("/calendar"), false);
  assert.equal(paths.includes("/projects"), false);
  assert.equal(paths.includes("/today"), true);
  assert.equal(
    personalRoutes.find((route) => route.path === "/")?.label,
    "Overview",
  );
});

test("normalizeShellMemory filters unknown paths and de-duplicates items", () => {
  const normalized = normalizeShellMemory(
    {
      favorites: ["/tasks", "/tasks", "/ghost"],
      recents: ["/notes", "/today", "/today", "/ghost"],
    },
    supportedShellRoutes,
  );

  assert.deepEqual(normalized, {
    favorites: ["/tasks"],
    recents: ["/notes", "/today"],
  });
});

test("recordRecentPath keeps the newest route first and caps the stack", () => {
  const state = ["/", "/tasks", "/notes", "/bookings", "/fleet", "/financial"]
    .reduce(
      (memory, path) => recordRecentPath(memory, path, supportedShellRoutes),
      normalizeShellMemory(null, supportedShellRoutes),
    );

  const next = recordRecentPath(state, "/today", supportedShellRoutes);

  assert.deepEqual(next.recents, [
    "/today",
    "/financial",
    "/fleet",
    "/bookings",
    "/notes",
    "/tasks",
  ]);
});

test("toggleFavoritePath adds then removes a valid route", () => {
  const initial = normalizeShellMemory(null, supportedShellRoutes);
  const pinned = toggleFavoritePath(initial, "/tasks", supportedShellRoutes);
  const unpinned = toggleFavoritePath(pinned, "/tasks", supportedShellRoutes);

  assert.deepEqual(pinned.favorites, ["/tasks"]);
  assert.deepEqual(unpinned.favorites, []);
});

test("getShellRouteKey returns stable identifiers for route test ids", () => {
  assert.equal(getShellRouteKey("/"), "dashboard");
  assert.equal(getShellRouteKey("/nexus-ultra"), "nexus-ultra");
  assert.equal(getShellRouteKey("/today"), "today");
  assert.equal(
    buildShellRouteCatalog(defaultOntology).find((route) => route.path === "/today")
      ?.label,
    "Today",
  );
});
