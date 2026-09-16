const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = JSON.parse(
  fs.readFileSync(
    path.resolve(
      __dirname,
      "../../../data/assessments/student-interest-pilot.v1.json",
    ),
    "utf8",
  ),
);

test("student interest pilot has balanced original RIASEC coverage", () => {
  assert.equal(source.assessment.type, "INTEREST");
  assert.equal(source.assessment.scoringConfiguration.scoringModel, "OPTION_SUM_V1");
  assert.deepEqual(
    source.assessment.scoringConfiguration.dimensions,
    ["R", "I", "A", "S", "E", "C"],
  );

  assert.equal(source.questions.length, 24);
  assert.equal(new Set(source.questions.map((q) => q.key)).size, 24);

  for (const dimension of ["R", "I", "A", "S", "E", "C"]) {
    assert.equal(
      source.questions.filter((q) => q.dimension === dimension).length,
      4,
    );
  }

  assert.deepEqual(
    source.scale.map((option) => option.id),
    ["1", "2", "3", "4", "5"],
  );

  assert.equal(
    source.scale.reduce((sum, option) => sum + option.score, 0),
    62.5,
  );

  assert.equal(source.scale.at(0).score, 0);
  assert.equal(source.scale.at(-1).score, 25);

  for (const question of source.questions) {
    assert.ok(question.translations.en.question.length > 5);
    assert.ok(question.translations.hi.question.length > 5);
    assert.equal(question.required, true);
  }
});
