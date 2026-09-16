import fs from "node:fs/promises";
import mongoose from "mongoose";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI is missing.");

const approved = JSON.parse(
  await fs.readFile(
    "../../data/curated/assessments/interest/onet-ip-60-india-bilingual-by-area.v2.json",
    "utf8",
  ),
);

const official = JSON.parse(
  await fs.readFile(
    "../../data/reference/onet-interest-profiler-short-form-60-by-area.json",
    "utf8",
  ),
);

const AREA_CODE = {
  realistic: "R",
  investigative: "I",
  artistic: "A",
  social: "S",
  enterprising: "E",
  conventional: "C",
};

function canonical(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "");
}

await mongoose.connect(mongoUri);

try {
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection is not ready.");

  const sourceQuestions = await db
    .collection("onet_interest_questions")
    .find({
      sourceVersion: "api-v2",
      adaptationVersion: approved.mappingVersion,
    })
    .sort({ onetIndex: 1 })
    .toArray();

  const failures = [];

  if (sourceQuestions.length !== 60) {
    failures.push(
      `Expected 60 adapted source questions, found ${sourceQuestions.length}.`,
    );
  }

  const uniqueIndexes = new Set(sourceQuestions.map((q) => q.onetIndex));
  if (uniqueIndexes.size !== 60) {
    failures.push("O*NET indexes are not unique.");
  }

  for (const [area, code] of Object.entries(AREA_CODE)) {
    const areaQuestions = sourceQuestions
      .filter((q) => q.onetArea === area)
      .sort((a, b) => a.onetIndex - b.onetIndex);

    if (areaQuestions.length !== 10) {
      failures.push(`${area}: expected 10 questions, found ${areaQuestions.length}.`);
      continue;
    }

    const approvedArea = approved.areas[area];
    const officialArea = official.areas[area];

    for (let i = 0; i < 10; i += 1) {
      const actual = areaQuestions[i];
      const expectedOriginal = officialArea[i];
      const expectedAdapted = approvedArea[i]?.adaptedText;

      if (canonical(actual.originalText) !== canonical(expectedOriginal)) {
        failures.push(
          `${area} sequence ${i + 1}: source text does not match the approved O*NET source item.`,
        );
      }

      if (actual.adaptedText?.en !== expectedAdapted?.en) {
        failures.push(
          `${area} sequence ${i + 1}: English adaptation mismatch.`,
        );
      }

      if (actual.adaptedText?.hi !== expectedAdapted?.hi) {
        failures.push(
          `${area} sequence ${i + 1}: Hindi adaptation mismatch.`,
        );
      }

      if (!/[\u0900-\u097F]/.test(actual.adaptedText?.hi ?? "")) {
        failures.push(
          `${area} sequence ${i + 1}: Hindi adaptation has no Devanagari text.`,
        );
      }

      if (actual.onetArea !== area || !AREA_CODE[actual.onetArea]) {
        failures.push(
          `${area} sequence ${i + 1}: invalid RIASEC area mapping.`,
        );
      }
    }
  }

  const assessment = await db.collection("assessments").findOne({
    stableKey: "FUTURE_FIT_RIASEC_ONET_60",
    status: "PUBLISHED",
  });

  if (!assessment?.activeVersionId) {
    failures.push("Published RIASEC assessment/active version is missing.");
  }

  const version = assessment?.activeVersionId
    ? await db.collection("assessment_versions").findOne({
        _id: assessment.activeVersionId,
        status: "PUBLISHED",
      })
    : null;

  if (!version) {
    failures.push("Published active RIASEC version is missing.");
  } else {
    if (version.scoringConfiguration?.scoringModel !== "ONET_IP_60_V1") {
      failures.push("Published version does not use ONET_IP_60_V1.");
    }

    const snapshots = version.questionSnapshots ?? [];
    if (snapshots.length !== 60) {
      failures.push(`Published snapshot has ${snapshots.length} questions, expected 60.`);
    }

    const sourceByIndex = new Map(
      sourceQuestions.map((q) => [q.onetIndex, q]),
    );

    for (const snapshot of snapshots) {
      const index = snapshot.metadata?.onetOrder;
      const source = sourceByIndex.get(index);

      if (!source) {
        failures.push(`Published snapshot has unknown O*NET index ${index}.`);
        continue;
      }

      if (snapshot.translations?.en?.question !== source.adaptedText?.en) {
        failures.push(`Published English text mismatch at O*NET index ${index}.`);
      }

      if (snapshot.translations?.hi?.question !== source.adaptedText?.hi) {
        failures.push(`Published Hindi text mismatch at O*NET index ${index}.`);
      }

      if (snapshot.metadata?.dimension !== AREA_CODE[source.onetArea]) {
        failures.push(`Published RIASEC dimension mismatch at O*NET index ${index}.`);
      }

      const optionIds = (snapshot.options ?? []).map((o) => o.id).join("");
      if (optionIds !== "12345") {
        failures.push(`Answer options are invalid at O*NET index ${index}.`);
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: failures.length === 0,
        checkedSourceQuestions: sourceQuestions.length,
        sourceAreas: Object.fromEntries(
          Object.keys(AREA_CODE).map((area) => [
            area,
            sourceQuestions.filter((q) => q.onetArea === area).length,
          ]),
        ),
        sourceTextAlignment: failures.filter((x) =>
          x.includes("source text"),
        ).length === 0,
        bilingualAdaptationAlignment:
          failures.filter(
            (x) =>
              x.includes("English adaptation") ||
              x.includes("Hindi adaptation"),
          ).length === 0,
        publishedSnapshotAlignment:
          failures.filter((x) => x.includes("Published")).length === 0,
        failures,
      },
      null,
      2,
    ),
  );

  if (failures.length) {
    process.exitCode = 1;
  }
} finally {
  await mongoose.disconnect();
}
