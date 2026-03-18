/**
 * Nexus OS — Mobile API Client
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");

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
  const cookieValue = cookieHeader.split(";")[0];
  if (cookieValue) {
    await AsyncStorage.setItem(SESSION_COOKIE_KEY, cookieValue);
  }
}

async function clearSessionCookie(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_COOKIE_KEY);
}

type FetchOptions = Omit<RequestInit, "body"> & { json?: unknown };

async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  if (!BASE_URL) {
    throw new Error("EXPO_PUBLIC_API_URL is not set.");
  }
  const storedCookie = await loadStoredCookie();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (storedCookie) {
    headers["Cookie"] = storedCookie;
  }
  const init: RequestInit = { ...options, headers };
  if (options.json !== undefined) {
    init.body = JSON.stringify(options.json);
  }
  const res = await fetch(`${BASE_URL}${path}`, init);
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
  proposedAction?: any;
}
export interface ApiStats {
  fleet: {
    total: number;
    available: number;
    rented: number;
    maintenance: number;
  };
  bookings: { total: number; active: number; pending: number };
  tasks: { total: number; pending: number; done: number };
  customers: { total: number };
  maintenance: { pending: number };
  revenue: { total: number; mtd: number };
  utilization: number;
}

const auth = {
  async login(username: string, password: string): Promise<ApiUser> {
    return apiFetch("/api/auth/login", {
      method: "POST",
      json: { username, password },
    });
  },
  async register(
    username: string,
    password: string,
    displayName?: string,
  ): Promise<ApiUser> {
    return apiFetch("/api/auth/register", {
      method: "POST",
      json: { username, password, displayName },
    });
  },
  async logout(): Promise<void> {
    await apiFetch("/api/auth/logout", { method: "POST" });
    await clearSessionCookie();
  },
  async me(): Promise<ApiUser> {
    return apiFetch("/api/auth/me");
  },
};

const sync = {
  async pull(since?: string): Promise<any> {
    const path = since
      ? `/api/sync?since=${encodeURIComponent(since)}`
      : "/api/sync";
    return apiFetch(path);
  },
};

const notifications = {
  list(): Promise<any[]> {
    return apiFetch("/api/notifications");
  },
  read(id: string): Promise<void> {
    return apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" });
  },
  readAll(): Promise<void> {
    return apiFetch("/api/notifications/read-all", { method: "POST" });
  },
};

const automations = {
  list(): Promise<any[]> {
    return apiFetch("/api/automations");
  },
  create(payload: any): Promise<any> {
    return apiFetch("/api/automations", { method: "POST", json: payload });
  },
};

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

const chat = {
  history(): Promise<ApiChatMessage[]> {
    return apiFetch("/api/chat");
  },
  send(
    content: string,
    source: "text" | "voice" = "text",
  ): Promise<ApiChatResponse> {
    return apiFetch("/api/chat", { method: "POST", json: { content, source } });
  },
  async applyAction(action: any): Promise<{ success: boolean; result: any }> {
    return apiFetch("/api/actions/apply", { method: "POST", json: { action } });
  },
};

const stats = {
  get(): Promise<ApiStats> {
    return apiFetch("/api/stats");
  },
};

const health = { async check(): Promise<'ok' | 'error'> { try { await apiFetch('/health'); return 'ok'; } catch { return 'error'; } } };

export const apiClient = {
  health,
  auth,
  sync,
  notifications,
  automations,
  modules,
  chat,
  stats,
};
