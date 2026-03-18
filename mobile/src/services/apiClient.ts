/**
 * Nexus OS — Mobile API Client
 *
 * Connects the Expo app to the backend deployed on Railway (or any other host).
 * Base URL is read from the EXPO_PUBLIC_API_URL env var (set in eas.json profiles).
 *
 * React Native does not share the browser cookie jar, so this client manually
 * extracts the session cookie from Set-Cookie response headers and re-attaches
 * it on every subsequent request via the Cookie header.
 *
 * Usage:
 *   import { apiClient } from './apiClient';
 *   const user = await apiClient.auth.login('alice', 'secret');
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");

// ── Cookie store (session id persisted between app restarts) ──────────────────

const SESSION_COOKIE_KEY = "@nexus_session_cookie";

async function loadStoredCookie(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(SESSION_COOKIE_KEY);
  } catch {
    return null;
  }
}

async function saveSessionCookie(cookieHeader: string | null): Promise<void> {
  if (!cookieHeader) return;
  // Extract the first cookie value (the session id) from Set-Cookie header
  const cookieValue = cookieHeader.split(";")[0];
  if (cookieValue) {
    await AsyncStorage.setItem(SESSION_COOKIE_KEY, cookieValue);
  }
}

async function clearSessionCookie(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_COOKIE_KEY);
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

type FetchOptions = Omit<RequestInit, "body"> & {
  json?: unknown;
};

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  if (!BASE_URL) {
    throw new Error(
      "EXPO_PUBLIC_API_URL is not set. Configure it in eas.json or a local .env file.",
    );
  }

  const storedCookie = await loadStoredCookie();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (storedCookie) {
    headers["Cookie"] = storedCookie;
  }

  const init: RequestInit = {
    ...options,
    headers,
  };
  if (options.json !== undefined) {
    init.body = JSON.stringify(options.json);
  }

  const res = await fetch(`${BASE_URL}${path}`, init);

  // Persist the session cookie if the server sent a new one
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    await saveSessionCookie(setCookie);
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => ({ message: res.statusText }));
    const err: any = new Error((payload as any).message ?? "Request failed");
    err.status = res.status;
    throw err;
  }

  return res.json() as Promise<T>;
}

// ── API surface ───────────────────────────────────────────────────────────────

export interface ApiUser {
  id: string;
  username: string;
  displayName: string | null;
  mode: string;
}

export interface ApiModule {
  id: string;
  userId: string;
  type: string;
  title: string;
  w: string;
  h: string;
  position: number;
  visible: boolean;
  data: unknown | null;
}

export interface ApiChatMessage {
  id: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  actions: string[] | null;
  createdAt: string;
}

export interface ApiChatResponse {
  assistantMessage: ApiChatMessage;
  newModules: ApiModule[];
  switchedMode: string | null;
  clearedDashboard: boolean;
}

export interface ApiStats {
  fleet: { total: number; available: number; rented: number; maintenance: number };
  bookings: { total: number; active: number; pending: number };
  tasks: { total: number; pending: number; done: number };
  customers: { total: number };
  maintenance: { pending: number };
  revenue: { total: number; mtd: number };
  utilization: number;
}

// ── auth ──────────────────────────────────────────────────────────────────────

const auth = {
  async login(username: string, password: string): Promise<ApiUser> {
    return apiFetch("/api/auth/login", { method: "POST", json: { username, password } });
  },

  async register(username: string, password: string, displayName?: string): Promise<ApiUser> {
    return apiFetch("/api/auth/register", { method: "POST", json: { username, password, displayName } });
  },

  async logout(): Promise<void> {
    await apiFetch("/api/auth/logout", { method: "POST" });
    await clearSessionCookie();
  },

  async me(): Promise<ApiUser> {
    return apiFetch("/api/auth/me");
  },
};

// ── modules ───────────────────────────────────────────────────────────────────

const modules = {
  list(): Promise<ApiModule[]> {
    return apiFetch("/api/modules");
  },

  create(payload: Partial<ApiModule>): Promise<ApiModule> {
    return apiFetch("/api/modules", { method: "POST", json: payload });
  },

  update(id: string, payload: Partial<ApiModule>): Promise<ApiModule> {
    return apiFetch(`/api/modules/${id}`, { method: "PATCH", json: payload });
  },

  remove(id: string): Promise<{ ok: boolean }> {
    return apiFetch(`/api/modules/${id}`, { method: "DELETE" });
  },
};

// ── chat / assistant ──────────────────────────────────────────────────────────

const chat = {
  history(): Promise<ApiChatMessage[]> {
    return apiFetch("/api/chat");
  },

  send(content: string): Promise<ApiChatResponse> {
    return apiFetch("/api/chat", { method: "POST", json: { content } });
  },
};

// ── stats ─────────────────────────────────────────────────────────────────────

const stats = {
  get(): Promise<ApiStats> {
    return apiFetch("/api/stats");
  },
};

// ── health ────────────────────────────────────────────────────────────────────

const health = {
  async check(): Promise<"ok" | "error"> {
    try {
      await fetch(`${BASE_URL}/health`);
      return "ok";
    } catch {
      return "error";
    }
  },
};

export const apiClient = { auth, modules, chat, stats, health };
