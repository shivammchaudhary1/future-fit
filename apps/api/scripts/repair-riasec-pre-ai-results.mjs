import mongoose from "mongoose";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI is missing.");

const SIX = [
  "realistic",
  "investigative",
  "artistic",
  "social",
  "enterprising",
  "conventional",
];

function validSix(record) {
  return (
    record &&
    typeof record === "object" &&
    SIX.every(
      (key) =>
        typeof record[key] === "number" &&
        Number.isFinite(record[key]),
    )
  );
}

await mongoose.connect(mongoUri);

try {
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection is not ready.");

  const results = await db
    .collection("assessment_results")
    .find({
      scoringVersion: /:ONET_IP_60_V1$/,
    })
    .toArray();

  let repaired = 0;
  const repairedAttemptIds = [];

  for (const result of results) {
    if (!validSix(result.dimensions) || !validSix(result.normalizedDimensions)) {
      continue;
    }

    const attempt = await db.collection("assessment_attempts").findOne({
      _id: result.attemptId,
    });

    if (!attempt || attempt.status === "RESULT_READY") {
      continue;
    }

    await db.collection("assessment_results").updateOne(
      { _id: result._id },
      {
        $set: {
          resultStatus: "READY",
          aiStatus: "NOT_CONFIGURED",
          reportStatus: "NOT_CONFIGURED",
          updatedAt: new Date(),
        },
        $unset: {
          reportKey: "",
          generatedAt: "",
        },
      },
    );

    await db.collection("assessment_attempts").updateOne(
      { _id: result.attemptId },
      {
        $set: {
          status: "RESULT_READY",
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    repaired += 1;
    repairedAttemptIds.push(result.attemptId.toString());
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        repaired,
        repairedAttemptIds,
        note:
          "Only ONET_IP_60_V1 attempts with complete raw and normalized RIASEC scores were repaired.",
      },
      null,
      2,
    ),
  );
} finally {
  await mongoose.disconnect();
}
