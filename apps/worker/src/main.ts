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
import { createReport, interpret, type Interpretation } from "./report.js";
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
    if (!ObjectId.isValid(job.data.attemptId))
      throw new Error("Invalid attempt id");
    const attemptId = new ObjectId(job.data.attemptId);
    const attempt = await attempts.findOne({ _id: attemptId });
    if (!attempt || !attempt.submittedAt)
      throw new Error("Submitted attempt not found");
    if (attempt.status === PROCESS_STATES.ready)
      return { status: attempt.status };
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
      if (!version?.questionSnapshots?.length)
        throw new Error("Immutable question snapshot missing");
      validateAnswers(version.questionSnapshots, attempt.responses, true);
      let dimensions: Record<string, number>;
      let careerMatches: Record<string, unknown>[] = [];
      if (version.scoringConfiguration.scoringModel === "ONET_MINI_IP_V2") {
        const byId = new Map(
          attempt.responses.map((r) => [r.questionId, r.answer]),
        );
        const ordered = [...version.questionSnapshots].sort(
          (a, b) => (a.metadata.onetOrder ?? 0) - (b.metadata.onetOrder ?? 0),
        );
        const answers = ordered.map((q) => byId.get(q.questionId)).join("");
        if (!/^[1-5]{30}$/.test(answers))
          throw new Error("O*NET requires exactly 30 ordered answers");
        const profile = await onet("/mnm/interestprofiler/results", answers);
        if (!Array.isArray(profile.result) || profile.result.length !== 6)
          throw new Error("Invalid O*NET score response");
        dimensions = Object.fromEntries(
          profile.result.map((item: unknown) => {
            if (
              !isRecord(item) ||
              typeof item.code !== "string" ||
              typeof item.score !== "number" ||
              !Number.isFinite(item.score)
            )
              throw new Error("Invalid O*NET dimension");
            return [item.code, item.score];
          }),
        );
        await stage(PROCESS_STATES.matching);
        const matches = await onet("/mnm/interestprofiler/careers", answers);
        if (!Array.isArray(matches.career) || !matches.career.every(isRecord))
          throw new Error("Invalid O*NET career response");
        careerMatches = matches.career;
      } else {
        dimensions = scoreAnswers(
          version.questionSnapshots,
          attempt.responses,
          version.scoringConfiguration,
        );
        await stage(PROCESS_STATES.matching);
      }
      await results.updateOne(
        { attemptId },
        {
          $set: {
            userId: attempt.userId,
            organizationId: attempt.organizationId,
            scoringVersion:
              version.version + ":" + version.scoringConfiguration.scoringModel,
            dimensions,
            careerMatches,
            reportStatus: "PENDING",
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true },
      );
      await stage("AI_INTERPRETATION");
      const existing = await results.findOne({ attemptId });
      const reportInput = {
        attemptId: attemptId.toHexString(),
        language: attempt.language,
        dimensions,
        careerMatches,
      };
      const interpretation =
        (existing?.aiInterpretation as Interpretation | undefined) ??
        (await interpret(reportInput));
      await results.updateOne(
        { attemptId },
        { $set: { aiInterpretation: interpretation } },
      );
      await stage("REPORT_GENERATION");
      const reportKey = await createReport({ ...reportInput, interpretation });
      await results.updateOne(
        { attemptId },
        { $set: { reportKey, reportStatus: "READY", generatedAt: new Date() } },
      );
      await stage(PROCESS_STATES.ready);
      await attempts.updateOne(
        { _id: attemptId },
        { $set: { completedAt: new Date() } },
      );
      await database.collection("notifications").updateOne(
        { eventKey: "report-" + attemptId.toHexString() },
        {
          $setOnInsert: {
            userId: attempt.userId,
            eventKey: "report-" + attemptId.toHexString(),
            type: "REPORT_READY",
            createdAt: new Date(),
            resultId: existing?._id,
            read: false,
          },
        },
        { upsert: true },
      );
      return { status: PROCESS_STATES.ready };
    } catch (error) {
      await stage(PROCESS_STATES.failed);
      await results.updateOne(
        { attemptId },
        { $set: { reportStatus: "FAILED" } },
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
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
async function onet(
  path: string,
  answers: string,
): Promise<Record<string, unknown>> {
  const apiKey = process.env.ONET_API_KEY;
  if (!apiKey) throw new Error("O*NET API key is not configured");
  const url = new URL(path, process.env.ONET_BASE_URL ?? DEFAULT_ONET_URL);
  url.searchParams.set("answers", answers);
  const response = await fetch(url, {
    headers: { Accept: "application/json", "X-API-Key": apiKey },
    signal: AbortSignal.timeout(ONET_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error("O*NET status " + response.status);
  const value: unknown = await response.json();
  if (!isRecord(value)) throw new Error("Invalid O*NET response");
  return value;
}

// The submitted document is the durable handoff, including API crashes before enqueue.
let reconciling = false;
async function reconcile() {
  if (reconciling) return;
  reconciling = true;
  try {
    const pending = await attempts
      .find({ status: "SUBMITTED" })
      .limit(100)
      .toArray();
    for (const attempt of pending)
      await queue.add(
        "score-attempt",
        { attemptId: attempt._id.toHexString() },
        {
          jobId: "score-" + attempt._id.toHexString(),
          attempts: 4,
          backoff: { type: "exponential", delay: 2000 },
          removeOnComplete: 500,
          removeOnFail: 1000,
        },
      );
  } catch {
    console.error(
      JSON.stringify({ event: "submission_reconciliation_failed" }),
    );
  } finally {
    reconciling = false;
  }
}
const timer = setInterval(() => void reconcile(), 15_000);
let aggregating = false;
async function analytics() {
  if (aggregating) return;
  aggregating = true;
  try {
    await refreshSchoolAnalytics(database);
  } catch {
    console.error(JSON.stringify({ event: "school_analytics_failed" }));
  } finally {
    aggregating = false;
  }
}
const analyticsTimer = setInterval(() => void analytics(), 60_000);
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
