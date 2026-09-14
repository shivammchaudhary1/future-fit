import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { QUEUE_NAMES } from "@future-fit/config";
import type { AssessmentScoringJob } from "@future-fit/types";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import {
  DEFAULT_REDIS_URL,
  SCORING_JOB_ATTEMPTS,
  SCORING_JOB_NAME,
} from "./queue.constants.js";

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly connection: IORedis;
  private readonly scoring: Queue<AssessmentScoringJob>;
  constructor(config: ConfigService) {
    this.connection = new IORedis(config.get("REDIS_URL", DEFAULT_REDIS_URL), {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    this.scoring = new Queue(QUEUE_NAMES.assessmentScoring, {
      connection: this.connection,
    });
  }
  enqueueScoring(attemptId: string) {
    return this.scoring.add(
      SCORING_JOB_NAME,
      { attemptId },
      {
        jobId: `score-${attemptId}`,
        attempts: SCORING_JOB_ATTEMPTS,
        backoff: { type: "exponential", delay: 2_000 },
        removeOnComplete: 500,
        removeOnFail: 1_000,
      },
    );
  }
  async ping() {
    return this.connection.ping();
  }
  async rateLimit(key: string, windowMs: number) {
    const count = await this.connection.eval(
      "local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]); end; return n",
      1,
      key,
      windowMs,
    );
    return Number(count);
  }
  async onModuleDestroy() {
    await this.scoring.close();
    await this.connection.quit();
  }
}
