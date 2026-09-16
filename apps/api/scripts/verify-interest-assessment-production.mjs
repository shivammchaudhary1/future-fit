import mongoose from "mongoose";

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

  const assessments = db.collection("assessments");
  const versions = db.collection("assessment_versions");

  const publishedInterestAssessments = await assessments
    .find({
      type: "INTEREST",
      status: "PUBLISHED",
    })
    .toArray();

  const checks = [];

  for (const assessment of publishedInterestAssessments) {
    const version = assessment.activeVersionId
      ? await versions.findOne({
          _id: assessment.activeVersionId,
          assessmentId: assessment._id,
        })
      : null;

    checks.push({
      assessmentId: assessment._id.toString(),
      name: assessment.name,
      questions: version?.questionSnapshots?.length ?? 0,
      scoringModel:
        version?.scoringConfiguration?.scoringModel ?? null,
      bilingual:
        version?.questionSnapshots?.every(
          (question) =>
            Boolean(question?.translations?.en?.question) &&
            Boolean(question?.translations?.hi?.question),
        ) ?? false,
    });
  }

  const production = checks.find(
    (entry) =>
      entry.questions === 60 &&
      entry.scoringModel === "ONET_IP_60_V1" &&
      entry.bilingual,
  );

  const obsoletePilotStillPublished = checks.some(
    (entry) =>
      entry.questions === 24 ||
      entry.scoringModel === "OPTION_SUM_V1",
  );

  const ok =
    publishedInterestAssessments.length === 1 &&
    Boolean(production) &&
    production?.name === "Interest Assessment" &&
    !obsoletePilotStillPublished;

  console.log(
    JSON.stringify(
      {
        ok,
        publishedInterestAssessments:
          publishedInterestAssessments.length,
        productionQuestions:
          production?.questions ?? null,
        bilingual:
          production?.bilingual ?? false,
        obsolete24QuestionPilotPublished:
          obsoletePilotStillPublished,
        studentFacingName:
          production?.name ?? null,
        checks,
      },
      null,
      2,
    ),
  );

  if (!ok) {
    process.exitCode = 1;
  }
} finally {
  await mongoose.disconnect();
}
