const { test } = require("node:test");
const assert = require("node:assert/strict");
require("reflect-metadata");
const { AccessTokenGuard } = require("../dist/auth/access-token.guard.js");

const identity = {
  sub: "507f1f77bcf86cd799439011",
  sid: "507f191e810c19729de860ea",
  type: "access",
};
const config = { getOrThrow: () => "test-secret" };
function context() {
  const request = { cookies: { ff_access: "token" }, headers: {} };
  return { request, switchToHttp: () => ({ getRequest: () => request }) };
}
test("active session and verified user can authenticate", async () => {
  const guard = new AccessTokenGuard(
    { verifyAsync: async () => identity },
    config,
    { exists: async () => ({}) },
    { exists: async () => ({}) },
  );
  const ctx = context();
  assert.equal(await guard.canActivate(ctx), true);
  assert.deepEqual(ctx.request.auth, identity);
});
test("revoked or missing session rejects an otherwise valid JWT", async () => {
  const guard = new AccessTokenGuard(
    { verifyAsync: async () => identity },
    config,
    { exists: async () => null },
    { exists: async () => ({}) },
  );
  await assert.rejects(guard.canActivate(context()), { status: 401 });
});
test("suspended or missing user rejects an otherwise valid JWT", async () => {
  const guard = new AccessTokenGuard(
    { verifyAsync: async () => identity },
    config,
    { exists: async () => ({}) },
    { exists: async () => null },
  );
  await assert.rejects(guard.canActivate(context()), { status: 401 });
});
test("refresh tokens cannot authenticate protected endpoints", async () => {
  const guard = new AccessTokenGuard(
    { verifyAsync: async () => ({ ...identity, type: "refresh" }) },
    config,
  );
  await assert.rejects(guard.canActivate(context()), { status: 401 });
});
