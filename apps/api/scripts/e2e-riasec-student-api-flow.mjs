import crypto from "node:crypto";
import mongoose from "mongoose";

const mongoUri = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_ACCESS_SECRET;
const port = process.env.API_PORT || "8080";
const baseUrl =
  process.env.E2E_API_BASE_URL || `http://localhost:${port}/api/v1`;

if (!mongoUri) throw new Error("MONGODB_URI is missing.");
if (!jwtSecret) throw new Error("JWT_ACCESS_SECRET is missing.");

function base64url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signAccessToken(payload) {
  const header = base64url(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  );
  const body = base64url(JSON.stringify(payload));
  const input = `${header}.${body}`;
  const signature = crypto
    .createHmac("sha256", jwtSecret)
    .update(input)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${input}.${signature}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

await mongoose.connect(mongoUri);

let created = {
  userId: null,
  sessionId: null,
  attemptId: null,
  resultId: null,
};

try {
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection is not ready.");

  const assessment = await db.collection("assessments").findOne({
    stableKey: "FUTURE_FIT_RIASEC_ONET_60",
    status: "PUBLISHED",
  });

  if (!assessment?.activeVersionId) {
    throw new Error("Published Future Fit RIASEC assessment not found.");
  }

  const now = new Date();
  const stamp = Date.now();
  const email = `riasec.e2e.${stamp}@future-fit.local`;

  const userInsert = await db.collection("users").insertOne({
    firstName: "RIASEC",
    lastName: "E2E",
    email,
    authProviders: [],
    preferredLanguage: "en",
    globalRoles: [],
    status: "ACTIVE",
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
    e2eTag: "RIASEC_REAL_API_FLOW_V1",
  });

  created.userId = userInsert.insertedId;

  const sessionInsert = await db.collection("auth_sessions").insertOne({
    userId: userInsert.insertedId,
    refreshTokenHash: "e2e-not-used",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    lastUsedAt: now,
    createdAt: now,
    updatedAt: now,
    userAgent: "future-fit-riasec-e2e",
    ipAddress: "127.0.0.1",
  });

  created.sessionId = sessionInsert.insertedId;

  const issuedAt = Math.floor(Date.now() / 1000);

  const accessToken = signAccessToken({
    sub: userInsert.insertedId.toString(),
    sid: sessionInsert.insertedId.toString(),
    type: "access",
    iat: issuedAt,
    exp: issuedAt + 15 * 60,
  });

  const csrf = crypto.randomBytes(24).toString("hex");

  async function api(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Cookie: `ff_csrf=${csrf}`,
        "x-csrf-token": csrf,
        ...(options.headers || {}),
      },
      signal: AbortSignal.timeout(15_000),
    });

    const text = await response.text();
    let body;

    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      throw new Error(
        `${options.method || "GET"} ${path} returned non-JSON status ${response.status}.`,
      );
    }

    if (!response.ok) {
      throw new Error(
        `${options.method || "GET"} ${path} failed (${response.status}): ${JSON.stringify(body)}`,
      );
    }

    return body?.data ?? body;
  }

  const started = await api(
    `/assessments/${assessment._id.toString()}/start`,
    {
      method: "POST",
      body: JSON.stringify({
        context: "PERSONAL",
        language: "en",
      }),
    },
  );

  const attemptId = String(started._id);
  created.attemptId = new mongoose.Types.ObjectId(attemptId);

  await db.collection("assessment_attempts").updateOne(
    { _id: created.attemptId },
    { $set: { e2eTag: "RIASEC_REAL_API_FLOW_V1" } },
  );

  const attemptPayload = await api(`/attempts/${attemptId}`);
  const questions = attemptPayload?.version?.questions ?? [];

  if (questions.length !== 60) {
    throw new Error(`API returned ${questions.length} questions, expected 60.`);
  }

  const answerPattern = "12345".repeat(12);

  const responses = questions.map((question, index) => ({
    questionId: question.questionId,
    answer: answerPattern[index],
  }));

  const saved = await api(`/attempts/${attemptId}/responses`, {
    method: "PATCH",
    body: JSON.stringify({
      revision: Number(started.revision ?? 0),
      responses,
      progress: 100,
    }),
  });

  if (saved.progress !== 100 || saved.responses?.length !== 60) {
    throw new Error("API did not save all 60 RIASEC answers.");
  }

  const submitted = await api(`/attempts/${attemptId}/submit`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  if (!["SUBMITTED", "SCORING", "MATCHING", "RESULT_READY"].includes(
    submitted.status,
  )) {
    throw new Error(`Unexpected submit status ${submitted.status}.`);
  }

  let result = null;
  let finalAttempt = null;

  for (let i = 0; i < 45; i += 1) {
    try {
      result = await api(`/attempts/${attemptId}/result`);
    } catch {
      result = null;
    }

    finalAttempt = await db.collection("assessment_attempts").findOne({
      _id: created.attemptId,
    });

    if (
      result?.resultStatus === "READY" &&
      finalAttempt?.status === "RESULT_READY" &&
      result?.normalizedDimensions
    ) {
      break;
    }

    await sleep(2000);
  }

  const expectedKeys = [
    "realistic",
    "investigative",
    "artistic",
    "social",
    "enterprising",
    "conventional",
  ];

  const rawOk = expectedKeys.every(
    (key) => result?.dimensions?.[key] === 20,
  );

  const normalizedOk = expectedKeys.every(
    (key) => result?.normalizedDimensions?.[key] === 50,
  );

  const ok =
    Boolean(result) &&
    result.resultStatus === "READY" &&
    result.aiStatus === "NOT_CONFIGURED" &&
    result.reportStatus === "NOT_CONFIGURED" &&
    Array.isArray(result.careerMatches) &&
    result.careerMatches.length === 0 &&
    finalAttempt?.status === "RESULT_READY" &&
    rawOk &&
    normalizedOk;

  if (result?._id) {
    created.resultId = new mongoose.Types.ObjectId(String(result._id));
  }

  console.log(
    JSON.stringify(
      {
        ok,
        baseUrl,
        assessmentId: assessment._id.toString(),
        attemptId,
        questionCount: questions.length,
        savedAnswerCount: saved.responses?.length ?? null,
        submitStatus: submitted.status,
        finalAttemptStatus: finalAttempt?.status ?? null,
        resultStatus: result?.resultStatus ?? null,
        aiStatus: result?.aiStatus ?? null,
        reportStatus: result?.reportStatus ?? null,
        rawScores: result?.dimensions ?? null,
        normalizedScores: result?.normalizedDimensions ?? null,
        careerMatchesCount: Array.isArray(result?.careerMatches)
          ? result.careerMatches.length
          : null,
        cleanedUp: process.env.E2E_KEEP_DATA !== "1",
      },
      null,
      2,
    ),
  );

  if (!ok) {
    process.exitCode = 1;
  }

  if (ok && process.env.E2E_KEEP_DATA !== "1") {
    await db.collection("notifications").deleteMany({
      userId: created.userId,
    });

    await db.collection("assessment_results").deleteMany({
      attemptId: created.attemptId,
    });

    await db.collection("assessment_attempts").deleteOne({
      _id: created.attemptId,
    });

    await db.collection("auth_sessions").deleteOne({
      _id: created.sessionId,
    });

    await db.collection("users").deleteOne({
      _id: created.userId,
    });
  }
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        message: error instanceof Error ? error.message : String(error),
        debugIds: {
          userId: created.userId?.toString() ?? null,
          sessionId: created.sessionId?.toString() ?? null,
          attemptId: created.attemptId?.toString() ?? null,
        },
      },
      null,
      2,
    ),
  );

  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
