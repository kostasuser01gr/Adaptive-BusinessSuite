import assert from "node:assert/strict";
import test from "node:test";

import { backendUnavailableMessage, fetchApi } from "../client/src/lib/http";

test("fetchApi preserves abort errors for caller-specific handling", async () => {
  const originalFetch = globalThis.fetch;
  const abortError = new DOMException("The operation was aborted.", "AbortError");

  globalThis.fetch = async () => {
    throw abortError;
  };

  try {
    await assert.rejects(fetchApi("/api/sync"), (error: unknown) => {
      assert.equal(error, abortError);
      return true;
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fetchApi converts genuine transport failures into the backend unavailable message", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    throw new TypeError("fetch failed");
  };

  try {
    await assert.rejects(fetchApi("/api/sync"), (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(error.message, backendUnavailableMessage);
      return true;
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
