import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
const mappingPath = path.join(
  repoRoot,
  "data/curated/assessments/interest/onet-ip-60-india-bilingual-by-area.v2.json",
);

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI is missing.");

const mapping = JSON.parse(await fs.readFile(mappingPath, "utf8"));
const expectedAreas = [
  "realistic",
  "investigative",
  "artistic",
  "social",
  "enterprising",
  "conventional",
];

await mongoose.connect(mongoUri);

try {
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection is not ready.");

  const collection = db.collection("onet_interest_questions");
  const stored = await collection
    .find({ sourceVersion: "api-v2" })
    .sort({ onetIndex: 1 })
    .toArray();

  if (stored.length !== 60) {
    throw new Error(`Expected 60 imported O*NET questions, found ${stored.length}.`);
  }

  for (const area of expectedAreas) {
    const sourceQuestions = stored.filter((q) => q.onetArea === area);
    const adaptedItems = mapping.areas?.[area] ?? [];

    if (sourceQuestions.length !== 10 || adaptedItems.length !== 10) {
      throw new Error(
        `Expected 10 source and 10 adapted items for ${area}; source=${sourceQuestions.length}, adapted=${adaptedItems.length}.`,
      );
    }

    for (let i = 0; i < 10; i += 1) {
      const question = sourceQuestions[i];
      const adapted = adaptedItems[i];

      await collection.updateOne(
        { _id: question._id },
        {
          $set: {
            adaptedText: adapted.adaptedText,
            adaptationStatus: "READY_FOR_REVIEW",
            adaptationVersion: mapping.mappingVersion,
            withinAreaSequence: i + 1,
            adaptedAt: new Date(),
            updatedAt: new Date(),
          },
        },
      );
    }
  }

  const adapted = await collection
    .find({ adaptationVersion: mapping.mappingVersion })
    .sort({ onetIndex: 1 })
    .toArray();

  const countsByArea = Object.fromEntries(
    expectedAreas.map((area) => [
      area,
      adapted.filter((q) => q.onetArea === area).length,
    ]),
  );

  const ok =
    adapted.length === 60 &&
    Object.values(countsByArea).every((count) => count === 10) &&
    adapted.every(
      (q) =>
        typeof q.adaptedText?.en === "string" &&
        q.adaptedText.en.trim() &&
        typeof q.adaptedText?.hi === "string" &&
        q.adaptedText.hi.trim(),
    );

  console.log(
    JSON.stringify(
      {
        ok,
        database: db.databaseName,
        adaptedQuestions: adapted.length,
        countsByArea,
        firstFiveActualMappings: adapted.slice(0, 5).map((q) => ({
          onetIndex: q.onetIndex,
          onetArea: q.onetArea,
          originalText: q.originalText,
          adaptedText: q.adaptedText,
        })),
        note:
          "Area is now taken only from O*NET source data. No RIASEC area is inferred from question index.",
      },
      null,
      2,
    ),
  );

  if (!ok) process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
