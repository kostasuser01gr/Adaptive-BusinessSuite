/**
 * Query Performance Monitor — tracks slow queries and suggests optimizations.
 */

import { performance } from "node:perf_hooks";

interface QueryStats {
  count: number;
  totalTime: number;
  maxTime: number;
  lastSeen: Date;
}

export class QueryOptimizer {
  private slowQueries = new Map<string, QueryStats>();
  private analyzedQueries = new Set<string>();
  private slowThresholdMs: number;

  constructor(slowThresholdMs = 100) {
    this.slowThresholdMs = slowThresholdMs;
  }

  async executeWithMonitoring<T>(
    queryName: string,
    queryFn: () => Promise<T>,
  ): Promise<T> {
    const start = performance.now();

    try {
      const result = await queryFn();
      const duration = performance.now() - start;

      if (duration > this.slowThresholdMs) {
        this.recordSlowQuery(queryName, duration);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(
        `[query-optimizer] "${queryName}" failed after ${duration.toFixed(2)}ms:`,
        error,
      );
      throw error;
    }
  }

  private recordSlowQuery(queryName: string, duration: number) {
    const existing = this.slowQueries.get(queryName) || {
      count: 0,
      totalTime: 0,
      maxTime: 0,
      lastSeen: new Date(),
    };

    existing.count++;
    existing.totalTime += duration;
    existing.maxTime = Math.max(existing.maxTime, duration);
    existing.lastSeen = new Date();

    this.slowQueries.set(queryName, existing);

    if (existing.count > 3 && !this.analyzedQueries.has(queryName)) {
      this.logOptimizationSuggestion(queryName, existing);
      this.analyzedQueries.add(queryName);
    }
  }

  private logOptimizationSuggestion(queryName: string, stats: QueryStats) {
    const avgTime = stats.totalTime / stats.count;
    console.warn(`[query-optimizer] Slow query: "${queryName}"`);
    console.warn(
      `  Ran ${stats.count} times, avg: ${avgTime.toFixed(1)}ms, max: ${stats.maxTime.toFixed(1)}ms`,
    );
    console.warn(`  Consider: composite indexes, query refactoring, or caching`);
  }

  getStats() {
    const entries: Array<{
      name: string;
      count: number;
      avgMs: number;
      maxMs: number;
      lastSeen: string;
    }> = [];

    for (const [name, stats] of Array.from(this.slowQueries.entries())) {
      entries.push({
        name,
        count: stats.count,
        avgMs: Math.round(stats.totalTime / stats.count),
        maxMs: Math.round(stats.maxTime),
        lastSeen: stats.lastSeen.toISOString(),
      });
    }

    return {
      slowQueriesCount: this.slowQueries.size,
      analyzedCount: this.analyzedQueries.size,
      slowThresholdMs: this.slowThresholdMs,
      queries: entries.sort((a, b) => b.count - a.count),
    };
  }

  reset() {
    this.slowQueries.clear();
    this.analyzedQueries.clear();
  }
}

export const queryOptimizer = new QueryOptimizer();
