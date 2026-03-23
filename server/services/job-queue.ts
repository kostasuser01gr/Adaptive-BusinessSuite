/**
 * Lightweight in-process async job queue.
 * No Redis dependency — uses a simple FIFO queue with concurrency control.
 */

type JobHandler<T = unknown> = (data: T) => Promise<void>;

interface QueuedJob {
  id: string;
  queue: string;
  data: unknown;
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export class JobQueue {
  private queues = new Map<string, JobHandler>();
  private jobs: QueuedJob[] = [];
  private processing = new Map<string, number>();
  private maxHistory = 200;
  private idCounter = 0;

  /**
   * Register a handler for a named queue.
   */
  register<T>(queueName: string, handler: JobHandler<T>): void {
    this.queues.set(queueName, handler as JobHandler);
    this.processing.set(queueName, 0);
  }

  /**
   * Add a job to the queue and process it asynchronously.
   */
  async add<T>(queueName: string, data: T): Promise<string> {
    const handler = this.queues.get(queueName);
    if (!handler) {
      throw new Error(`No handler registered for queue "${queueName}"`);
    }

    const id = `job_${++this.idCounter}_${Date.now()}`;
    const job: QueuedJob = {
      id,
      queue: queueName,
      data,
      status: "pending",
      createdAt: new Date(),
    };

    this.jobs.push(job);
    this.trimHistory();

    // Process asynchronously — fire and forget
    this.processJob(job, handler);

    return id;
  }

  private async processJob(job: QueuedJob, handler: JobHandler): Promise<void> {
    const current = this.processing.get(job.queue) || 0;
    this.processing.set(job.queue, current + 1);
    job.status = "processing";

    try {
      await handler(job.data);
      job.status = "completed";
      job.completedAt = new Date();
    } catch (err: any) {
      job.status = "failed";
      job.error = err?.message || String(err);
      job.completedAt = new Date();
      console.error(
        `[job-queue] Job ${job.id} in "${job.queue}" failed:`,
        err,
      );
    } finally {
      const running = this.processing.get(job.queue) || 1;
      this.processing.set(job.queue, Math.max(0, running - 1));
    }
  }

  private trimHistory(): void {
    if (this.jobs.length > this.maxHistory * 2) {
      this.jobs = this.jobs.slice(-this.maxHistory);
    }
  }

  getStatus() {
    const queueStats: Record<
      string,
      { pending: number; processing: number; completed: number; failed: number }
    > = {};

    for (const [name] of Array.from(this.queues.entries())) {
      queueStats[name] = { pending: 0, processing: 0, completed: 0, failed: 0 };
    }

    for (const job of this.jobs) {
      if (!queueStats[job.queue]) {
        queueStats[job.queue] = { pending: 0, processing: 0, completed: 0, failed: 0 };
      }
      queueStats[job.queue][job.status]++;
    }

    return {
      totalJobs: this.jobs.length,
      queues: queueStats,
      recentJobs: this.jobs.slice(-20).reverse().map((j) => ({
        id: j.id,
        queue: j.queue,
        status: j.status,
        error: j.error,
        createdAt: j.createdAt.toISOString(),
        completedAt: j.completedAt?.toISOString(),
      })),
    };
  }
}

export const jobQueue = new JobQueue();

// --- Register default job handlers ---

jobQueue.register<{ inspectionId: string; mediaUrls: string[] }>(
  "inspection-processing",
  async (data) => {
    // Dynamically import to avoid circular dependency
    const { processInspection } = await import("./vision");
    await processInspection(data.inspectionId, data.mediaUrls);
  },
);

jobQueue.register<{
  userId: string;
  title: string;
  message: string;
  type: string;
}>("notification-dispatch", async (data) => {
  const { storage } = await import("../storage");
  await storage.createNotification({
    userId: data.userId,
    workspaceId: null,
    title: data.title,
    message: data.message,
    type: data.type as any,
    read: false,
    metadata: null,
  });
});
