const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

const BACKEND_UNAVAILABLE_MESSAGE =
  "Unable to reach the backend. Check VITE_API_BASE_URL and the Railway service health.";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (!path.startsWith("/")) {
    throw new Error(`API paths must start with '/': ${path}`);
  }

  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

function isRetryable(error: unknown, response?: Response): boolean {
  if (!response) return true; // network error
  const s = response.status;
  return s >= 500 || s === 429 || s === 408;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchApi(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = resolveApiUrl(path);
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, init);

      if (response.ok || !isRetryable(null, response)) {
        return response;
      }

      // retryable — retry with exponential backoff + jitter
      if (attempt < MAX_RETRIES) {
        const jitter = Math.random() * 0.5 + 0.75; // 0.75-1.25x
        await sleep(BASE_DELAY_MS * 2 ** attempt * jitter);
        continue;
      }

      return response;
    } catch (error) {
      // Propagate AbortError immediately — don't retry user/signal cancellations
      if (
        (error instanceof DOMException && error.name === "AbortError") ||
        (error instanceof Error && error.name === "AbortError")
      ) {
        throw error;
      }

      lastError = error;

      if (attempt < MAX_RETRIES) {
        const jitter = Math.random() * 0.5 + 0.75;
        await sleep(BASE_DELAY_MS * 2 ** attempt * jitter);
        continue;
      }
    }
  }

  throw new Error(BACKEND_UNAVAILABLE_MESSAGE);
}

export const backendUnavailableMessage = BACKEND_UNAVAILABLE_MESSAGE;
