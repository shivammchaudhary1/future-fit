import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import mongoose from "mongoose";

const here = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.resolve(
  here,
  "../../../data/assessments/student-interest-pilot.v1.json",
);

const source = JSON.parse(await fs.readFile(sourcePath, "utf8"));
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI is required.");
}

function deterministicObjectId(key) {
  return new mongoose.Types.ObjectId(
    createHash("sha256")
      .update(`future-fit:${key}`)
      .digest("hex")
      .slice(0, 24),
  );
}

await mongoose.connect(mongoUri);

let failed = false;

try {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB connection is not ready.");
  }

  const assessmentId = deterministicObjectId(source.assessment.seedKey);
  const versionId = deterministicObjectId(
    `${source.assessment.seedKey}:${source.assessment.version}`,
  );

  const assessment = await db
    .collection("assessments")
    .findOne({ _id: assessmentId });

  const version = await db
    .collection("assessment_versions")
    .findOne({ _id: versionId });

  const questionIds = source.questions.map((question) =>
    deterministicObjectId(
      `${source.assessment.seedKey}:question:${question.key}`,
    ),
  );

  const questionCount = await db
    .collection("questions")
    .countDocuments({ _id: { $in: questionIds } });

  const demoStudent = await db.collection("users").findOne({
    email: "student@futurefit.dev",
  });

  const studentProfile = demoStudent
    ? await db.collection("student_profiles").findOne({
        userId: demoStudent._id,
      })
    : null;

  const careerSourceRecords = await db
    .collection("career_source_records")
    .countDocuments();

  const checks = {
    assessmentPublished:
      assessment?.status === "PUBLISHED" &&
      assessment.activeVersionId?.equals(versionId),
    versionPublished:
      version?.status === "PUBLISHED" &&
      version.questionSnapshots?.length === source.questions.length,
    questionsPresent: questionCount === source.questions.length,
    scoringModel:
      version?.scoringConfiguration?.scoringModel === "OPTION_SUM_V1",
    dimensions:
      JSON.stringify(version?.scoringConfiguration?.dimensions) ===
      JSON.stringify(["R", "I", "A", "S", "E", "C"]),
    demoStudentProfile: Boolean(studentProfile),
    careerSourceFoundation: careerSourceRecords === 1375,
  };

  failed = Object.values(checks).some((value) => !value);

  console.log(
    JSON.stringify(
      {
        ok: !failed,
        database: db.databaseName,
        checks,
        counts: {
          pilotQuestions: questionCount,
          expectedPilotQuestions: source.questions.length,
          careerSourceRecords,
        },
        assessmentId: assessmentId.toHexString(),
        versionId: versionId.toHexString(),
        note:
          "A Student Fit Profile appears after the student completes locally scored Future Fit assessments. O*NET legacy results are intentionally excluded from this aggregation.",
      },
      null,
      2,
    ),
  );

  if (failed) {
    process.exitCode = 1;
  }
} finally {
  await mongoose.disconnect();
}
