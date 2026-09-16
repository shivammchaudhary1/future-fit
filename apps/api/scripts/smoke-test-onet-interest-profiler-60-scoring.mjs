import mongoose from "mongoose";

const mongoUri = process.env.MONGODB_URI;
const apiKey = process.env.ONET_API_KEY;
const baseUrl =
  process.env.ONET_BASE_URL ?? "https://api-v2.onetcenter.org";

if (!mongoUri) throw new Error("MONGODB_URI is missing.");
if (!apiKey) throw new Error("ONET_API_KEY is missing.");

const answers = "12345".repeat(12);

const url = new URL("/mnm/interestprofiler/results", baseUrl);
url.searchParams.set("answers", answers);

const response = await fetch(url, {
  headers: {
    Accept: "application/json",
    "X-API-Key": apiKey,
  },
  signal: AbortSignal.timeout(15_000),
});

if (!response.ok) {
  throw new Error(`O*NET scoring returned ${response.status}.`);
}

const providerResult = await response.json();
if (!Array.isArray(providerResult?.result) || providerResult.result.length !== 6) {
  throw new Error("Invalid O*NET scoring response.");
}

const rawScores = Object.fromEntries(
  providerResult.result.map((item) => [item.code, item.score]),
);

const normalizedScores = Object.fromEntries(
  Object.entries(rawScores).map(([key, value]) => [
    key,
    Math.round((Number(value) / 40) * 10000) / 100,
  ]),
);

await mongoose.connect(mongoUri);
try {
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection is not ready.");

  await db.collection("assessment_scoring_smoke_tests").insertOne({
    testType: "ONET_IP_60_V1",
    answers,
    rawScores,
    normalizedScores,
    providerResult,
    createdAt: new Date(),
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        answerCount: answers.length,
        rawScores,
        normalizedScores,
        savedSmokeTest: true,
      },
      null,
      2,
    ),
  );
} finally {
  await mongoose.disconnect();
}
