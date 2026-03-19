import { api } from "./api";

export interface SyncConfig {
  userId: string;
  onSync: (data: any) => void;
  intervalMs?: number;
}

export class WebSyncCoordinator {
  private lastSyncTimestamp: string = new Date(0).toISOString();
  private timer: NodeJS.Timeout | null = null;
  private activeController: AbortController | null = null;
  private config: SyncConfig;

  constructor(config: SyncConfig) {
    this.config = config;
  }

  async start() {
    if (this.timer) return;

    // Initial pull
    await this.sync();

    // Setup background interval
    this.timer = setInterval(() => this.sync(), this.config.intervalMs || 5000);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.activeController) {
      this.activeController.abort();
      this.activeController = null;
    }
  }

  private async sync() {
    if (this.activeController) return;

    const controller = new AbortController();
    this.activeController = controller;

    try {
      const data = await api.sync.pull(
        this.lastSyncTimestamp,
        controller.signal,
      );

      // Update local timestamp
      this.lastSyncTimestamp = data.lastSyncTimestamp;

      // Notify store of new data
      this.config.onSync(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      if (err instanceof Error) {
        const message = err.message.toLowerCase();
        if (
          message.includes("not authenticated") ||
          message.startsWith("401:")
        ) {
          this.stop();
          return;
        }
      }
      console.error("[WebSync] Pull failed:", err);
    } finally {
      if (this.activeController === controller) {
        this.activeController = null;
      }
    }
  }

  /**
   * Optimistically trigger a sync after a local mutation
   */
  async triggerImmediateSync() {
    await this.sync();
  }
}
