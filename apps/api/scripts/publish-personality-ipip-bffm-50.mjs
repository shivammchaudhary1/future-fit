import { createHash } from "node:crypto";
import mongoose from "mongoose";

import {
  EXPECTED_KEY_COUNTS,
  PERSONALITY_ASSESSMENT,
  PERSONALITY_DIMENSIONS,
  PERSONALITY_ITEMS,
  PERSONALITY_RESPONSE_OPTIONS,
} from "../../../data/assessments/personality-ipip-bffm-50-india.v1.mjs";

/**
 * Publishes the Future Fit Personality Assessment.
 *
 * Source basis is documented in the data module:
 * IPIP / Goldberg (1992) Big-Five Factor Markers, 50-item short form.
 *
 * Design:
 * - 50 items, 10 per broad factor.
 * - 5 response choices.
 * - Positive items score 1..5.
 * - Reverse-keyed items score 5..1.
 * - Raw factor range: 10..50.
 * - Worker stores normalized factor score:
 *   ((raw - 10) / 40) * 100.
 *
 * Published assessment versions are immutable. If this exact version already
 * exists and is published, the script validates and reuses it instead of
 * modifying its snapshots.
 */

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

function countItems() {
  const countByDimension = Object.fromEntries(
    PERSONALITY_DIMENSIONS.map((dimension) => [
      dimension,
      { POSITIVE: 0, REVERSE: 0, total: 0 },
    ]),
  );

  for (const item of PERSONALITY_ITEMS) {
    const bucket = countByDimension[item.dimension];

    if (!bucket) {
      throw new Error(`Unknown dimension at item ${item.order}.`);
    }

    bucket[item.direction] += 1;
    bucket.total += 1;
  }

  return countByDimension;
}

function validateSourceData() {
  if (PERSONALITY_ITEMS.length !== 50) {
    throw new Error(
      `Expected exactly 50 personality items; found ${PERSONALITY_ITEMS.length}.`,
    );
  }

  const orders = PERSONALITY_ITEMS.map((item) => item.order);
  const expectedOrders = Array.from({ length: 50 }, (_, index) => index + 1);

  if (orders.some((order, index) => order !== expectedOrders[index])) {
    throw new Error("Personality item order must be exactly 1..50.");
  }

  if (new Set(PERSONALITY_ITEMS.map((item) => item.sourceText)).size !== 50) {
    throw new Error("Duplicate source personality item detected.");
  }

  const counts = countItems();

  for (const dimension of PERSONALITY_DIMENSIONS) {
    const actual = counts[dimension];
    const expected = EXPECTED_KEY_COUNTS[dimension];

    if (actual.total !== 10) {
      throw new Error(`${dimension} must contain exactly 10 items.`);
    }

    if (
      actual.POSITIVE !== expected.POSITIVE ||
      actual.REVERSE !== expected.REVERSE
    ) {
      throw new Error(
        `${dimension} key counts do not match the source scoring key.`,
      );
    }
  }

  if (
    PERSONALITY_ITEMS.some(
      (item) =>
        !item.translations.en.question ||
        !item.translations.hi.question ||
        !item.sourceText,
    )
  ) {
    throw new Error("Every personality item must be bilingual and sourced.");
  }
}

function scoredOptions(dimension, direction) {
  return PERSONALITY_RESPONSE_OPTIONS.map((option) => ({
    id: option.id,
    translations: option.translations,
    scoring: {
      [dimension]:
        direction === "POSITIVE" ? option.value : 6 - option.value,
    },
  }));
}

function contentFor(item) {
  return {
    type: "LIKERT",
    translations: item.translations,
    options: scoredOptions(item.dimension, item.direction),
    metadata: {
      dimension: item.dimension,
      category: "Personality Assessment",
      sourceItemId: `IPIP_BFFM50_${String(item.order).padStart(2, "0")}`,
      sourceOrder: item.order,
      scoringDirection: item.direction,
    },
  };
}

validateSourceData();

await mongoose.connect(mongoUri);

