import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";

export interface QuoteJobPayload {
  quoteRequestId: string;
  partnerId: string;
  businessName: string;
  coverageType: string;
  state: string;
  annualRevenue: number;
}

@Injectable()
export class QuotesQueueService {
  private readonly logger = new Logger(QuotesQueueService.name);

  constructor(@InjectQueue("quotes") private quotesQueue: Queue) {}

  /**
   * Enqueue a quote request for asynchronous processing
   */
  async enqueueQuoteRequest(payload: QuoteJobPayload) {
    this.logger.debug(
      `Enqueuing quote request: ${payload.quoteRequestId}`
    );

    const job = await this.quotesQueue.add(
      "process-quote-request",
      payload,
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000
        },
        removeOnComplete: true,
        removeOnFail: false
      }
    );

    this.logger.log(
      `Quote request enqueued with job ID: ${job.id}`
    );

    return job;
  }

  /**
   * Enqueue an agent assignment for a quote request
   */
  async enqueueAgentAssignment(quoteRequestId: string) {
    this.logger.debug(`Enqueuing agent assignment for: ${quoteRequestId}`);

    const job = await this.quotesQueue.add(
      "assign-agent",
      { quoteRequestId },
      {
        attempts: 2,
        backoff: {
          type: "exponential",
          delay: 1000
        },
        removeOnComplete: true,
        removeOnFail: false
      }
    );

    this.logger.log(
      `Agent assignment enqueued with job ID: ${job.id}`
    );

    return job;
  }

  /**
   * Get the status of a queued job
   */
  async getJobStatus(jobId: number) {
    const job = await this.quotesQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      data: job.data,
      state: await job.getState(),
      progress: job.progress(),
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts,
      failedReason: job.failedReason
    };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const counts = await this.quotesQueue.getJobCounts();
    return {
      active: counts.active,
      waiting: counts.waiting,
      completed: counts.completed,
      failed: counts.failed,
      delayed: counts.delayed
    };
  }

  /**
   * Clear completed jobs from the queue
   */
  async clearCompleted() {
    const completedJobs = await this.quotesQueue.getCompleted();
    for (const job of completedJobs) {
      await job.remove();
    }
    this.logger.log(`Cleared ${completedJobs.length} completed jobs`);
  }

  /**
   * Clear failed jobs from the queue (with optional limit)
   */
  async clearFailed(limit?: number) {
    const failedJobs = await this.quotesQueue.getFailed(0, limit ?? -1);
    for (const job of failedJobs) {
      await job.remove();
    }
    this.logger.log(`Cleared ${failedJobs.length} failed jobs`);
  }
}
