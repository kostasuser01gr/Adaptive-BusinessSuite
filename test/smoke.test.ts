import assert from "node:assert/strict";
import test from "node:test";

import { buildNexusUltraPayload } from "../server/nexus-ultra";

const mockStats = {
  vehicleCount: 10,
  auditCount: 50,
  healthScore: 95,
  compliancePercentage: 92,
};

test("nexus payload exposes the expected product identity", () => {
  const payload = buildNexusUltraPayload(mockStats);

  assert.equal(payload.product.name, "BLACK_VAULT_NEXUS_ULTRA");
  assert.equal(payload.product.version, "14.0");
  assert.match(payload.product.outcome, /ZERO-OPEN-ISSUES/);
});

test("nexus payload preserves the full gate catalog", () => {
  const payload = buildNexusUltraPayload(mockStats);
  const totalGates =
    payload.gates.critical.length +
    payload.gates.release.length +
    payload.gates.continuous.length;

  assert.equal(payload.gates.critical.length, 2);
  assert.equal(payload.gates.release.length, 1);
  assert.equal(payload.gates.continuous.length, 1);
});

test("nexus payload includes compliance coverage and highlights", () => {
  const payload = buildNexusUltraPayload(mockStats);

  assert.equal(payload.compliance.length, 2);
  assert.ok(payload.compliance.some((framework) => framework.name === "SOC2"));
  assert.ok(payload.highlights.some((h) => h.includes("50 automated gates")));
});

test("nexus payload keeps deployment phases and intelligence insights", () => {
  const payload = buildNexusUltraPayload(mockStats);

  assert.equal(payload.deployment.length, 1);
  assert.ok(payload.intelligence.some((i) => i.title === "RAG Retrieval"));
  assert.ok(payload.recommendations.length >= 3);
});
