/**
 * Queued checks. A check that calls Qloo and a model can take seconds; the desk gets a job id immediately,
 * polls, and the id survives a refresh (it rides in the URL hash). The store interface is the contract; the
 * in-memory worker is the development implementation. Durable job state belongs in the database once one exists.
 */
import { randomBytes } from "node:crypto";
import { type CheckRequest, type CheckResponse, runCheck } from "@/lib/check";
import type { JobStatus } from "@/lib/enums";
import { log } from "@/lib/security/guard";

export type JobRecord = {
  id: string;
  status: JobStatus;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  result?: CheckResponse;
  error?: string;
};

export interface JobStore {
  enqueue(req: CheckRequest): Promise<JobRecord>;
  get(id: string): Promise<JobRecord | null>;
}

export class MemoryJobStore implements JobStore {
  private jobs = new Map<string, JobRecord>();
  private queue: { id: string; req: CheckRequest }[] = [];
  private running = 0;
  constructor(private readonly concurrency = 2) {}

  async enqueue(req: CheckRequest) {
    const job: JobRecord = {
      id: randomBytes(9).toString("base64url"),
      status: "queued",
      createdAt: new Date().toISOString(),
    };
    this.jobs.set(job.id, job);
    this.queue.push({ id: job.id, req });
    this.pump();
    if (this.jobs.size > 2000) this.prune();
    return job;
  }

  async get(id: string) {
    return this.jobs.get(id) ?? null;
  }

  private pump() {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const next = this.queue.shift();
      if (!next) return;
      const job = this.jobs.get(next.id);
      if (!job) continue;
      this.running += 1;
      job.status = "running";
      job.startedAt = new Date().toISOString();
      void runCheck(next.req)
        .then((result) => {
          job.result = result;
          job.status = "done";
        })
        .catch((e) => {
          job.status = "failed";
          job.error = "The check could not be completed.";
          log("error", "job_failed", {
            id: job.id,
            message: e instanceof Error ? e.message : "unknown",
          });
        })
        .finally(() => {
          job.finishedAt = new Date().toISOString();
          this.running -= 1;
          this.pump();
        });
    }
  }

  private prune() {
    const cutoff = Date.now() - 60 * 60 * 1000;
    for (const [id, j] of this.jobs)
      if (Date.parse(j.createdAt) < cutoff) this.jobs.delete(id);
  }
}

const jobHolder = globalThis as typeof globalThis & {
  __headlinerJobStore?: JobStore;
};

/** One queue per process, shared by every route bundle (see storage/index.ts for why). */
export function jobStore(): JobStore {
  jobHolder.__headlinerJobStore ??= new MemoryJobStore();
  return jobHolder.__headlinerJobStore;
}