try {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB connection is not ready.");
  }

  const users = db.collection("users");
  const questions = db.collection("questions");
  const assessments = db.collection("assessments");
  const versions = db.collection("assessment_versions");

  const creator = await users.findOne({
    globalRoles: "SUPER_ADMIN",
    status: { $ne: "DISABLED" },
  });

  if (!creator) {
    throw new Error(
      "SUPER_ADMIN user not found; cannot set Personality Assessment createdBy.",
    );
  }

  const assessmentId = deterministicObjectId(PERSONALITY_ASSESSMENT.stableKey);
  const versionId = deterministicObjectId(
    `${PERSONALITY_ASSESSMENT.stableKey}:${PERSONALITY_ASSESSMENT.version}`,
  );

  const existingPublishedVersion = await versions.findOne({
    _id: versionId,
    assessmentId,
    version: PERSONALITY_ASSESSMENT.version,
    status: "PUBLISHED",
  });

  if (existingPublishedVersion) {
    if (
      existingPublishedVersion.questionSnapshots?.length !== 50 ||
      existingPublishedVersion.scoringConfiguration?.scoringModel !==
        PERSONALITY_ASSESSMENT.scoringModel
    ) {
      throw new Error(
        "Published personality version exists but does not match the expected immutable 50-item definition.",
      );
    }

    await assessments.updateOne(
      { _id: assessmentId },
      {
        $set: {
          stableKey: PERSONALITY_ASSESSMENT.stableKey,
          name: PERSONALITY_ASSESSMENT.name,
          type: PERSONALITY_ASSESSMENT.type,
          description: PERSONALITY_ASSESSMENT.description,
          activeVersionId: versionId,
          status: "PUBLISHED",
          updatedAt: new Date(),
        },
        $setOnInsert: {
          isPaid: false,
          createdBy: creator._id,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          reusedImmutableVersion: true,
          assessmentId: assessmentId.toString(),
          assessmentVersionId: versionId.toString(),
          questions: 50,
          scoringModel: PERSONALITY_ASSESSMENT.scoringModel,
        },
        null,
        2,
      ),
    );

    process.exit(0);
  }

  const questionIds = [];

  for (const item of PERSONALITY_ITEMS) {
    const stableKey = `FUTURE_FIT_IPIP_BFFM50_${String(item.order).padStart(
      2,
      "0",
    )}`;

    const questionId = deterministicObjectId(stableKey);
    const content = contentFor(item);

    await questions.updateOne(
      { _id: questionId },
      {
        $set: {
          status: "ACTIVE",
          content,
          source: {
            stableKey,
            provider: "IPIP",
            instrument: "Goldberg (1992) Big-Five Factor Markers",
            form: "50-item short scale",
            sourceOrder: item.order,
            originalText: item.sourceText,
            scoringDirection: item.direction,
            adaptation:
              PERSONALITY_ASSESSMENT.source.adaptation,
          },
          updatedAt: new Date(),
        },
        $setOnInsert: {
          revision: 0,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    questionIds.push(questionId);
  }

  const hydratedQuestions = await questions
    .find({ _id: { $in: questionIds } })
    .toArray();

  const byId = new Map(
    hydratedQuestions.map((question) => [
      question._id.toString(),
      question,
    ]),
  );

  const questionSnapshots = questionIds.map((questionId, index) => {
    const question = byId.get(questionId.toString());

    if (!question?.content) {
      throw new Error(
        `Question ${questionId.toString()} is missing after upsert.`,
      );
    }

    return {
      ...question.content,
      questionId: questionId.toString(),
      required: true,
      order: index + 1,
    };
  });

  const sections = [
    {
      key: "personality",
      translations: {
        en: "How accurately does this describe you?",
        hi: "यह कथन आपको कितनी सही तरह से बताता है?",
      },
      questions: questionIds.map((questionId, index) => ({
        questionId: questionId.toString(),
        order: index + 1,
        required: true,
      })),
    },
  ];

  const scoringConfiguration = {
    scoringModel: PERSONALITY_ASSESSMENT.scoringModel,
    dimensions: [...PERSONALITY_DIMENSIONS],
    weights: {},
  };

  await versions.updateOne(
    { _id: versionId },
    {
      $setOnInsert: {
        assessmentId,
        version: PERSONALITY_ASSESSMENT.version,
        questionSnapshots,
        sections,
        scoringConfiguration,
        provenance: {
          framework: PERSONALITY_ASSESSMENT.source.framework,
          instrument: PERSONALITY_ASSESSMENT.source.instrument,
          form: PERSONALITY_ASSESSMENT.source.form,
          adaptation: PERSONALITY_ASSESSMENT.source.adaptation,
          sourceItemCount: 50,
          scoring:
            "Positive items 1..5; reverse-keyed items 5..1; raw factor range 10..50.",
        },
        status: "PUBLISHED",
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );

  const insertedVersion = await versions.findOne({ _id: versionId });

  if (
    !insertedVersion ||
    insertedVersion.questionSnapshots?.length !== 50 ||
    insertedVersion.scoringConfiguration?.scoringModel !==
      PERSONALITY_ASSESSMENT.scoringModel
  ) {
    throw new Error("Personality assessment version failed verification.");
  }

  await assessments.updateOne(
    { _id: assessmentId },
    {
      $set: {
        stableKey: PERSONALITY_ASSESSMENT.stableKey,
        name: PERSONALITY_ASSESSMENT.name,
        type: PERSONALITY_ASSESSMENT.type,
        description: PERSONALITY_ASSESSMENT.description,
        activeVersionId: versionId,
        status: "PUBLISHED",
        updatedAt: new Date(),
      },
      $setOnInsert: {
        isPaid: false,
        createdBy: creator._id,
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );

  const counts = countItems();

  console.log(
    JSON.stringify(
      {
        ok: true,
        reusedImmutableVersion: false,
        assessmentId: assessmentId.toString(),
        assessmentVersionId: versionId.toString(),
        name: PERSONALITY_ASSESSMENT.name,
        version: PERSONALITY_ASSESSMENT.version,
        questions: questionSnapshots.length,
        dimensions: PERSONALITY_DIMENSIONS,
        keyCounts: counts,
        rawRangePerDimension: [10, 50],
        normalizedRangePerDimension: [0, 100],
        scoringModel: PERSONALITY_ASSESSMENT.scoringModel,
        source: PERSONALITY_ASSESSMENT.source,
      },
      null,
      2,
    ),
  );
} finally {
  await mongoose.disconnect();
}
