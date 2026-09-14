const { test } = require("node:test");
const assert = require("node:assert/strict");
require("reflect-metadata");
const { Types } = require("mongoose");
const { hash } = require("argon2");
const { AuthService } = require("../dist/auth/auth.service.js");
test("concurrent refresh requests cannot both consume the same token", async () => {
  const userId = new Types.ObjectId(); const sessionId = new Types.ObjectId();
  let storedHash = await hash("old-token");
  const jwtids = [];
  const user = { _id: userId, emailVerified: true, status: "ACTIVE", firstName: "Test", lastName: "User", email: "test@example.com", preferredLanguage: "en", globalRoles: [] };
  const sessions = {
    findById: () => { const snapshot = storedHash; return { select: async () => ({ _id: sessionId, userId, refreshTokenHash: snapshot, expiresAt: new Date(Date.now() + 60000) }) }; },
    updateOne: async (filter, update) => { if (filter.refreshTokenHash !== storedHash) return { modifiedCount: 0 }; storedHash = update.$set.refreshTokenHash; return { modifiedCount: 1 }; },
  };
  const jwt = { verifyAsync: async () => ({ sub: userId.toHexString(), sid: sessionId.toHexString(), type: "refresh" }), signAsync: async (_payload, options) => { jwtids.push(options.jwtid); return options.jwtid; } };
  const service = new AuthService({ findById: async () => user }, sessions, null, jwt, { get: (_key, fallback) => fallback, getOrThrow: () => "test-secret" }, null);
  const outcomes = await Promise.allSettled([service.refresh("old-token"), service.refresh("old-token")]);
  assert.equal(outcomes.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(outcomes.filter((result) => result.status === "rejected").length, 1);
  assert.equal(new Set(jwtids).size, jwtids.length);
});
