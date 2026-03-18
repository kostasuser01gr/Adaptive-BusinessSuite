import { api } from "./api";

export interface SyncConfig {
  userId: string;
  onSync: (data: any) => void;
  intervalMs?: number;
}

export class WebSyncCoordinator {
  private lastSyncTimestamp: string = new Date(0).toISOString();
  private timer: NodeJS.Timeout | null = null;
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
  }

  private async sync() {
    try {
      const data = await api.sync.pull(this.lastSyncTimestamp);

      // Update local timestamp
      this.lastSyncTimestamp = data.lastSyncTimestamp;

      // Notify store of new data
      this.config.onSync(data);
    } catch (err) {
      console.error("[WebSync] Pull failed:", err);
    }
  }

  /**
   * Optimistically trigger a sync after a local mutation
   */
  async triggerImmediateSync() {
    await this.sync();
  }
}
