import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import mongoose from "mongoose";

const here = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(here, "../../../..");

export const CANONICAL_FILES = {
  interest: path.join(
    REPO_ROOT,
    "data/bootstrap/assessments/interest-assessment.onet-ip-60-india.v1.json",
  ),
  personality: path.join(
    REPO_ROOT,
    "data/bootstrap/assessments/personality-assessment.ipip-bffm-50-india.v1.json",
  ),
};

const AREA_CODE = {
  realistic: "R",
  investigative: "I",
  artistic: "A",
  social: "S",
  enterprising: "E",
  conventional: "C",
};

const INTEREST_DIMENSIONS = ["R", "I", "A", "S", "E", "C"];
const PERSONALITY_DIMENSIONS = [
  "EXTRAVERSION",
  "AGREEABLENESS",
  "CONSCIENTIOUSNESS",
  "EMOTIONAL_STABILITY",
  "INTELLECT_IMAGINATION",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function deterministicObjectId(key) {
  return new mongoose.Types.ObjectId(
    createHash("sha256")
      .update(`future-fit:${key}`)
      .digest("hex")
      .slice(0, 24),
  );
}

export async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, stableValue(nested)]),
    );
  }

  return value;
}

function comparableSnapshot(snapshot) {
  const {
    questionId: _questionId,
    required: _required,
    order: _order,
    ...content
  } = snapshot;

  return content;
}

function definitionHash(snapshots) {
  return createHash("sha256")
    .update(
      JSON.stringify(
        stableValue(snapshots.map(comparableSnapshot)),
      ),
    )
    .digest("hex");
}

function validateInterest(data) {
  assert(data?.schemaVersion === 1, "Interest JSON schemaVersion must be 1.");
  assert(
    data?.assessment?.stableKey === "FUTURE_FIT_RIASEC_ONET_60",
    "Unexpected Interest Assessment stableKey.",
  );
  assert(
    data?.assessment?.version === "onet-ip-60-india-bilingual-v1",
    "Unexpected Interest Assessment version.",
  );
  assert(
    data?.assessment?.scoringModel === "ONET_IP_60_V1",
    "Unexpected Interest scoring model.",
  );
  assert(
    Array.isArray(data.items) && data.items.length === 60,
    `Expected 60 Interest items; found ${data.items?.length ?? 0}.`,
  );

  const expectedOrders = Array.from({ length: 60 }, (_, index) => index + 1);
  assert(
    data.items.every((item, index) => item.order === expectedOrders[index]),
    "Interest item order must be exactly 1..60.",
  );

  const counts = Object.fromEntries(INTEREST_DIMENSIONS.map((d) => [d, 0]));

  for (const item of data.items) {
    assert(
      INTEREST_DIMENSIONS.includes(item.dimension),
      `Unknown Interest dimension at item ${item.order}.`,
    );
    counts[item.dimension] += 1;

    assert(
      item.translations?.en?.question?.trim() &&
        item.translations?.hi?.question?.trim(),
      `Interest item ${item.order} must be bilingual.`,
    );
    assert(
      typeof item.source?.originalText === "string" &&
        item.source.originalText.trim(),
      `Interest item ${item.order} is missing source text.`,
    );
  }

  for (const dimension of INTEREST_DIMENSIONS) {
    assert(
      counts[dimension] === 10,
      `Interest dimension ${dimension} must contain 10 items.`,
    );
  }

  assert(
    Array.isArray(data.responseOptions) &&
      data.responseOptions.length === 5 &&
      data.responseOptions.map((option) => option.id).join("") === "12345",
    "Interest response scale must contain IDs 1..5.",
  );
}

