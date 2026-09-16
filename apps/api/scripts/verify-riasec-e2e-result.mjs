import mongoose from "mongoose";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI is missing.");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await mongoose.connect(mongoUri);

try {
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection is not ready.");

  const attempt = await db
    .collection("assessment_attempts")
    .find({ testTag: "RIASEC_E2E_SMOKE_V1" })
    .sort({ createdAt: -1 })
    .limit(1)
    .next();

  if (!attempt) {
    throw new Error("RIASEC E2E test attempt not found.");
  }

  let result = null;

  for (let i = 0; i < 30; i += 1) {
    result = await db.collection("assessment_results").findOne({
      attemptId: attempt._id,
    });

    if (
      result?.dimensions &&
      result?.normalizedDimensions
    ) {
      break;
    }

    await sleep(2000);
  }

  const refreshedAttempt = await db
    .collection("assessment_attempts")
    .findOne({ _id: attempt._id });

  if (!result?.dimensions || !result?.normalizedDimensions) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          attemptId: attempt._id.toString(),
          attemptStatus: refreshedAttempt?.status,
          resultFound: Boolean(result),
          reportStatus: result?.reportStatus ?? null,
          message:
            "Scored result was not available within 60 seconds. Check that Redis and the worker are running, then rerun this verifier.",
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  } else {
    console.log(
      JSON.stringify(
        {
          ok: true,
          attemptId: attempt._id.toString(),
          attemptStatus: refreshedAttempt?.status,
          scoringVersion: result.scoringVersion,
          rawScores: result.dimensions,
          normalizedScores: result.normalizedDimensions,
          careerMatchesCount: Array.isArray(result.careerMatches)
            ? result.careerMatches.length
            : null,
          reportStatus: result.reportStatus,
          expectedForBalancedPattern: {
            rawEach: 20,
            normalizedEach: 50,
          },
        },
        null,
        2,
      ),
    );
  }
} finally {
  await mongoose.disconnect();
}
