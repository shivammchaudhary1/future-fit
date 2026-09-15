import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateSourceRecord,
} from "./lib/career-source-utils.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

function resolveDefaultFile() {
  return path.resolve(
    here,
    "../../../data/staging/career-explorer/career-source-records.v1.json",
  );
}

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const dryRun = process.argv.includes("--dry-run");
const filePath = path.resolve(
  readArg("--file") ?? resolveDefaultFile(),
);

const raw = await fs.readFile(filePath, "utf8");
const payload = JSON.parse(raw);

if (!Array.isArray(payload.records)) {
  throw new Error("Input JSON must contain records[]");
}

for (const record of payload.records) {
  validateSourceRecord(record);
}

const bySource = payload.records.reduce(
  (acc, record) => {
    acc[record.sourceType] =
      (acc[record.sourceType] ?? 0) + 1;
    return acc;
  },
  {},
);

console.log(
  JSON.stringify(
    {
      file: filePath,
      schemaVersion: payload.schemaVersion,
      total: payload.records.length,
      bySource,
      dryRun,
    },
    null,
    2,
  ),
);

if (dryRun) {
  process.exit(0);
}

const { default: mongoose } = await import("mongoose");

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error(
    "MONGODB_URI is required. Use the root .env file.",
  );
}

await mongoose.connect(mongoUri);

try {
  const collection =
    mongoose.connection.collection(
      "career_source_records",
    );

  const now = new Date();

  const operations = payload.records.map((record) => ({
    updateOne: {
      filter: {
        sourceType: record.sourceType,
        sourceRecordKey: record.sourceRecordKey,
      },
      update: {
        $set: {
          ...record,
          sourceImportedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      upsert: true,
    },
  }));

  let matchedCount = 0;
  let modifiedCount = 0;
  let upsertedCount = 0;

  const batchSize = 500;

  for (
    let index = 0;
    index < operations.length;
    index += batchSize
  ) {
    const batch = operations.slice(
      index,
      index + batchSize,
    );

    const result = await collection.bulkWrite(
      batch,
      { ordered: false },
    );

    matchedCount += result.matchedCount;
    modifiedCount += result.modifiedCount;
    upsertedCount += result.upsertedCount;
  }

  console.log(
    JSON.stringify(
      {
        success: true,
        collection: "career_source_records",
        matchedCount,
        modifiedCount,
        upsertedCount,
        totalProcessed: operations.length,
      },
      null,
      2,
    ),
  );
} finally {
  await mongoose.disconnect();
}
