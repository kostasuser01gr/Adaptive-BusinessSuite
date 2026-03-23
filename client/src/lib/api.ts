import { fetchApi } from "./http";

let csrfToken: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;

function requiresCsrf(method?: string): boolean {
  const normalizedMethod = (method ?? "GET").toUpperCase();
  return !["GET", "HEAD", "OPTIONS"].includes(normalizedMethod);
}

async function requestCsrfToken(): Promise<string> {
  const response = await fetchApi("/api/auth/csrf", {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Unable to establish a secure session.");
  }

  const payload = (await response.json().catch(() => null)) as
    | { csrfToken?: unknown }
    | null;
  if (!payload?.csrfToken || typeof payload.csrfToken !== "string") {
    throw new Error("Unable to establish a secure session.");
  }

  csrfToken = payload.csrfToken;
  return payload.csrfToken;
}

async function ensureCsrfToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && csrfToken) {
    return csrfToken;
  }

  if (!csrfTokenPromise || forceRefresh) {
    csrfTokenPromise = requestCsrfToken().finally(() => {
      csrfTokenPromise = null;
    });
  }

  return csrfTokenPromise;
}

async function fetchAPI(url: string, options?: RequestInit) {
  const method = (options?.method ?? "GET").toUpperCase();
  const headers = {
    "Content-Type": "application/json",
    ...(options?.headers || {}),
  } as Record<string, string>;

  if (requiresCsrf(method)) {
    headers["x-csrf-token"] = await ensureCsrfToken();
  }

  let res = await fetchApi(url, {
    ...options,
    method,
    headers,
    credentials: "include",
  });

  if (res.status === 403 && requiresCsrf(method)) {
    const errorPayload = await res
      .clone()
      .json()
      .catch(() => ({ message: "" }));
    const message =
      typeof errorPayload?.message === "string" ? errorPayload.message : "";

    if (message.toLowerCase().includes("csrf")) {
      headers["x-csrf-token"] = await ensureCsrfToken(true);
      res = await fetchApi(url, {
        ...options,
        method,
        headers,
        credentials: "include",
      });
    }
  }

  if (url === "/api/auth/logout" && res.ok) {
    csrfToken = null;
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  auth: {
    me: () => fetchAPI("/api/auth/me"),
    login: (username: string, password: string) =>
      fetchAPI("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
    register: (username: string, password: string, displayName?: string) =>
      fetchAPI("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password, displayName }),
      }),
    logout: () => fetchAPI("/api/auth/logout", { method: "POST" }),
  },
  user: {
    setMode: (mode: string) =>
      fetchAPI("/api/user/mode", {
        method: "PATCH",
        body: JSON.stringify({ mode }),
      }),
    setPreferences: (prefs: any) =>
      fetchAPI("/api/user/preferences", {
        method: "PATCH",
        body: JSON.stringify(prefs),
      }),
  },
  sync: {
    pull: (since?: string, signal?: AbortSignal) =>
      fetchAPI(
        `/api/sync${since ? `?since=${encodeURIComponent(since)}` : ""}`,
        signal ? { signal } : undefined,
      ),
  },
  notifications: {
    list: () => fetchAPI("/api/notifications"),
    read: (id: string) =>
      fetchAPI(`/api/notifications/${id}/read`, { method: "PATCH" }),
    readAll: () => fetchAPI("/api/notifications/read-all", { method: "POST" }),
  },
  automations: {
    list: () => fetchAPI("/api/automations"),
    create: (data: any) =>
      fetchAPI("/api/automations", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  modules: {
    list: () => fetchAPI("/api/modules"),
    create: (data: any) =>
      fetchAPI("/api/modules", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      fetchAPI(`/api/modules/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    remove: (id: string) =>
      fetchAPI(`/api/modules/${id}`, { method: "DELETE" }),
  },
  chat: {
    list: () => fetchAPI("/api/chat"),
    send: (content: string) =>
      fetchAPI("/api/chat", {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
  },
  applyAction: (action: any) =>
    fetchAPI("/api/actions/apply", {
      method: "POST",
      body: JSON.stringify({ action }),
    }),
  vehicles: {
    list: () => fetchAPI("/api/vehicles"),
    create: (data: any) =>
      fetchAPI("/api/vehicles", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      fetchAPI(`/api/vehicles/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    remove: (id: string) =>
      fetchAPI(`/api/vehicles/${id}`, { method: "DELETE" }),
  },
  customers: {
    list: () => fetchAPI("/api/customers"),
    create: (data: any) =>
      fetchAPI("/api/customers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchAPI(`/api/customers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    remove: (id: string) =>
      fetchAPI(`/api/customers/${id}`, { method: "DELETE" }),
  },
  bookings: {
    list: () => fetchAPI("/api/bookings"),
    create: (data: any) =>
      fetchAPI("/api/bookings", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      fetchAPI(`/api/bookings/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },
  maintenance: {
    list: () => fetchAPI("/api/maintenance"),
    create: (data: any) =>
      fetchAPI("/api/maintenance", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchAPI(`/api/maintenance/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },
  tasks: {
    list: () => fetchAPI("/api/tasks"),
    create: (data: any) =>
      fetchAPI("/api/tasks", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      fetchAPI(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    remove: (id: string) => fetchAPI(`/api/tasks/${id}`, { method: "DELETE" }),
  },
  notes: {
    list: () => fetchAPI("/api/notes"),
    create: (data: any) =>
      fetchAPI("/api/notes", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      fetchAPI(`/api/notes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    remove: (id: string) => fetchAPI(`/api/notes/${id}`, { method: "DELETE" }),
  },
  stats: () => fetchAPI("/api/stats"),
  suggestions: () => fetchAPI("/api/suggestions"),
  actions: () => fetchAPI("/api/actions"),
  modelConfig: {
    get: () => fetchAPI("/api/model-config"),
    update: (data: any) =>
      fetchAPI("/api/model-config", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },
  nexusUltra: {
    get: () => fetchAPI("/api/nexus-ultra"),
  },
  analytics: {
    financial: () => fetchAPI("/api/analytics/financial"),
    historical: (days = 30) =>
      fetchAPI(`/api/analytics/historical?days=${days}`),
    revenue: (start?: string, end?: string, granularity?: string) => {
      const params = new URLSearchParams();
      if (start) params.set("start", start);
      if (end) params.set("end", end);
      if (granularity) params.set("granularity", granularity);
      return fetchAPI(`/api/analytics/revenue?${params.toString()}`);
    },
    fleetUtilization: (start?: string, end?: string) => {
      const params = new URLSearchParams();
      if (start) params.set("start", start);
      if (end) params.set("end", end);
      return fetchAPI(`/api/analytics/fleet-utilization?${params.toString()}`);
    },
    demandForecast: () => fetchAPI("/api/analytics/demand-forecast"),
    customerLtv: () => fetchAPI("/api/analytics/customer-ltv"),
    metrics: () => fetchAPI("/api/analytics/metrics"),
    anomalies: () => fetchAPI("/api/analytics/anomalies"),
  },
  admin: {
    queryStats: () => fetchAPI("/api/admin/query-stats"),
    jobStatus: () => fetchAPI("/api/admin/jobs/status"),
  },
  audit: {
    export: (format = "csv", since?: string, until?: string) => {
      const params = new URLSearchParams({ format });
      if (since) params.set("since", since);
      if (until) params.set("until", until);
      return fetchAPI(`/api/audit/export?${params.toString()}`);
    },
    log: () => fetchAPI("/api/audit-log"),
  },
  apiKeys: {
    list: () => fetchAPI("/api/api-keys"),
    create: (data: { name: string; expiresInDays?: number }) =>
      fetchAPI("/api/api-keys", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    remove: (id: string) =>
      fetchAPI(`/api/api-keys/${id}`, { method: "DELETE" }),
  },
  sessions: {
    list: () => fetchAPI("/api/sessions"),
    revoke: (id: string) =>
      fetchAPI(`/api/sessions/${id}`, { method: "DELETE" }),
    revokeAll: () => fetchAPI("/api/sessions", { method: "DELETE" }),
  },
};
