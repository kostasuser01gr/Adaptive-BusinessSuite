const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

const BACKEND_UNAVAILABLE_MESSAGE =
  "Unable to reach the backend. Check VITE_API_BASE_URL and the Railway service health.";

export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (!path.startsWith("/")) {
    throw new Error(`API paths must start with '/': ${path}`);
  }

  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

export async function fetchApi(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  try {
    return await fetch(resolveApiUrl(path), init);
  } catch (error) {
    if (
      (error instanceof DOMException && error.name === "AbortError") ||
      (error instanceof Error && error.name === "AbortError")
    ) {
      throw error;
    }
    throw new Error(BACKEND_UNAVAILABLE_MESSAGE);
  }
}

export const backendUnavailableMessage = BACKEND_UNAVAILABLE_MESSAGE;
