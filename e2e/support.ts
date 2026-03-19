import { randomUUID } from "node:crypto";
import type { APIRequestContext } from "@playwright/test";

export function uniqueUsername(): string {
  return `e2e_${randomUUID().replace(/-/g, "")}`;
}

export async function csrfHeaders(
  request: APIRequestContext,
): Promise<Record<string, string>> {
  const response = await request.get("/api/auth/csrf");
  if (!response.ok()) {
    throw new Error(`Failed to fetch CSRF token: ${response.status()}`);
  }

  const payload = (await response.json()) as { csrfToken?: string };
  if (!payload.csrfToken) {
    throw new Error("CSRF token response did not include csrfToken");
  }

  return { "x-csrf-token": payload.csrfToken };
}

export async function postWithCsrf(
  request: APIRequestContext,
  url: string,
  data?: unknown,
) {
  return request.post(url, {
    data,
    headers: await csrfHeaders(request),
  });
}
