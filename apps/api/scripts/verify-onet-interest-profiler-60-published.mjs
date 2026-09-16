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

  if (!assessment?.activeVersionId) {
    throw new Error("Published RIASEC assessment not found.");
  }

  const version = await db.collection("assessment_versions").findOne({
    _id: assessment.activeVersionId,
    status: "PUBLISHED",
  });

  if (!version) throw new Error("Published active version not found.");

  const snapshots = version.questionSnapshots ?? [];
  const orders = snapshots.map((q) => q?.metadata?.onetOrder);

  const ok =
    snapshots.length === 60 &&
    version.scoringConfiguration?.scoringModel === "ONET_IP_60_V1" &&
    orders.every((value, index) => value === index + 1) &&
    snapshots.every(
      (q) =>
        q?.translations?.en?.question &&
        q?.translations?.hi?.question &&
        Array.isArray(q?.options) &&
        q.options.length === 5,
    );

  console.log(
    JSON.stringify(
      {
        ok,
        assessmentId: assessment._id.toString(),
        assessmentVersionId: version._id.toString(),
        status: assessment.status,
        versionStatus: version.status,
        questions: snapshots.length,
        scoringModel: version.scoringConfiguration?.scoringModel,
        onetOrderStart: orders.slice(0, 5),
        onetOrderEnd: orders.slice(-5),
        bilingual: snapshots.every(
          (q) =>
            Boolean(q?.translations?.en?.question) &&
            Boolean(q?.translations?.hi?.question),
        ),
      },
      null,
      2,
    ),
  );

  if (!ok) process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
