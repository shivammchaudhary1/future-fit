import { createHash } from "node:crypto";
import mongoose from "mongoose";

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI is missing.");
}

const PRODUCTION_STABLE_KEY = "FUTURE_FIT_RIASEC_ONET_60";
const PILOT_SEED_KEY = "future-fit-interest-pilot-v1";
const PILOT_VERSION = "interest-pilot-v1";

const STUDENT_FACING_NAME = "Interest Assessment";
const STUDENT_FACING_DESCRIPTION =
  "A 60-question assessment that helps students understand the activities and work styles they naturally enjoy.";

function deterministicObjectId(key) {
  return new mongoose.Types.ObjectId(
    createHash("sha256")
      .update(`future-fit:${key}`)
      .digest("hex")
      .slice(0, 24),
  );
}

await mongoose.connect(mongoUri);

try {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB connection is not ready.");
  }

  const assessments = db.collection("assessments");
  const versions = db.collection("assessment_versions");

  // ---- 1. Validate the 60-question production assessment first. ----
  const production = await assessments.findOne({
    stableKey: PRODUCTION_STABLE_KEY,
  });

  if (!production) {
    throw new Error(
      "The 60-question production Interest Assessment was not found.",
    );
  }

  if (!production.activeVersionId) {
    throw new Error(
      "The 60-question production Interest Assessment has no active version.",
    );
  }

  const productionVersion = await versions.findOne({
    _id: production.activeVersionId,
    assessmentId: production._id,
  });

  if (!productionVersion) {
    throw new Error(
      "The active 60-question production version was not found.",
    );
  }

  if (
    productionVersion.scoringConfiguration?.scoringModel !==
    "ONET_IP_60_V1"
  ) {
    throw new Error(
      "Refusing to continue: the production assessment is not using the expected 60-answer scoring model.",
    );
  }

  if (productionVersion.questionSnapshots?.length !== 60) {
    throw new Error(
      `Refusing to continue: expected 60 production questions, found ${productionVersion.questionSnapshots?.length ?? 0}.`,
    );
  }

  const bilingual = productionVersion.questionSnapshots.every(
    (question) =>
      Boolean(question?.translations?.en?.question) &&
      Boolean(question?.translations?.hi?.question),
  );

  if (!bilingual) {
    throw new Error(
      "Refusing to continue: every production question must contain both English and Hindi wording.",
    );
  }

  // ---- 2. Archive only the exact obsolete 24-question development pilot. ----
  const pilotAssessmentId = deterministicObjectId(PILOT_SEED_KEY);
  const pilotVersionId = deterministicObjectId(
    `${PILOT_SEED_KEY}:${PILOT_VERSION}`,
  );

  const pilot = await assessments.findOne({
    _id: pilotAssessmentId,
  });

  let pilotArchived = false;

  if (pilot) {
    const pilotVersion = await versions.findOne({
      _id: pilotVersionId,
      assessmentId: pilotAssessmentId,
    });

    const pilotQuestionCount =
      pilotVersion?.questionSnapshots?.length ?? 0;

    const pilotScoringModel =
      pilotVersion?.scoringConfiguration?.scoringModel;

    if (
      pilotQuestionCount !== 24 ||
      pilotScoringModel !== "OPTION_SUM_V1"
    ) {
      throw new Error(
        "The old pilot IDs exist but their content no longer matches the known 24-question development pilot. Nothing was archived.",
      );
    }

    await assessments.updateOne(
      { _id: pilotAssessmentId },
      {
        $set: {
          status: "ARCHIVED",
          updatedAt: new Date(),
        },
      },
    );

    await versions.updateOne(
      { _id: pilotVersionId },
      {
        $set: {
          status: "ARCHIVED",
          updatedAt: new Date(),
        },
      },
    );

    pilotArchived = true;
  }

  // ---- 3. Update only student-facing metadata for the 60-question assessment. ----
  await assessments.updateOne(
    { _id: production._id },
    {
      $set: {
        name: STUDENT_FACING_NAME,
        description: STUDENT_FACING_DESCRIPTION,
        status: "PUBLISHED",
        updatedAt: new Date(),
      },
    },
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        productionAssessmentId:
          production._id.toString(),
        productionQuestions: 60,
        bilingualQuestions: true,
        studentFacingName: STUDENT_FACING_NAME,
        pilotArchived,
        scoringLogicChanged: false,
        productionVersionChanged: false,
        note:
          "The obsolete 24-question pilot was archived if present. Historical data was not deleted. The 60-question production scoring/version was not modified.",
      },
      null,
      2,
    ),
  );
} finally {
  await mongoose.disconnect();
}
