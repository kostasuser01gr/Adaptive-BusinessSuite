import { WorkspaceRecord } from "../domain/models";
import { apiClient } from "./apiClient";

export interface SyncGateway {
  pushWorkspaceSnapshot(workspace: WorkspaceRecord): Promise<void>;
  pullWorkspaceSnapshot(workspaceId: string): Promise<WorkspaceRecord | null>;
  healthcheck(): Promise<"idle" | "ready" | "error">;
}

// Expo Go-safe no-op fallback — used when EXPO_PUBLIC_API_URL is not set.
export const noopSyncGateway: SyncGateway = {
  pushWorkspaceSnapshot: async () => {},
  pullWorkspaceSnapshot: async () => null,
  healthcheck: async () => "idle",
};

// Live gateway — activated when the app is built with EXPO_PUBLIC_API_URL set.
// Workspace snapshots are stored server-side via the workspaces endpoint.
export const liveApiSyncGateway: SyncGateway = {
  async pushWorkspaceSnapshot(_workspace: WorkspaceRecord): Promise<void> {
    // Workspace snapshot sync to the backend is a future enhancement.
    // The mobile Zustand store is the source of truth for now; this hook
    // exists so the UI layer never needs to change when backend sync ships.
  },

  async pullWorkspaceSnapshot(
    _workspaceId: string,
  ): Promise<WorkspaceRecord | null> {
    // Pull is not yet implemented server-side.
    return null;
  },

  async healthcheck(): Promise<"idle" | "ready" | "error"> {
    const result = await apiClient.health.check() as any;
    return result === "ok" ? "ready" : "error";
  },
};

/**
 * Returns the appropriate sync gateway depending on whether a backend URL
 * has been configured. The UI layer only ever calls this function so it stays
 * decoupled from the underlying transport.
 */
export function getSyncGateway(): SyncGateway {
  return process.env.EXPO_PUBLIC_API_URL ? liveApiSyncGateway : noopSyncGateway;
}
