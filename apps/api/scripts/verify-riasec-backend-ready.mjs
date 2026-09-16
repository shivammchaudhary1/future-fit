import mongoose from "mongoose";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI is missing.");

await mongoose.connect(mongoUri);

try {
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection is not ready.");

  const assessment = await db.collection("assessments").findOne({
    stableKey: "FUTURE_FIT_RIASEC_ONET_60",
    status: "PUBLISHED",
  });

  const version = assessment?.activeVersionId
    ? await db.collection("assessment_versions").findOne({
        _id: assessment.activeVersionId,
        status: "PUBLISHED",
      })
    : null;

  const latestReady = await db
    .collection("assessment_results")
    .find({
      scoringVersion: /:ONET_IP_60_V1$/,
      resultStatus: "READY",
    })
    .sort({ updatedAt: -1 })
    .limit(1)
    .next();

  const output = {
    ok:
      Boolean(assessment?.activeVersionId) &&
      Boolean(version) &&
      version.questionSnapshots?.length === 60 &&
      version.scoringConfiguration?.scoringModel === "ONET_IP_60_V1",
    published: Boolean(assessment),
    questions: version?.questionSnapshots?.length ?? 0,
    scoringModel: version?.scoringConfiguration?.scoringModel ?? null,
    latestReadyResultFound: Boolean(latestReady),
    aiRequiredForCoreResult: false,
    reportRequiredForCoreResult: false,
    careerMatchingProvider: "FUTURE_FIT_LATER",
  };

  console.log(JSON.stringify(output, null, 2));

  if (!output.ok) process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