function validatePersonality(data) {
  assert(
    data?.schemaVersion === 1,
    "Personality JSON schemaVersion must be 1.",
  );
  assert(
    data?.assessment?.stableKey ===
      "FUTURE_FIT_PERSONALITY_IPIP_BFFM_50",
    "Unexpected Personality Assessment stableKey.",
  );
  assert(
    data?.assessment?.version === "ipip-bffm-50-india-bilingual-v1",
    "Unexpected Personality Assessment version.",
  );
  assert(
    data?.assessment?.scoringModel === "IPIP_BIG_FIVE_50_V1",
    "Unexpected Personality scoring model.",
  );
  assert(
    Array.isArray(data.items) && data.items.length === 50,
    `Expected 50 Personality items; found ${data.items?.length ?? 0}.`,
  );

  const expectedOrders = Array.from({ length: 50 }, (_, index) => index + 1);
  assert(
    data.items.every((item, index) => item.order === expectedOrders[index]),
    "Personality item order must be exactly 1..50.",
  );

  const counts = Object.fromEntries(
    PERSONALITY_DIMENSIONS.map((dimension) => [
      dimension,
      { POSITIVE: 0, REVERSE: 0, total: 0 },
    ]),
  );

  for (const item of data.items) {
    assert(
      PERSONALITY_DIMENSIONS.includes(item.dimension),
      `Unknown Personality dimension at item ${item.order}.`,
    );
    assert(
      item.direction === "POSITIVE" || item.direction === "REVERSE",
      `Invalid scoring direction at Personality item ${item.order}.`,
    );
    counts[item.dimension][item.direction] += 1;
    counts[item.dimension].total += 1;

    assert(
      item.translations?.en?.question?.trim() &&
        item.translations?.hi?.question?.trim(),
      `Personality item ${item.order} must be bilingual.`,
    );
    assert(
      typeof item.sourceText === "string" && item.sourceText.trim(),
      `Personality item ${item.order} is missing sourceText.`,
    );
  }

  const expected = data.expectedKeyCounts;

  for (const dimension of PERSONALITY_DIMENSIONS) {
    assert(
      counts[dimension].total === 10,
      `Personality dimension ${dimension} must contain 10 items.`,
    );
    assert(
      counts[dimension].POSITIVE === expected?.[dimension]?.POSITIVE &&
        counts[dimension].REVERSE === expected?.[dimension]?.REVERSE,
      `Personality key counts are wrong for ${dimension}.`,
    );
  }

  assert(
    Array.isArray(data.responseOptions) &&
      data.responseOptions.length === 5 &&
      data.responseOptions.map((option) => option.id).join("") === "12345",
    "Personality response scale must contain IDs 1..5.",
  );
}

export async function loadCanonicalData() {
  const [interest, personality] = await Promise.all([
    readJson(CANONICAL_FILES.interest),
    readJson(CANONICAL_FILES.personality),
  ]);

  validateInterest(interest);
  validatePersonality(personality);

  return { interest, personality };
}

function interestContent(item, options) {
  return {
    type: "SINGLE_SELECT",
    translations: item.translations,
    options: options.map((option) => ({
      id: option.id,
      translations: option.translations,
      scoring: {},
    })),
    metadata: {
      dimension: item.dimension,
      category: "O*NET Interest Profiler",
      onetOrder: item.order,
    },
  };
}

function personalityContent(item, options) {
  return {
    type: "LIKERT",
    translations: item.translations,
    options: options.map((option) => ({
      id: option.id,
      translations: option.translations,
      scoring: {
        [item.dimension]:
          item.direction === "POSITIVE"
            ? option.value
            : 6 - option.value,
      },
    })),
    metadata: {
      dimension: item.dimension,
      category: "Personality Assessment",
      sourceItemId: `IPIP_BFFM50_${String(item.order).padStart(2, "0")}`,
      sourceOrder: item.order,
      scoringDirection: item.direction,
    },
  };
}

function interestSource(item, data) {
  return {
    stableKey: `ONET_IP_60_${String(item.order).padStart(2, "0")}`,
    provider: "ONET",
    providerQuestionIndex: item.order,
    providerArea: item.source.onetArea,
    originalText: item.source.originalText,
    sourceVersion: item.source.sourceVersion,
    sourceRevision: item.source.sourceRevision,
    adaptationVersion: data.assessment.source.adaptationVersion,
  };
}

