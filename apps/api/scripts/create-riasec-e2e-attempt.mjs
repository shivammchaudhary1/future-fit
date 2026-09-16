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
    throw new Error("Published Future Fit RIASEC assessment not found.");
  }

  const version = await db.collection("assessment_versions").findOne({
    _id: assessment.activeVersionId,
    status: "PUBLISHED",
  });

  if (!version) {
    throw new Error("Published RIASEC assessment version not found.");
  }

  if (version.scoringConfiguration?.scoringModel !== "ONET_IP_60_V1") {
    throw new Error("Active version is not ONET_IP_60_V1.");
  }

  const questions = [...(version.questionSnapshots ?? [])].sort(
    (a, b) => (a.metadata?.onetOrder ?? 0) - (b.metadata?.onetOrder ?? 0),
  );

  if (questions.length !== 60) {
    throw new Error(`Expected 60 questions, found ${questions.length}.`);
  }

  const studentMembership = await db
    .collection("organization_memberships")
    .findOne({
      role: "STUDENT",
      status: "ACTIVE",
    });

  if (!studentMembership?.userId) {
    throw new Error("No ACTIVE STUDENT membership found for E2E test.");
  }

  const answerPattern = "12345".repeat(12);

  const responses = questions.map((question, index) => ({
    questionId: question.questionId,
    answer: answerPattern[index],
    answeredAt: new Date(),
  }));

  const now = new Date();

  const inserted = await db.collection("assessment_attempts").insertOne({
    userId: studentMembership.userId,
    assessmentId: assessment._id,
    assessmentVersionId: version._id,
    context: "PERSONAL",
    language: "en",
    status: "SUBMITTED",
    responses,
    progress: 100,
    revision: 1,
    startedAt: now,
    lastSavedAt: now,
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
    testTag: "RIASEC_E2E_SMOKE_V1",
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        attemptId: inserted.insertedId.toString(),
        studentUserId: studentMembership.userId.toString(),
        assessmentId: assessment._id.toString(),
        assessmentVersionId: version._id.toString(),
        questionCount: questions.length,
        answerCount: responses.length,
        status: "SUBMITTED",
        note:
          "Keep the worker running. It should reconcile this submitted attempt and save assessment_results.",
      },
      null,
      2,
    ),
  );
} finally {
  await mongoose.disconnect();
}
