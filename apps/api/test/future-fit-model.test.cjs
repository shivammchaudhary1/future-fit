const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  FUTURE_FIT_MODEL_VERSION,
  composeStudentFitProfile,
  deriveDimensionRanges,
  matchCareerProfile,
  normalizeDimensionScores,
} = require("@future-fit/validation");

function likertQuestion({
  id,
  dimension,
  reverse = false,
}) {
  const scores = reverse
    ? [5, 4, 3, 2, 1]
    : [1, 2, 3, 4, 5];

  return {
    questionId: id,
    order: 0,
    required: true,
    type: "LIKERT",
    translations: {
      en: { question: "Example" },
      hi: { question: "उदाहरण" },
    },
    options: scores.map((score, index) => ({
      id: String(index + 1),
      translations: {
        en: String(index + 1),
        hi: String(index + 1),
      },
      scoring: { [dimension]: score },
    })),
    metadata: { dimension },
  };
}

test("normalization converts theoretical score range to 0-100", () => {
  const questions = [
    likertQuestion({
      id: "507f1f77bcf86cd799439011",
      dimension: "I",
    }),
    likertQuestion({
      id: "507f1f77bcf86cd799439012",
      dimension: "I",
    }),
  ];

  const config = {
    scoringModel: "OPTION_SUM_V1",
    dimensions: ["I"],
    weights: {},
  };

  const ranges = deriveDimensionRanges(questions, config);

  assert.deepEqual(ranges, {
    I: { min: 2, max: 10 },
  });

  assert.deepEqual(
    normalizeDimensionScores({ I: 6 }, ranges),
    { I: 50 },
  );
});

test("reverse keyed questions keep the same theoretical range", () => {
  const questions = [
    likertQuestion({
      id: "507f1f77bcf86cd799439011",
      dimension: "conscientiousness",
      reverse: true,
    }),
  ];

  const config = {
    scoringModel: "OPTION_SUM_V1",
    dimensions: ["conscientiousness"],
    weights: {},
  };

  assert.deepEqual(
    deriveDimensionRanges(questions, config),
    {
      conscientiousness: { min: 1, max: 5 },
    },
  );
});

test("student fit profile combines separate assessment families", () => {
  const profile = composeStudentFitProfile([
    {
      assessmentType: "INTEREST",
      normalizedDimensions: {
        I: 86,
        A: 55,
      },
    },
    {
      assessmentType: "APTITUDE",
      normalizedDimensions: {
        logical: 91,
        numerical: 78,
      },
    },
    {
      assessmentType: "VALUES",
      normalizedDimensions: {
        learning: 88,
      },
    },
  ]);

  assert.equal(
    profile.modelVersion,
    FUTURE_FIT_MODEL_VERSION,
  );
  assert.equal(profile.interest.I, 86);
  assert.equal(profile.aptitude.logical, 91);
  assert.equal(profile.values.learning, 88);
});

test("career match uses career-specific importance", () => {
  const profile = composeStudentFitProfile([
    {
      assessmentType: "INTEREST",
      normalizedDimensions: { I: 88 },
    },
    {
      assessmentType: "APTITUDE",
      normalizedDimensions: {
        logical: 92,
        numerical: 72,
      },
    },
  ]);

  const result = matchCareerProfile(profile, [
    {
      group: "interest",
      dimension: "I",
      importance: 5,
      matchMode: "TARGET",
      target: 85,
    },
    {
      group: "aptitude",
      dimension: "logical",
      importance: 5,
      matchMode: "MINIMUM",
      target: 80,
    },
    {
      group: "aptitude",
      dimension: "numerical",
      importance: 3,
      matchMode: "MINIMUM",
      target: 70,
    },
  ]);

  assert.equal(result.coverage, 100);
  assert.equal(result.eligibleForRanking, true);
  assert.ok(result.score >= 98);
});

test("missing assessment families reduce match coverage", () => {
  const profile = composeStudentFitProfile([
    {
      assessmentType: "INTEREST",
      normalizedDimensions: { I: 90 },
    },
  ]);

  const result = matchCareerProfile(profile, [
    {
      group: "interest",
      dimension: "I",
      importance: 5,
      matchMode: "TARGET",
      target: 85,
    },
    {
      group: "aptitude",
      dimension: "logical",
      importance: 5,
      matchMode: "MINIMUM",
      target: 75,
    },
  ]);

  assert.equal(result.coverage, 50);
  assert.equal(result.eligibleForRanking, false);
});

test("minimum requirements do not punish scores above the threshold", () => {
  const profile = composeStudentFitProfile([
    {
      assessmentType: "APTITUDE",
      normalizedDimensions: {
        logical: 95,
      },
    },
  ]);

  const result = matchCareerProfile(profile, [
    {
      group: "aptitude",
      dimension: "logical",
      importance: 5,
      matchMode: "MINIMUM",
      target: 80,
    },
  ]);

  assert.equal(result.score, 100);
});
