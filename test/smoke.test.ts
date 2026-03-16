import assert from "node:assert/strict";
import test from "node:test";

import { buildNexusUltraPayload } from "../server/nexus-ultra";

test("nexus payload exposes the expected product identity", () => {
  const payload = buildNexusUltraPayload();

  assert.equal(payload.product.name, "BLACK_VAULT_NEXUS_ULTRA");
  assert.equal(payload.product.version, "14.0");
  assert.match(payload.product.outcome, /ZERO-OPEN-ISSUES/);
});

test("nexus payload preserves the full gate catalog", () => {
  const payload = buildNexusUltraPayload();
  const totalGates =
    payload.gates.critical.length +
    payload.gates.release.length +
    payload.gates.continuous.length;

  assert.equal(payload.gates.critical.length, 5);
  assert.equal(payload.gates.release.length, 5);
  assert.equal(payload.gates.continuous.length, 10);
  assert.equal(totalGates, 20);
});

test("nexus payload includes compliance coverage and integrations", () => {
  const payload = buildNexusUltraPayload();

  assert.equal(payload.compliance.length, 5);
  assert.ok(payload.compliance.some((framework) => framework.name === "SOC2"));
  assert.ok(payload.integrations.some((integration) => integration.name === "Datadog"));
  assert.ok(payload.integrations.some((integration) => integration.name === "PagerDuty"));
});

test("nexus payload keeps deployment phases and self-healing guidance", () => {
  const payload = buildNexusUltraPayload();

  assert.equal(payload.deployment.length, 4);
  assert.ok(payload.selfHealing.some((feature) => feature.title === "Circuit Breakers"));
  assert.ok(payload.recommendations.length >= 4);
});
