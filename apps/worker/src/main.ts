import { config } from "dotenv";
import { refreshSchoolAnalytics } from "./analytics.js";
import { QUEUE_NAMES } from "@future-fit/config";
import {
  scoreAnswers,
  validateAnswers,
  type Answer,
  type QuestionSnapshot,
  type VersionContent,
} from "@future-fit/validation";
import type { AssessmentScoringJob } from "@future-fit/types";
import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { MongoClient, ObjectId, type Document } from "mongodb";
import { createReport } from "./report.js";
import { generateInterpretation, type AIProvenance } from "./ai/service.js";
import {
  COLLECTIONS,
  DEFAULT_MONGO_URL,
  DEFAULT_ONET_URL,
  DEFAULT_REDIS_URL,
  ONET_TIMEOUT_MS,
  PROCESS_STATES,
} from "./worker.constants.js";

config({ path: [".env", "../../.env"] });

interface AttemptRecord extends Document {
  _id: ObjectId;
  userId: ObjectId;
  organizationId?: ObjectId;
  assessmentVersionId: ObjectId;
  status: string;
  language: "en" | "hi";
  responses: Answer[];
  submittedAt?: Date;
}

interface VersionRecord extends Document {
  version: string;
  questionSnapshots: QuestionSnapshot[];
  scoringConfiguration: VersionContent["scoringConfiguration"];
}

const mongo = new MongoClient(process.env.MONGODB_URI ?? DEFAULT_MONGO_URL);
await mongo.connect();

const database = mongo.db();

const redis = new Redis(process.env.REDIS_URL ?? DEFAULT_REDIS_URL, {
  maxRetriesPerRequest: null,
});

const queue = new Queue<AssessmentScoringJob>(QUEUE_NAMES.assessmentScoring, {
  connection: redis,
});

const attempts = database.collection<AttemptRecord>(COLLECTIONS.attempts);
const results = database.collection(COLLECTIONS.results);

await results.createIndex({ attemptId: 1 }, { unique: true });

await database
  .collection("notifications")
  .createIndex({ eventKey: 1 }, { unique: true });

