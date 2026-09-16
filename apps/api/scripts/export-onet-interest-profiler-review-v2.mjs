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
  "data/curated/assessments/interest/onet-ip-60-review-v2.json",
);

await mongoose.connect(mongoUri);
try {
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection is not ready.");

  const questions = await db.collection("onet_interest_questions")
    .find({ sourceVersion: "api-v2" })
    .sort({ onetIndex: 1 })
    .toArray();

  const review = questions.map((q) => ({
    onetIndex: q.onetIndex,
    onetArea: q.onetArea,
    withinAreaSequence: q.withinAreaSequence,
    originalText: q.originalText,
    adaptedText: q.adaptedText,
    adaptationVersion: q.adaptationVersion,
  }));

  await fs.writeFile(outputPath, JSON.stringify(review, null, 2) + "\n", "utf8");
  console.log(JSON.stringify({ok:true, exportedQuestions:review.length, reviewFile:path.relative(repoRoot, outputPath)}, null, 2));
} finally {
  await mongoose.disconnect();
}
