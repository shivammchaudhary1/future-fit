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

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to run a development pilot seed in production.");
}

function databaseNameFromUri(uri) {
  try {
    const parsed = new URL(uri);
    return decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  } catch {
    return "";
  }
}

const dbName = databaseNameFromUri(mongoUri);

if (!dbName) {
  throw new Error("MONGODB_URI must contain an explicit database name.");
}

if (/prod|production/i.test(dbName)) {
  throw new Error(`Refusing to seed database "${dbName}".`);
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

try {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB connection is not ready.");
  }

  const assessments = db.collection("assessments");
  const versions = db.collection("assessment_versions");
  const questions = db.collection("questions");
  const users = db.collection("users");
  const studentProfiles = db.collection("student_profiles");

  const creator =
    (await users.findOne({
      globalRoles: "SUPER_ADMIN",
      status: "ACTIVE",
    })) ??
    (await users.findOne({
      email: "student@futurefit.dev",
      status: "ACTIVE",
    }));

  if (!creator) {
    throw new Error(
      "Seed a development user first. No active creator account was found.",
    );
  }

  const assessmentId = deterministicObjectId(source.assessment.seedKey);
  const versionId = deterministicObjectId(
    `${source.assessment.seedKey}:${source.assessment.version}`,
  );

  const snapshots = [];
  const sectionQuestions = [];

  for (const [index, question] of source.questions.entries()) {
    const questionId = deterministicObjectId(
      `${source.assessment.seedKey}:question:${question.key}`,
    );

    const content = {
      type: "LIKERT",
      translations: question.translations,
      options: source.scale.map((option) => ({
        id: option.id,
        translations: option.translations,
        scoring: {
          [question.dimension]: option.score,
        },
      })),
      metadata: {
        dimension: question.dimension,
        category: "Future Fit original interest pilot",
      },
    };

    await questions.updateOne(
      { _id: questionId },
      {
        $set: {
          status: "ACTIVE",
          content,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          revision: 0,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    const reference = {
      questionId: questionId.toHexString(),
      order: index,
      required: question.required,
    };

    sectionQuestions.push(reference);
    snapshots.push({
      ...content,
      ...reference,
    });
  }

  const sections = [
    {
      key: source.assessment.section.key,
      translations: source.assessment.section.translations,
      questions: sectionQuestions,
    },
  ];

  await versions.updateOne(
    { _id: versionId },
    {
      $set: {
        assessmentId,
        questionSnapshots: snapshots,
        version: source.assessment.version,
        sections,
        scoringConfiguration: source.assessment.scoringConfiguration,
        status: "PUBLISHED",
        publishedAt: new Date(),
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );

  await assessments.updateOne(
    { _id: assessmentId },
    {
      $set: {
        isPaid: false,
        name: source.assessment.name,
        type: source.assessment.type,
        description: source.assessment.description,
        activeVersionId: versionId,
        status: "PUBLISHED",
        createdBy: creator._id,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );

  const demoStudent = await users.findOne({
    email: "student@futurefit.dev",
  });

  if (demoStudent) {
    await studentProfiles.updateOne(
      { userId: demoStudent._id },
      {
        $setOnInsert: {
          userId: demoStudent._id,
          grade: "10",
          board: "CBSE",
          stream: "UNDECIDED",
          state: "Delhi",
          city: "New Delhi",
          subjects: [],
          profileComplete: true,
          createdAt: new Date(),
        },
        $set: {
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  console.log(
    JSON.stringify(
      {
        success: true,
        database: db.databaseName,
        assessmentId: assessmentId.toHexString(),
        versionId: versionId.toHexString(),
        assessment: source.assessment.name,
        questions: snapshots.length,
        dimensions: source.assessment.scoringConfiguration.dimensions,
        scoringModel:
          source.assessment.scoringConfiguration.scoringModel,
        status: source.status,
        note:
          "This is a Future Fit pilot bank for development and product validation, not a psychometrically validated instrument.",
      },
      null,
      2,
    ),
  );
} finally {
  await mongoose.disconnect();
}