function personalitySource(item, data) {
  return {
    stableKey: `FUTURE_FIT_IPIP_BFFM50_${String(item.order).padStart(2, "0")}`,
    provider: "IPIP",
    instrument: data.assessment.source.instrument,
    form: data.assessment.source.form,
    sourceOrder: item.order,
    originalText: item.sourceText,
    scoringDirection: item.direction,
    adaptation: data.assessment.source.adaptation,
  };
}

function blueprintFor(kind, data) {
  if (kind === "interest") {
    return {
      kind,
      data,
      dimensions: INTEREST_DIMENSIONS,
      items: data.items,
      contentFor: (item) =>
        interestContent(item, data.responseOptions),
      sourceFor: (item) => interestSource(item, data),
      scoringConfiguration: {
        scoringModel: data.assessment.scoringModel,
        dimensions: [...INTEREST_DIMENSIONS],
        weights: {},
      },
      section: {
        key: "interest",
        translations: {
          en: "Activities and Interests",
          hi: "गतिविधियाँ और रुचियाँ",
        },
      },
      provenance: {
        provider: data.assessment.source.provider,
        instrument: data.assessment.source.instrument,
        sourceVersion: data.assessment.source.sourceVersion,
        sourceRevision: data.assessment.source.sourceRevision,
        adaptationVersion: data.assessment.source.adaptationVersion,
        sourceItemCount: 60,
        note:
          "Question order follows the original provider index. Area comes from source metadata, never inferred from index.",
      },
    };
  }

  return {
    kind,
    data,
    dimensions: PERSONALITY_DIMENSIONS,
    items: data.items,
    contentFor: (item) =>
      personalityContent(item, data.responseOptions),
    sourceFor: (item) => personalitySource(item, data),
    scoringConfiguration: {
      scoringModel: data.assessment.scoringModel,
      dimensions: [...PERSONALITY_DIMENSIONS],
      weights: {},
    },
    section: {
      key: "personality",
      translations: {
        en: "How accurately does this describe you?",
        hi: "यह कथन आपको कितनी सही तरह से बताता है?",
      },
    },
    provenance: {
      framework: data.assessment.source.framework,
      instrument: data.assessment.source.instrument,
      form: data.assessment.source.form,
      adaptation: data.assessment.source.adaptation,
      sourceItemCount: 50,
      scoring:
        "Positive items 1..5; reverse-keyed items 5..1; raw factor range 10..50.",
    },
  };
}

async function findOneByStableKey(collection, stableKey, label) {
  const found = await collection
    .find({ stableKey })
    .limit(2)
    .toArray();

  if (found.length > 1) {
    throw new Error(
      `${label}: duplicate records found for stableKey=${stableKey}.`,
    );
  }

  return found[0] ?? null;
}

async function findQuestionByStableKey(collection, stableKey) {
  const found = await collection
    .find({ "source.stableKey": stableKey })
    .limit(2)
    .toArray();

  if (found.length > 1) {
    throw new Error(
      `Duplicate questions found for source.stableKey=${stableKey}.`,
    );
  }

  return found[0] ?? null;
}

