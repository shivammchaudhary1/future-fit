import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import mongoose from "mongoose";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
const snapshotPath = path.join(
  repoRoot,
  "data/raw/onet/interest-profiler-short-form-60.json",
);

const apiKey = process.env.ONET_API_KEY;
const baseUrl =
  process.env.ONET_BASE_URL ?? "https://api-v2.onetcenter.org";
const mongoUri = process.env.MONGODB_URI;

if (!apiKey) {
  throw new Error("ONET_API_KEY is missing.");
}

if (!mongoUri) {
  throw new Error("MONGODB_URI is missing.");
}

const url = new URL("/mnm/interestprofiler/questions", baseUrl);
url.searchParams.set("start", "1");
url.searchParams.set("end", "60");

const response = await fetch(url, {
  headers: {
    Accept: "application/json",
    "X-API-Key": apiKey,
  },
  signal: AbortSignal.timeout(15_000),
});

if (!response.ok) {
  throw new Error(
    `O*NET question request failed with status ${response.status}.`,
  );
}

const payload = await response.json();

const questions = Array.isArray(payload?.question)
  ? payload.question
  : [];
const answerOptions = Array.isArray(payload?.answer_option)
  ? payload.answer_option
  : [];

if (payload?.total !== 60 || questions.length !== 60) {
  throw new Error(
    `Expected exactly 60 O*NET questions, received total=${payload?.total}, questions=${questions.length}.`,
  );
}

const expectedAreas = new Set([
  "realistic",
  "investigative",
  "artistic",
  "social",
  "enterprising",
  "conventional",
]);

const indexes = new Set();

for (const question of questions) {
  if (
    !Number.isInteger(question?.index) ||
    question.index < 1 ||
    question.index > 60 ||
    typeof question?.text !== "string" ||
    !question.text.trim() ||
    !expectedAreas.has(question?.area)
  ) {
    throw new Error(
      `Invalid O*NET question payload near index ${question?.index ?? "unknown"}.`,
    );
  }

  if (indexes.has(question.index)) {
    throw new Error(`Duplicate O*NET index ${question.index}.`);
  }

  indexes.add(question.index);
}

const optionValues = answerOptions
  .map((option) => option?.value)
  .sort((a, b) => a - b);

if (JSON.stringify(optionValues) !== JSON.stringify([1, 2, 3, 4, 5])) {
  throw new Error("O*NET answer scale is not the expected 1–5 scale.");
}

questions.sort((a, b) => a.index - b.index);

const countsByArea = Object.fromEntries(
  [...expectedAreas].map((area) => [
    area,
    questions.filter((question) => question.area === area).length,
  ]),
);

for (const [area, count] of Object.entries(countsByArea)) {
  if (count !== 10) {
    throw new Error(
      `Expected 10 questions for ${area}, received ${count}.`,
    );
  }
}

const snapshot = {
  source: "O*NET Interest Profiler",
  sourceVersion: "api-v2",
  sourcePath: "/mnm/interestprofiler/questions",
  sourceRevision: "2018-05-01",
  fetchedAt: new Date().toISOString(),
  total: 60,
  answerOptions,
  questions: questions.map((question) => ({
    onetIndex: question.index,
    onetArea: question.area,
    originalText: question.text,
    adaptedText: null,
    adaptationStatus: "PENDING",
  })),
};

await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
await fs.writeFile(
  snapshotPath,
  `${JSON.stringify(snapshot, null, 2)}\n`,
  "utf8",
);

await mongoose.connect(mongoUri);

try {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB connection is not ready.");
  }

  const collection = db.collection("onet_interest_questions");

  await collection.createIndex(
    { sourceVersion: 1, onetIndex: 1 },
    { unique: true },
  );

  for (const question of snapshot.questions) {
    await collection.updateOne(
      {
        sourceVersion: snapshot.sourceVersion,
        onetIndex: question.onetIndex,
      },
      {
        $set: {
          source: snapshot.source,
          sourceVersion: snapshot.sourceVersion,
          sourceRevision: snapshot.sourceRevision,
          onetIndex: question.onetIndex,
          onetArea: question.onetArea,
          originalText: question.originalText,
          answerScale: answerOptions,
          fetchedAt: new Date(snapshot.fetchedAt),
          updatedAt: new Date(),
        },
        $setOnInsert: {
          adaptedText: null,
          adaptationStatus: "PENDING",
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  const stored = await collection.countDocuments({
    sourceVersion: snapshot.sourceVersion,
    onetIndex: { $gte: 1, $lte: 60 },
  });

  if (stored !== 60) {
    throw new Error(
      `Expected 60 stored O*NET questions, found ${stored}.`,
    );
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        apiConnected: true,
        database: db.databaseName,
        storedQuestions: stored,
        snapshotPath: path.relative(repoRoot, snapshotPath),
        countsByArea,
        nextStep:
          "Adapt originalText into Indian student-friendly adaptedText while preserving onetIndex and onetArea.",
      },
      null,
      2,
    ),
  );
} finally {
  await mongoose.disconnect();
}
