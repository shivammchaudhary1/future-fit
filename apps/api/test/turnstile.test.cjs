const { test } = require("node:test");
const assert = require("node:assert/strict");
require("reflect-metadata");
const { TurnstileGuard } = require("../dist/auth/turnstile.guard.js");
const context = { switchToHttp: () => ({ getRequest: () => ({ path: "/api/v1/auth/login", headers: { "x-turnstile-token": "token" }, ip: "127.0.0.1" }) }) };
const configured = { get: (key, fallback) => ({ TURNSTILE_SECRET_KEY: "test-secret", WEB_ORIGIN: "https://future.example" })[key] ?? fallback };
test("production never silently disables bot verification", async () => { const guard = new TurnstileGuard({ get: (key) => key === "NODE_ENV" ? "production" : undefined }); await assert.rejects(guard.canActivate(context), { status: 503 }); });
test("bot verification requires the expected hostname and action", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ success: true, hostname: "evil.example", action: "login" })));
  await assert.rejects(new TurnstileGuard(configured).canActivate(context), { status: 403 });
});
test("successful provider validation allows the expected form", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ success: true, hostname: "future.example", action: "login" })));
  assert.equal(await new TurnstileGuard(configured).canActivate(context), true);
});