const worker = new Worker<AssessmentScoringJob>(
  QUEUE_NAMES.assessmentScoring,
  async (job) => {
    if (!ObjectId.isValid(job.data.attemptId)) {
      throw new Error("Invalid attempt id");
    }

    const attemptId = new ObjectId(job.data.attemptId);
    const attempt = await attempts.findOne({ _id: attemptId });

    if (!attempt || !attempt.submittedAt) {
      throw new Error("Submitted attempt not found");
    }

    if (attempt.status === PROCESS_STATES.ready) {
      return { status: attempt.status };
    }

    const stage = async (status: string) => {
      await attempts.updateOne(
        { _id: attemptId },
        { $set: { status, updatedAt: new Date() } },
      );
    };

    try {
      await stage(PROCESS_STATES.scoring);

      const version = await database
        .collection<VersionRecord>("assessment_versions")
        .findOne({ _id: attempt.assessmentVersionId });

      if (!version?.questionSnapshots?.length) {
        throw new Error("Immutable question snapshot missing");
      }

      validateAnswers(version.questionSnapshots, attempt.responses, true);

      let dimensions: Record<string, number>;
      let careerMatches: Record<string, unknown>[] = [];

      const scoringModel = version.scoringConfiguration.scoringModel;

      if (
        scoringModel === "ONET_MINI_IP_V2" ||
        scoringModel === "ONET_IP_60_V1"
      ) {
        const byId = new Map(
          attempt.responses.map((response) => [
            response.questionId,
            response.answer,
          ]),
        );

        const ordered = [...version.questionSnapshots].sort(
          (a, b) =>
            (a.metadata.onetOrder ?? 0) - (b.metadata.onetOrder ?? 0),
        );

        const answers = ordered
          .map((question) => byId.get(question.questionId))
          .join("");

        const expectedAnswerCount =
          scoringModel === "ONET_IP_60_V1" ? 60 : 30;

        const answerPattern = new RegExp(
          `^[1-5]{${expectedAnswerCount}}$`,
        );

        if (!answerPattern.test(answers)) {
          throw new Error(
            `O*NET requires exactly ${expectedAnswerCount} ordered answers`,
          );
        }

        const profile = await onet(
          "/mnm/interestprofiler/results",
          answers,
        );

        if (!Array.isArray(profile.result) || profile.result.length !== 6) {
          throw new Error("Invalid O*NET score response");
        }

        dimensions = Object.fromEntries(
          profile.result.map((item: unknown) => {
            if (
              !isRecord(item) ||
              typeof item.code !== "string" ||
              typeof item.score !== "number" ||
              !Number.isFinite(item.score)
            ) {
              throw new Error("Invalid O*NET dimension");
            }

            return [item.code, item.score];
          }),
        );

        await stage(PROCESS_STATES.matching);

        if (scoringModel === "ONET_MINI_IP_V2") {
          const matches = await onet(
            "/mnm/interestprofiler/careers",
            answers,
          );

          if (
            !Array.isArray(matches.career) ||
            !matches.career.every(isRecord)
          ) {
            throw new Error("Invalid O*NET career response");
          }

          careerMatches = matches.career;
        }

        if (scoringModel === "ONET_IP_60_V1") {
          // Future Fit uses its own India-first career matching later.
          careerMatches = [];
        }
      } else {
        dimensions = scoreAnswers(
          version.questionSnapshots,
          attempt.responses,
          version.scoringConfiguration,
        );

        await stage(PROCESS_STATES.matching);
      }

      const normalizedDimensions =
        scoringModel === "ONET_IP_60_V1"
          ? Object.fromEntries(
              Object.entries(dimensions).map(([key, value]) => [
                key,
                Math.round((value / 40) * 10000) / 100,
              ]),
            )
          : undefined;

      const scoringVersion =
        version.version +
        ":" +
        version.scoringConfiguration.scoringModel;

      const aiConfigured = hasAIConfiguration();

      await results.updateOne(
        { attemptId },
        {
          $set: {
            userId: attempt.userId,
            organizationId: attempt.organizationId,
            scoringVersion,
            dimensions,
            ...(normalizedDimensions
              ? { normalizedDimensions }
              : {}),
            careerMatches,
            resultStatus: "READY",
            aiStatus: aiConfigured ? "PENDING" : "NOT_CONFIGURED",
            reportStatus: "NOT_CONFIGURED",
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true },
      );

      // Core assessment result is complete here.
      // AI interpretation and PDF report are optional enhancement layers.
      await stage(PROCESS_STATES.ready);

      await attempts.updateOne(
        { _id: attemptId },
        { $set: { completedAt: new Date(), updatedAt: new Date() } },
      );

      const coreResult = await results.findOne({ attemptId });

      await database.collection("notifications").updateOne(
        { eventKey: "result-" + attemptId.toHexString() },
        {
          $setOnInsert: {
            userId: attempt.userId,
            eventKey: "result-" + attemptId.toHexString(),
            type: "RESULT_READY",
            createdAt: new Date(),
            resultId: coreResult?._id,
            read: false,
          },
        },
        { upsert: true },
      );

      if (!aiConfigured) {
        return {
          status: PROCESS_STATES.ready,
          aiStatus: "NOT_CONFIGURED",
          reportStatus: "NOT_CONFIGURED",
        };
      }

      const reportInput = {
        attemptId: attemptId.toHexString(),
        language: attempt.language,
        dimensions,
        careerMatches,
        scoringVersion,
      };

      let interpretation: Awaited<
        ReturnType<typeof generateInterpretation>
      >["interpretation"];

      try {
        const generated = await generateInterpretation(reportInput, {
          cached: {
            interpretation: coreResult?.aiInterpretation,
            provenance: coreResult?.aiProvenance as
              | AIProvenance
              | undefined,
          },
        });

        interpretation = generated.interpretation;

        await results.updateOne(
          { attemptId },
          {
            $set: {
              aiInterpretation: interpretation,
              aiProvenance: generated.provenance,
              aiStatus: "READY",
              updatedAt: new Date(),
            },
          },
        );
      } catch {
        await results.updateOne(
          { attemptId },
          {
            $set: {
              aiStatus: "FAILED",
              reportStatus: "NOT_CONFIGURED",
              updatedAt: new Date(),
            },
          },
        );

        return {
          status: PROCESS_STATES.ready,
          aiStatus: "FAILED",
          reportStatus: "NOT_CONFIGURED",
        };
      }

      if (!hasReportConfiguration(attempt.language)) {
        await results.updateOne(
          { attemptId },
          {
            $set: {
              reportStatus: "NOT_CONFIGURED",
              updatedAt: new Date(),
            },
          },
        );

        return {
          status: PROCESS_STATES.ready,
          aiStatus: "READY",
          reportStatus: "NOT_CONFIGURED",
        };
      }

      await results.updateOne(
        { attemptId },
        {
          $set: {
            reportStatus: "PENDING",
            updatedAt: new Date(),
          },
        },
      );

      try {
        const reportKey = await createReport({
          ...reportInput,
          interpretation,
        });

        await results.updateOne(
          { attemptId },
          {
            $set: {
              reportKey,
              reportStatus: "READY",
              generatedAt: new Date(),
              updatedAt: new Date(),
            },
          },
        );

        await database.collection("notifications").updateOne(
          { eventKey: "report-" + attemptId.toHexString() },
          {
            $setOnInsert: {
              userId: attempt.userId,
              eventKey: "report-" + attemptId.toHexString(),
              type: "REPORT_READY",
              createdAt: new Date(),
              resultId: coreResult?._id,
              read: false,
            },
          },
          { upsert: true },
        );

        return {
          status: PROCESS_STATES.ready,
          aiStatus: "READY",
          reportStatus: "READY",
        };
      } catch {
        await results.updateOne(
          { attemptId },
          {
            $set: {
              reportStatus: "FAILED",
              updatedAt: new Date(),
            },
          },
        );

        // A PDF failure must never invalidate a valid scored assessment.
        return {
          status: PROCESS_STATES.ready,
          aiStatus: "READY",
          reportStatus: "FAILED",
        };
      }
    } catch (error) {
      await stage(PROCESS_STATES.failed);

      await results.updateOne(
        { attemptId },
        {
          $set: {
            resultStatus: "FAILED",
            reportStatus: "NOT_CONFIGURED",
            updatedAt: new Date(),
          },
        },
      );

      throw error;
    }
  },
  {
    connection: redis,
    concurrency: Number(process.env.SCORING_WORKER_CONCURRENCY ?? 10),
  },
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function hasAIConfiguration() {
  const provider = process.env.AI_PROVIDER?.trim();
  const model = process.env.AI_MODEL?.trim();

  if (!provider || !model) {
    return false;
  }

  const keys: Record<string, string | undefined> = {
    openai: process.env.OPENAI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    claude: process.env.ANTHROPIC_API_KEY,
  };

  return Boolean(keys[provider]?.trim());
}

function hasReportConfiguration(language: "en" | "hi") {
  const configured = Boolean(
    process.env.R2_ENDPOINT?.trim() &&
      process.env.R2_BUCKET?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim(),
  );

  if (!configured) {
    return false;
  }

  if (language === "hi" && !process.env.REPORT_FONT_PATH?.trim()) {
    return false;
  }

  return true;
}

async function onet(
  path: string,
  answers: string,
): Promise<Record<string, unknown>> {
  const apiKey = process.env.ONET_API_KEY;

  if (!apiKey) {
    throw new Error("O*NET API key is not configured");
  }

  const url = new URL(
    path,
    process.env.ONET_BASE_URL ?? DEFAULT_ONET_URL,
  );

  url.searchParams.set("answers", answers);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-API-Key": apiKey,
    },
    signal: AbortSignal.timeout(ONET_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error("O*NET status " + response.status);
  }

  const value: unknown = await response.json();

  if (!isRecord(value)) {
    throw new Error("Invalid O*NET response");
  }

  return value;
}

// The submitted document is the durable handoff,
// including API crashes before enqueue.
let reconciling = false;

async function reconcile() {
  if (reconciling) {
    return;
  }

  reconciling = true;

  try {
    const pending = await attempts
      .find({ status: "SUBMITTED" })
      .limit(100)
      .toArray();

    for (const attempt of pending) {
      await queue.add(
        "score-attempt",
        { attemptId: attempt._id.toHexString() },
        {
          jobId: "score-" + attempt._id.toHexString(),
          attempts: 4,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          removeOnComplete: 500,
          removeOnFail: 1000,
        },
      );
    }
  } catch {
    console.error(
      JSON.stringify({
        event: "submission_reconciliation_failed",
      }),
    );
  } finally {
    reconciling = false;
  }
}

const timer = setInterval(() => void reconcile(), 15_000);

let aggregating = false;

async function analytics() {
  if (aggregating) {
    return;
  }

  aggregating = true;

  try {
    await refreshSchoolAnalytics(database);
  } catch {
    console.error(
      JSON.stringify({
        event: "school_analytics_failed",
      }),
    );
  } finally {
    aggregating = false;
  }
}

const analyticsTimer = setInterval(
  () => void analytics(),
  60_000,
);

void analytics();
await reconcile();

async function shutdown() {
  clearInterval(timer);
  clearInterval(analyticsTimer);
  await worker.close();
  await queue.close();
  await redis.quit();
  await mongo.close();
}

process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
