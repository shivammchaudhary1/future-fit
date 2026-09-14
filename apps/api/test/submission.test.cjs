const { test } = require("node:test");
const assert = require("node:assert/strict");
require("reflect-metadata");
const {
  AssessmentsService,
} = require("../dist/assessments/assessments.service.js");
test("autosave rejects stale revisions before writing", async () => {
  const service = new AssessmentsService(null, null, {
    findOne: async () => ({ status: "IN_PROGRESS", revision: 2 }),
  });
  await assert.rejects(
    service.save("student", "attempt", {
      revision: 1,
      responses: [],
      progress: 0,
    }),
    { status: 409 },
  );
});
test("submitted attempts can safely repeat the enqueue request", async () => {
  let enqueued = 0;
  const service = new AssessmentsService(
    null,
    null,
    { findOne: async () => ({ status: "SUBMITTED" }) },
    null,
    {
      enqueueScoring: async () => {
        enqueued++;
      },
    },
  );
  assert.deepEqual(await service.submit("student", "attempt"), {
    attemptId: "attempt",
    status: "SUBMITTED",
  });
  assert.equal(enqueued, 1);
});
test("finished submissions do not create more scoring jobs", async () => {
  const service = new AssessmentsService(null, null, {
    findOne: async () => ({ status: "RESULT_READY" }),
  });
  assert.deepEqual(await service.submit("student", "attempt"), {
    attemptId: "attempt",
    status: "RESULT_READY",
  });
});

test("attempt result endpoint remains owner-scoped and excludes private provider/storage fields", async () => {
  let filter, projection;
  const service = new AssessmentsService(null, null, null, {
    findOne: (value) => { filter = value; return {
      select: (fields) => { projection = fields; return { lean: async () => ({ reportStatus: "READY" }) }; },
    }; },
  });
  assert.deepEqual(await service.result("student", "attempt"), { reportStatus: "READY" });
  assert.deepEqual(filter, { attemptId: "attempt", userId: "student" });
  assert.equal(projection, "-providerResult -reportKey");
});
