const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  questionSchema,
  versionSchema,
  validateAnswers,
  scoreAnswers,
  publicQuestion,
} = require("@future-fit/validation");
const question = {
  questionId: "507f1f77bcf86cd799439011",
  order: 0,
  required: true,
  ...questionSchema.parse({
    type: "SINGLE_SELECT",
    translations: { en: { question: "Example" }, hi: { question: "उदाहरण" } },
    options: [
      { id: "a", translations: { en: "A", hi: "अ" }, scoring: { interest: 2 } },
      {
        id: "b",
        translations: { en: "B", hi: "ब" },
        scoring: { interest: -1 },
      },
    ],
  }),
};
const config = {
  scoringModel: "OPTION_SUM_V1",
  dimensions: ["interest"],
  weights: { interest: 2 },
};
test("deterministic scoring uses server version weights", () => {
  assert.deepEqual(
    scoreAnswers(
      [question],
      [{ questionId: question.questionId, answer: "a" }],
      config,
    ),
    { interest: 4 },
  );
});
test("unknown and duplicate questions are rejected", () => {
  assert.throws(() =>
    validateAnswers([question], [{ questionId: "other", answer: "a" }]),
  );
  assert.throws(() =>
    validateAnswers(
      [question],
      Array(2).fill({ questionId: question.questionId, answer: "a" }),
    ),
  );
});
test("unknown options and missing required answers are rejected", () => {
  assert.throws(() =>
    validateAnswers(
      [question],
      [{ questionId: question.questionId, answer: "injected" }],
    ),
  );
  assert.throws(() => validateAnswers([question], [], true));
  assert.doesNotThrow(() => validateAnswers([question], [], false));
});
test("numeric answers enforce bounds and reject non-finite values", () => {
  const numeric = { ...question, type: "NUMBER", metadata: { min: 1, max: 5 } };
  for (const answer of [NaN, Infinity, 0, 6, "3"])
    assert.throws(() =>
      validateAnswers([numeric], [{ questionId: numeric.questionId, answer }]),
    );
});
test("public questions exclude scores and scientific metadata", () => {
  const safe = publicQuestion(question);
  assert.equal(safe.options[0].scoring, undefined);
  assert.equal(safe.metadata.dimension, undefined);
});
test("multi-select cannot inflate scores with duplicate selections", () => {
  assert.throws(() =>
    validateAnswers(
      [{ ...question, type: "MULTI_SELECT" }],
      [{ questionId: question.questionId, answer: ["a", "a"] }],
    ),
  );
});
test("most/least cannot select the same option", () => {
  assert.throws(() =>
    validateAnswers(
      [{ ...question, type: "MOST_LEAST" }],
      [{ questionId: question.questionId, answer: { most: "a", least: "a" } }],
    ),
  );
});
test("version validation rejects duplicated questions", () => {
  assert.equal(
    versionSchema.safeParse({
      version: "v1",
      sections: [
        {
          key: "s",
          translations: { en: "Section", hi: "भाग" },
          questions: [1, 2].map((order) => ({
            questionId: question.questionId,
            order,
            required: true,
          })),
        },
      ],
      scoringConfiguration: config,
    }).success,
    false,
  );
});
