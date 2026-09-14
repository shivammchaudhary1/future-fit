const { test } = require("node:test");
const assert = require("node:assert/strict");
require("reflect-metadata");
const { JwtService } = require("@nestjs/jwt");
const { RateLimitGuard } = require("../dist/common/rate-limit.guard.js");
const { ACCESS_COOKIE_NAME, ACCESS_TOKEN_TYPE } = require("../dist/auth/auth.constants.js");
const jwt = new JwtService();
const secret = "synthetic-rate-limit-test-secret";
function fixture() {
  const keys = [];
  const guard = new RateLimitGuard({ rateLimit: async (key) => { keys.push(key); return 1; } }, jwt, { getOrThrow: () => secret });
  const request = (token, path = "/api/v1/attempts") => ({ switchToHttp: () => ({ getRequest: () => ({ path, ip: "192.0.2.1", headers: {}, cookies: token ? { [ACCESS_COOKIE_NAME]: token } : {} }) }) });
  return { keys, guard, request };
}
const token = (sub, type = ACCESS_TOKEN_TYPE, signingSecret = secret) => jwt.sign({ sub, type }, { secret: signingSecret, expiresIn: "1m" });
test("students sharing a network have separate authenticated API limits", async () => {
  const { keys, guard, request } = fixture();
  await guard.canActivate(request(token("a".repeat(24))));
  await guard.canActivate(request(token("b".repeat(24))));
  assert.notEqual(keys[0], keys[1]);
});
test("forged and wrong-type tokens cannot manufacture rate-limit identities", async () => {
  const { keys, guard, request } = fixture();
  await guard.canActivate(request());
  await guard.canActivate(request(token("a".repeat(24), ACCESS_TOKEN_TYPE, "forged-secret")));
  await guard.canActivate(request(token("b".repeat(24), "refresh")));
  assert.equal(new Set(keys).size, 1);
});
test("login stays IP-limited even with different signed access cookies", async () => {
  const { keys, guard, request } = fixture();
  await guard.canActivate(request(token("a".repeat(24)), "/api/v1/auth/login"));
  await guard.canActivate(request(token("b".repeat(24)), "/api/v1/auth/login"));
  assert.equal(keys[0], keys[1]);
});
test("health substring in a business route does not bypass throttling", async () => {
  const { keys, guard, request } = fixture();
  await guard.canActivate(request(undefined, "/api/v1/careers/healthcare"));
  assert.equal(keys.length, 1);
});
test("only the exact health endpoints bypass Redis throttling", async () => {
  const { keys, guard, request } = fixture();
  for (const path of ["/api/v1/health", "/api/v1/health/live", "/api/v1/health/ready"])
    assert.equal(await guard.canActivate(request(undefined, path)), true);
  assert.equal(keys.length, 0);
});
