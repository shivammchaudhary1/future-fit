const { test } = require("node:test");
const assert = require("node:assert/strict");
require("reflect-metadata");
const { Types } = require("mongoose");
const { ResultsService } = require("../dist/results/results.service.js");
const { OriginGuard } = require("../dist/auth/origin.guard.js");
const { CsrfGuard } = require("../dist/auth/csrf.guard.js");
const { SchoolsService } = require("../dist/schools/schools.service.js");
const id = "507f1f77bcf86cd799439011";
const other = "507f191e810c19729de860ea";
function context(request) {
  return { switchToHttp: () => ({ getRequest: () => request }) };
}
test("authentication writes reject foreign and missing origins", () => {
  const guard = new OriginGuard({ get: () => "https://future.example" });
  for (const origin of [undefined, "https://evil.example", "null"])
    assert.throws(() =>
      guard.canActivate(context({ method: "POST", headers: { origin } })),
    );
  assert.equal(
    guard.canActivate(
      context({
        method: "POST",
        headers: { origin: "https://future.example" },
      }),
    ),
    true,
  );
});
test("CSRF requires matching cookie and header", () => {
  const guard = new CsrfGuard();
  assert.throws(() =>
    guard.canActivate(
      context({ cookies: { ff_csrf: "a" }, headers: { "x-csrf-token": "b" } }),
    ),
  );
  assert.equal(
    guard.canActivate(
      context({ cookies: { ff_csrf: "a" }, headers: { "x-csrf-token": "a" } }),
    ),
    true,
  );
});
test("personal results remain private even to teachers", async () => {
  const service = new ResultsService(
    {
      findById: async () => ({ userId: new Types.ObjectId(id), attemptId: id }),
    },
    { findById: async () => ({ context: "PERSONAL" }) },
    { findOne: async () => null },
  );
  await assert.rejects(service.authorize(other, id), { status: 403 });
});
test("result owners can access their results without school membership", async () => {
  const result = { userId: new Types.ObjectId(id), attemptId: id };
  const service = new ResultsService({ findById: async () => result });
  assert.equal(await service.authorize(id, id), result);
});
test("school teachers cannot access students outside their classes", async () => {
  const service = new ResultsService(
    {
      findById: async () => ({ userId: new Types.ObjectId(id), attemptId: id }),
    },
    {
      findById: async () => ({
        context: "SCHOOL",
        organizationId: new Types.ObjectId(id),
      }),
    },
    { findOne: async () => null },
    { distinct: async () => [] },
    { exists: async () => null },
    { requireRole: async () => ({ role: "TEACHER" }) },
  );
  await assert.rejects(service.authorize(other, id), { status: 403 });
});
test("expired school assignments cannot start", async () => {
  const service = new SchoolsService(
    null,
    null,
    null,
    { findOne: async () => ({ dueDate: new Date(0) }) },
    null,
    null,
    { requireRole: async () => ({ role: "STUDENT" }) },
  );
  await assert.rejects(service.requireAssignmentForStudent(id, id, other), {
    status: 400,
  });
});