async function ensureCreator(db) {
  const users = db.collection("users");

  const superAdmin = await users.findOne({
    globalRoles: "SUPER_ADMIN",
    status: { $ne: "SUSPENDED" },
  });

  if (superAdmin) {
    return {
      id: superAdmin._id,
      mode: "existing-super-admin",
    };
  }

  const systemId = deterministicObjectId("SYSTEM_BOOTSTRAP_OWNER");
  const existingById = await users.findOne({ _id: systemId });

  if (
    existingById &&
    existingById.email !== "system-bootstrap@future-fit.invalid"
  ) {
    throw new Error(
      "Deterministic system-user ID is already occupied by another user.",
    );
  }

  await users.updateOne(
    { _id: systemId },
    {
      $setOnInsert: {
        firstName: "Future Fit",
        lastName: "System",
        email: "system-bootstrap@future-fit.invalid",
        authProviders: [],
        preferredLanguage: "en",
        globalRoles: [],
        status: "ACTIVE",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );

  return {
    id: systemId,
    mode: "system-bootstrap-owner",
  };
}

async function ensureQuestion(
  collection,
  blueprint,
  item,
) {
  const source = blueprint.sourceFor(item);
  const content = blueprint.contentFor(item);
  const existing = await findQuestionByStableKey(
    collection,
    source.stableKey,
  );

  let questionId;

  if (existing) {
    questionId = existing._id;
  } else {
    questionId = deterministicObjectId(source.stableKey);
    const collision = await collection.findOne({ _id: questionId });

    if (collision) {
      throw new Error(
        `Question ObjectId collision for ${source.stableKey}.`,
      );
    }
  }

  await collection.updateOne(
    { _id: questionId },
    {
      $set: {
        status: "ACTIVE",
        content,
        source,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        revision: 0,
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );

  return {
    questionId,
    snapshot: {
      ...content,
      questionId: questionId.toString(),
      required: true,
      order: item.order,
    },
  };
}

async function ensureAssessment(db, blueprint, creatorId) {
  const assessments = db.collection("assessments");
  const versions = db.collection("assessment_versions");
  const questions = db.collection("questions");
  const { assessment } = blueprint.data;

  let assessmentDoc = await findOneByStableKey(
    assessments,
    assessment.stableKey,
    `${blueprint.kind} assessment`,
  );

  if (!assessmentDoc) {
    const assessmentId = deterministicObjectId(
      assessment.stableKey,
    );

    const collision = await assessments.findOne({
      _id: assessmentId,
    });

    if (collision) {
      throw new Error(
        `Assessment ObjectId collision for ${assessment.stableKey}.`,
      );
    }

    await assessments.insertOne({
      _id: assessmentId,
      stableKey: assessment.stableKey,
      isPaid: false,
      name: assessment.name,
      type: assessment.type,
      description: assessment.description,
      status: "DRAFT",
      createdBy: creatorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    assessmentDoc = await assessments.findOne({
      _id: assessmentId,
    });
  }

  assert(
    assessmentDoc,
    `${blueprint.kind}: assessment could not be created.`,
  );

  const seededQuestions = [];

  for (const item of blueprint.items) {
    seededQuestions.push(
      await ensureQuestion(questions, blueprint, item),
    );
  }

  const questionSnapshots = seededQuestions.map(
    (entry) => entry.snapshot,
  );
  const questionRefs = seededQuestions.map(
    (entry) => entry.questionId,
  );

  const sections = [
    {
      ...blueprint.section,
      questions: questionRefs.map((questionId, index) => ({
        questionId: questionId.toString(),
        order: index + 1,
        required: true,
      })),
    },
  ];

  let versionDoc = await versions.findOne({
    assessmentId: assessmentDoc._id,
    version: assessment.version,
  });

  let versionAction;

  if (versionDoc?.status === "PUBLISHED") {
    const existingHash = definitionHash(
      versionDoc.questionSnapshots ?? [],
    );
    const expectedHash = definitionHash(questionSnapshots);

    assert(
      existingHash === expectedHash,
      [
        `${assessment.name}: published version ${assessment.version} differs from canonical JSON.`,
        "Published versions are immutable, so bootstrap refused to overwrite it.",
        "Create a new assessment version instead of mutating this one.",
      ].join(" "),
    );

    assert(
      versionDoc.scoringConfiguration?.scoringModel ===
        assessment.scoringModel,
      `${assessment.name}: published scoring model does not match canonical JSON.`,
    );

    versionAction = "reused-published-immutable-version";
  } else if (versionDoc) {
    await versions.updateOne(
      { _id: versionDoc._id },
      {
        $set: {
          questionSnapshots,
          sections,
          scoringConfiguration:
            blueprint.scoringConfiguration,
          provenance: blueprint.provenance,
          status: "PUBLISHED",
          publishedAt: versionDoc.publishedAt ?? new Date(),
          updatedAt: new Date(),
        },
      },
    );

    versionDoc = await versions.findOne({ _id: versionDoc._id });
    versionAction = "published-existing-draft-version";
  } else {
    const versionId = deterministicObjectId(
      `${assessment.stableKey}:${assessment.version}`,
    );

    const collision = await versions.findOne({ _id: versionId });

    if (collision) {
      throw new Error(
        `Assessment-version ObjectId collision for ${assessment.stableKey}:${assessment.version}.`,
      );
    }

    await versions.insertOne({
      _id: versionId,
      assessmentId: assessmentDoc._id,
      version: assessment.version,
      questionSnapshots,
      sections,
      scoringConfiguration: blueprint.scoringConfiguration,
      provenance: blueprint.provenance,
      status: "PUBLISHED",
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    versionDoc = await versions.findOne({ _id: versionId });
    versionAction = "created-published-version";
  }

  assert(
    versionDoc,
    `${assessment.name}: assessment version was not created.`,
  );

  await assessments.updateOne(
    { _id: assessmentDoc._id },
    {
      $set: {
        stableKey: assessment.stableKey,
        name: assessment.name,
        type: assessment.type,
        description: assessment.description,
        activeVersionId: versionDoc._id,
        status: "PUBLISHED",
        updatedAt: new Date(),
      },
    },
  );

  return {
    assessmentId: assessmentDoc._id.toString(),
    assessmentVersionId: versionDoc._id.toString(),
    questions: questionSnapshots.length,
    scoringModel: assessment.scoringModel,
    versionAction,
  };
}

async function archiveKnownPilot(db) {
  const assessments = db.collection("assessments");
  const versions = db.collection("assessment_versions");

  const pilotAssessmentId = deterministicObjectId(
    "future-fit-interest-pilot-v1",
  );
  const pilotVersionId = deterministicObjectId(
    "future-fit-interest-pilot-v1:interest-pilot-v1",
  );

  const pilot = await assessments.findOne({
    _id: pilotAssessmentId,
  });

  if (!pilot) {
    return { found: false, archived: false };
  }

  const pilotVersion = await versions.findOne({
    _id: pilotVersionId,
    assessmentId: pilotAssessmentId,
  });

  const questionCount =
    pilotVersion?.questionSnapshots?.length ?? 0;
  const scoringModel =
    pilotVersion?.scoringConfiguration?.scoringModel;

  if (
    questionCount !== 24 ||
    scoringModel !== "OPTION_SUM_V1"
  ) {
    throw new Error(
      "Known pilot IDs exist but no longer match the exact 24-question OPTION_SUM_V1 development pilot; nothing was archived.",
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

  return { found: true, archived: true };
}

function verifyNeutralPersonality(version) {
  const raw = Object.fromEntries(
    PERSONALITY_DIMENSIONS.map((dimension) => [
      dimension,
      0,
    ]),
  );

  for (const snapshot of version.questionSnapshots) {
    const dimension = snapshot.metadata?.dimension;
    const neutral = snapshot.options?.find(
      (option) => option.id === "3",
    );
    const value = neutral?.scoring?.[dimension];

    assert(
      typeof value === "number",
      `Neutral scoring is missing for ${dimension}.`,
    );

    raw[dimension] += value;
  }

  const normalized = Object.fromEntries(
    Object.entries(raw).map(([dimension, value]) => [
      dimension,
      Math.round(
        Math.max(
          0,
          Math.min(100, ((value - 10) / 40) * 100),
        ) * 100,
      ) / 100,
    ]),
  );

  for (const dimension of PERSONALITY_DIMENSIONS) {
    assert(
      raw[dimension] === 30,
      `${dimension}: neutral raw score must be 30.`,
    );
    assert(
      normalized[dimension] === 50,
      `${dimension}: neutral normalized score must be 50.`,
    );
  }

  return { raw, normalized };
}

async function verifyOne(db, blueprint) {
  const assessments = db.collection("assessments");
  const versions = db.collection("assessment_versions");
  const questions = db.collection("questions");
  const { assessment } = blueprint.data;

  const matches = await assessments
    .find({ stableKey: assessment.stableKey })
    .limit(2)
    .toArray();

  assert(
    matches.length === 1,
    `${assessment.name}: expected exactly one assessment, found ${matches.length}.`,
  );

  const assessmentDoc = matches[0];

  assert(
    assessmentDoc.status === "PUBLISHED",
    `${assessment.name}: assessment is not PUBLISHED.`,
  );
  assert(
    assessmentDoc.activeVersionId,
    `${assessment.name}: activeVersionId is missing.`,
  );

  const version = await versions.findOne({
    _id: assessmentDoc.activeVersionId,
    assessmentId: assessmentDoc._id,
    version: assessment.version,
  });

  assert(
    version,
    `${assessment.name}: active canonical version not found.`,
  );
  assert(
    version.status === "PUBLISHED",
    `${assessment.name}: active version is not PUBLISHED.`,
  );
  assert(
    version.questionSnapshots?.length ===
      blueprint.items.length,
    `${assessment.name}: wrong question count.`,
  );
  assert(
    version.scoringConfiguration?.scoringModel ===
      assessment.scoringModel,
    `${assessment.name}: wrong scoring model.`,
  );

  const expectedContents = blueprint.items.map(
    blueprint.contentFor,
  );
  const expectedHash = definitionHash(
    expectedContents.map((content, index) => ({
      ...content,
      questionId: "ignored",
      required: true,
      order: index + 1,
    })),
  );
  const actualHash = definitionHash(
    version.questionSnapshots,
  );

  assert(
    actualHash === expectedHash,
    `${assessment.name}: published snapshots differ from canonical JSON.`,
  );

  for (const item of blueprint.items) {
    const stableKey =
      blueprint.sourceFor(item).stableKey;
    const count = await questions.countDocuments({
      "source.stableKey": stableKey,
    });

    assert(
      count === 1,
      `${assessment.name}: expected one authoring question for ${stableKey}, found ${count}.`,
    );
  }

  const output = {
    assessmentId: assessmentDoc._id.toString(),
    assessmentVersionId: version._id.toString(),
    name: assessment.name,
    version: assessment.version,
    questions: version.questionSnapshots.length,
    scoringModel:
      version.scoringConfiguration.scoringModel,
    canonicalDefinitionHash: actualHash,
  };

  if (blueprint.kind === "personality") {
    output.neutralCheck = verifyNeutralPersonality(version);
  }

  return output;
}

export async function bootstrapAll(db) {
  const canonical = await loadCanonicalData();
  const creator = await ensureCreator(db);

  const interest = await ensureAssessment(
    db,
    blueprintFor("interest", canonical.interest),
    creator.id,
  );

  const personality = await ensureAssessment(
    db,
    blueprintFor(
      "personality",
      canonical.personality,
    ),
    creator.id,
  );

  const pilot = await archiveKnownPilot(db);

  return {
    creatorMode: creator.mode,
    interest,
    personality,
    obsoleteInterestPilot: pilot,
  };
}

export async function verifyAll(db) {
  const canonical = await loadCanonicalData();

  const interest = await verifyOne(
    db,
    blueprintFor("interest", canonical.interest),
  );

  const personality = await verifyOne(
    db,
    blueprintFor(
      "personality",
      canonical.personality,
    ),
  );

  const published = await db
    .collection("assessments")
    .find({ status: "PUBLISHED" })
    .project({ name: 1, type: 1, stableKey: 1 })
    .toArray();

  return {
    interest,
    personality,
    publishedAssessments: published.map((item) => ({
      id: item._id.toString(),
      name: item.name,
      type: item.type,
      stableKey: item.stableKey,
    })),
  };
}
