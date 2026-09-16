import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import mongoose from "mongoose";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
const mappingPath = path.join(
  repoRoot,
  "data/curated/assessments/interest/onet-ip-60-india-bilingual.v1.json",
);

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI is missing.");

const mapping = JSON.parse(await fs.readFile(mappingPath, "utf8"));

if (!Array.isArray(mapping.items) || mapping.items.length !== 60) {
  throw new Error("Expected exactly 60 adapted O*NET items.");
}

const seenIndexes = new Set();

for (const item of mapping.items) {
  if (
    !Number.isInteger(item.onetIndex) ||
    item.onetIndex < 1 ||
    item.onetIndex > 60 ||
    !["R", "I", "A", "S", "E", "C"].includes(item.onetArea) ||
    typeof item.adaptedText?.en !== "string" ||
    !item.adaptedText.en.trim() ||
    typeof item.adaptedText?.hi !== "string" ||
    !item.adaptedText.hi.trim()
  ) {
    throw new Error(`Invalid mapping near O*NET index ${item?.onetIndex}.`);
  }

  if (seenIndexes.has(item.onetIndex)) {
    throw new Error(`Duplicate mapping for O*NET index ${item.onetIndex}.`);
  }

  seenIndexes.add(item.onetIndex);
}

const areaName = {
  R: "realistic",
  I: "investigative",
  A: "artistic",
  S: "social",
  E: "enterprising",
  C: "conventional",
};

await mongoose.connect(mongoUri);

try {
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection is not ready.");

  const collection = db.collection("onet_interest_questions");

  const stored = await collection
    .find({
      sourceVersion: "api-v2",
      onetIndex: { $gte: 1, $lte: 60 },
    })
    .sort({ onetIndex: 1 })
    .toArray();

  if (stored.length !== 60) {
    throw new Error(
      `Expected 60 imported O*NET questions before adaptation, found ${stored.length}.`,
    );
  }

  for (const item of mapping.items) {
    const original = stored.find(
      (question) => question.onetIndex === item.onetIndex,
    );

    if (!original) {
      throw new Error(`Missing imported O*NET question ${item.onetIndex}.`);
    }

    if (original.onetArea !== areaName[item.onetArea]) {
      throw new Error(
        `RIASEC area mismatch at O*NET index ${item.onetIndex}: DB=${original.onetArea}, mapping=${item.onetArea}.`,
      );
    }

    await collection.updateOne(
      {
        sourceVersion: "api-v2",
        onetIndex: item.onetIndex,
      },
      {
        $set: {
          adaptedText: item.adaptedText,
          adaptationStatus: item.adaptationStatus,
          adaptationVersion: mapping.mappingVersion,
          adaptedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );
  }

  const adapted = await collection
    .find({
      sourceVersion: "api-v2",
      adaptationVersion: mapping.mappingVersion,
    })
    .sort({ onetIndex: 1 })
    .toArray();

  const countsByArea = {
    R: adapted.filter((q) => q.onetArea === "realistic").length,
    I: adapted.filter((q) => q.onetArea === "investigative").length,
    A: adapted.filter((q) => q.onetArea === "artistic").length,
    S: adapted.filter((q) => q.onetArea === "social").length,
    E: adapted.filter((q) => q.onetArea === "enterprising").length,
    C: adapted.filter((q) => q.onetArea === "conventional").length,
  };

  const bilingual = adapted.every(
    (question) =>
      typeof question.adaptedText?.en === "string" &&
      question.adaptedText.en.trim() &&
      typeof question.adaptedText?.hi === "string" &&
      question.adaptedText.hi.trim(),
  );

  const ok =
    adapted.length === 60 &&
    bilingual &&
    Object.values(countsByArea).every((count) => count === 10);

  console.log(
    JSON.stringify(
      {
        ok,
        database: db.databaseName,
        adaptedQuestions: adapted.length,
        bilingual,
        countsByArea,
        adaptationVersion: mapping.mappingVersion,
        nextStep:
          "Review wording, then convert these 60 mapped items into the published Future Fit RIASEC assessment version.",
      },
      null,
      2,
    ),
  );

  if (!ok) process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
