import { createHash } from "node:crypto";
import mongoose from "mongoose";

import {
  EXPECTED_KEY_COUNTS,
  PERSONALITY_ASSESSMENT,
  PERSONALITY_DIMENSIONS,
} from "../../../data/assessments/personality-ipip-bffm-50-india.v1.mjs";

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI is missing.");
}

function deterministicObjectId(key) {
  return new mongoose.Types.ObjectId(
    createHash("sha256")
      .update(`future-fit:${key}`)
      .digest("hex")
      .slice(0, 24),
  );
}

function scoredValue(snapshot, answerId) {
  const option = snapshot.options.find(
    (candidate) => candidate.id === answerId,
  );

  if (!option) {
    throw new Error(
      `Answer option ${answerId} not found for question ${snapshot.order}.`,
    );
  }

  const dimension = snapshot.metadata.dimension;
  const value = option.scoring?.[dimension];

  if (typeof value !== "number") {
    throw new Error(
      `Scoring value missing for question ${snapshot.order}.`,
    );
  }

  return value;
}

function scoreUniformAnswer(snapshots, answerId) {
  const raw = Object.fromEntries(
    PERSONALITY_DIMENSIONS.map((dimension) => [dimension, 0]),
  );

  for (const snapshot of snapshots) {
    const dimension = snapshot.metadata.dimension;
    raw[dimension] += scoredValue(snapshot, answerId);
  }

  const normalized = Object.fromEntries(
    Object.entries(raw).map(([dimension, value]) => [
      dimension,
      Math.round(
        Math.max(0, Math.min(100, ((value - 10) / 40) * 100)) * 100,
      ) / 100,
    ]),
  );

  return { raw, normalized };
}

await mongoose.connect(mongoUri);

try {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB connection is not ready.");
  }

  const assessmentId = deterministicObjectId(PERSONALITY_ASSESSMENT.stableKey);
  const versionId = deterministicObjectId(
    `${PERSONALITY_ASSESSMENT.stableKey}:${PERSONALITY_ASSESSMENT.version}`,
  );

  const assessment = await db.collection("assessments").findOne({
    _id: assessmentId,
  });

  const version = await db.collection("assessment_versions").findOne({
    _id: versionId,
    assessmentId,
  });

  const failures = [];

  if (!assessment) failures.push("Assessment document missing.");
  if (!version) failures.push("Assessment version missing.");

  if (assessment) {
    if (assessment.name !== "Personality Assessment")
      failures.push("Unexpected assessment name.");
    if (assessment.type !== "PERSONALITY")
      failures.push("Unexpected assessment type.");
    if (assessment.status !== "PUBLISHED")
      failures.push("Assessment is not published.");
    if (!assessment.activeVersionId?.equals(versionId))
      failures.push("Active version id mismatch.");
  }

  if (version) {
    if (version.status !== "PUBLISHED")
      failures.push("Version is not published.");
    if (version.version !== PERSONALITY_ASSESSMENT.version)
      failures.push("Version name mismatch.");
    if (
      version.scoringConfiguration?.scoringModel !==
      PERSONALITY_ASSESSMENT.scoringModel
    )
      failures.push("Scoring model mismatch.");
    if (version.questionSnapshots?.length !== 50)
      failures.push("Expected exactly 50 snapshots.");

    const snapshots = version.questionSnapshots ?? [];
    const order = snapshots.map((snapshot) => snapshot.order);

    if (
      order.some(
        (value, index) => value !== index + 1,
      )
    ) {
      failures.push("Snapshot order is not 1..50.");
    }

    const counts = Object.fromEntries(
      PERSONALITY_DIMENSIONS.map((dimension) => [
        dimension,
        { POSITIVE: 0, REVERSE: 0, total: 0 },
      ]),
    );

    for (const snapshot of snapshots) {
      const dimension = snapshot.metadata?.dimension;
      const direction = snapshot.metadata?.scoringDirection;

      if (!counts[dimension]) {
        failures.push(
          `Unknown dimension at question ${snapshot.order}.`,
        );
        continue;
      }

      if (!["POSITIVE", "REVERSE"].includes(direction)) {
        failures.push(
          `Missing scoring direction at question ${snapshot.order}.`,
        );
        continue;
      }

      counts[dimension][direction] += 1;
      counts[dimension].total += 1;

      if (
        !snapshot.translations?.en?.question ||
        !snapshot.translations?.hi?.question
      ) {
        failures.push(
          `Question ${snapshot.order} is not bilingual.`,
        );
      }

      if (snapshot.options?.length !== 5) {
        failures.push(
          `Question ${snapshot.order} does not have 5 options.`,
        );
      } else {
        const expectedPositive = [1, 2, 3, 4, 5];
        const expectedReverse = [5, 4, 3, 2, 1];
        const expected =
          direction === "POSITIVE"
            ? expectedPositive
            : expectedReverse;
        const actual = snapshot.options.map(
          (option) => option.scoring?.[dimension],
        );

        if (
          actual.length !== expected.length ||
          actual.some(
            (value, index) => value !== expected[index],
          )
        ) {
          failures.push(
            `Question ${snapshot.order} has an invalid ${direction} scoring key.`,
          );
        }
      }
    }

    for (const dimension of PERSONALITY_DIMENSIONS) {
      const actual = counts[dimension];
      const expected = EXPECTED_KEY_COUNTS[dimension];

      if (
        actual.total !== 10 ||
        actual.POSITIVE !== expected.POSITIVE ||
        actual.REVERSE !== expected.REVERSE
      ) {
        failures.push(
          `${dimension} item/key count mismatch.`,
        );
      }
    }

    if (snapshots.length === 50) {
      const neutral = scoreUniformAnswer(snapshots, "3");

      for (const dimension of PERSONALITY_DIMENSIONS) {
        if (neutral.raw[dimension] !== 30)
          failures.push(
            `${dimension} neutral raw score should be 30.`,
          );
        if (neutral.normalized[dimension] !== 50)
          failures.push(
            `${dimension} neutral normalized score should be 50.`,
          );
      }
    }
  }

  const ok = failures.length === 0;

  console.log(
    JSON.stringify(
      {
        ok,
        assessmentId: assessmentId.toString(),
        assessmentVersionId: versionId.toString(),
        published: assessment?.status === "PUBLISHED",
        questions: version?.questionSnapshots?.length ?? 0,
        scoringModel:
          version?.scoringConfiguration?.scoringModel ?? null,
        rawRangePerDimension: [10, 50],
        normalizedRangePerDimension: [0, 100],
        neutralAnswerExpectedRaw: 30,
        neutralAnswerExpectedNormalized: 50,
        failures,
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
