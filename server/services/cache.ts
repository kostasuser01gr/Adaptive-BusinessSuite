/**
 * In-memory TTL cache — lightweight cache layer with event-driven invalidation.
 * No Redis dependency; suitable for single-process deployments.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(cleanupIntervalMs = 60_000) {
    this.cleanupInterval = setInterval(() => this.evict(), cleanupIntervalMs);
    // Allow process to exit even with interval running
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Get or compute: returns cached value if present, otherwise calls `compute()`,
   * stores the result, and returns it.
   */
  async getOrSet<T>(
    key: string,
    compute: () => Promise<T>,
    ttlMs: number,
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;

    const value = await compute();
    this.set(key, value, ttlMs);
    return value;
  }

  invalidate(key: string): boolean {
    return this.store.delete(key);
  }

  /** Invalidate all keys matching a prefix. */
  invalidatePrefix(prefix: string): number {
    let count = 0;
    const keys = Array.from(this.store.keys());
    for (const key of keys) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  /** Remove all expired entries. */
  private evict(): void {
    const now = Date.now();
    const entries = Array.from(this.store.entries());
    for (const [key, entry] of entries) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

/** Singleton cache instance for the application. */
export const appCache = new MemoryCache();

/** Common cache TTLs */
export const CacheTTL = {
  SHORT: 15_000,       // 15 seconds — real-time-ish
  MEDIUM: 60_000,      // 1 minute — dashboard stats
  LONG: 5 * 60_000,    // 5 minutes — nexus ultra, suggestions
  VERY_LONG: 30 * 60_000, // 30 minutes — config, rarely changing
} as const;
