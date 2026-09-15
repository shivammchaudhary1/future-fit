const { test } = require("node:test");
const assert = require("node:assert/strict");

test("career source utility normalizes titles deterministically", async () => {
  const {
    normalizeCareerTitle,
    slugifyCareerTitle,
    validateSourceRecord,
  } = await import("../scripts/lib/career-source-utils.mjs");

  assert.equal(
    normalizeCareerTitle("AI & Machine-Learning Engineer"),
    "ai and machine learning engineer",
  );

  assert.equal(
    slugifyCareerTitle("AI & Machine-Learning Engineer"),
    "ai-and-machine-learning-engineer",
  );

  const record = {
    sourceType: "LEGACY_CAREER_EXPLORER_MODERN",
    sourceRecordKey: "abc",
    sourceVersion: "v1",
    candidateSlug: "data-scientist",
    normalizedTitle: "data scientist",
    title: "Data Scientist",
    verificationStatus: "UNVERIFIED",
    provenance: { sourceSystem: "CAREER_EXPLORER" },
    fingerprint: "example",
  };

  assert.equal(validateSourceRecord(record), true);
});
