import assert from "node:assert/strict";
import test from "node:test";

import {
  processMessage,
  processAssistantCommand,
  type AssistantContext,
} from "../server/model/index.js";

const baseCtx: AssistantContext = {
  userId: "test-user",
  mode: "rental",
  moduleTypes: [],
};

test("model-gateway: add fleet module command", () => {
  const result = processAssistantCommand("add fleet overview", baseCtx);
  assert.equal(result.moduleToAdd?.type, "fleet");
  assert.ok(result.response.length > 0);
});

test("model-gateway: add vehicle command", () => {
  const result = processAssistantCommand("add vehicle", baseCtx);
  assert.equal(result.proposedAction?.type, "create-vehicle");
});

test("model-gateway: clear dashboard command", () => {
  const result = processAssistantCommand("clear dashboard", baseCtx);
  assert.equal(result.clearDashboard, true);
});

test("model-gateway: switch to personal mode", () => {
  const result = processAssistantCommand("switch to personal mode", baseCtx);
  assert.equal(result.switchMode, "personal");
});
