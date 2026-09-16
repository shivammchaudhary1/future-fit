import mongoose from "mongoose";

import { bootstrapAll } from "./lib/assessment-bootstrap.mjs";

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI is missing.");
}

await mongoose.connect(mongoUri);

try {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB connection is not ready.");
  }

  const result = await bootstrapAll(db);

  console.log(
    JSON.stringify(
      {
        ok: true,
        database: db.databaseName,
        idempotent: true,
        ...result,
      },
      null,
      2,
    ),
  );
} finally {
  await mongoose.disconnect();
}
