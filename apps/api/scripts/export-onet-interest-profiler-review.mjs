import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import mongoose from "mongoose";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI is missing.");

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
const outputPath = path.join(
  repoRoot,
  "data/curated/assessments/interest/onet-ip-60-review.json",
);

await mongoose.connect(mongoUri);

try {
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection is not ready.");

  const questions = await db
    .collection("onet_interest_questions")
    .find({ sourceVersion: "api-v2" })
    .sort({ onetIndex: 1 })
    .toArray();

  if (questions.length !== 60) {
    throw new Error(`Expected 60 questions, found ${questions.length}.`);
  }

  const review = questions.map((question) => ({
    onetIndex: question.onetIndex,
    onetArea: question.onetArea,
    originalText: question.originalText,
    adaptedText: question.adaptedText,
    adaptationStatus: question.adaptationStatus,
    adaptationVersion: question.adaptationVersion,
  }));

  await fs.writeFile(
    outputPath,
    `${JSON.stringify(review, null, 2)}\n`,
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        exportedQuestions: review.length,
        reviewFile: path.relative(repoRoot, outputPath),
      },
      null,
      2,
    ),
  );
} finally {
  await mongoose.disconnect();
}
