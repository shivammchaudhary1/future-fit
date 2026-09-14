const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createHmac } = require("node:crypto");
const {
  validWebhook,
  capturedPayment,
} = require("../dist/payments/webhook.js");
test("webhook signature binds the exact raw bytes", () => {
  const body = Buffer.from('{"event":"payment.captured"}');
  const signature = createHmac("sha256", "test-secret")
    .update(body)
    .digest("hex");
  assert.equal(validWebhook(body, signature, "test-secret"), true);
  assert.equal(
    validWebhook(
      Buffer.from('{ "event":"payment.captured"}'),
      signature,
      "test-secret",
    ),
    false,
  );
  for (const bad of [undefined, "", "123", "g".repeat(64)])
    assert.equal(validWebhook(body, bad, "test-secret"), false);
});
test("authorized but uncaptured payments never grant access", () => {
  assert.equal(capturedPayment({ event: "payment.authorized" }), null);
  assert.throws(() =>
    capturedPayment({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_1",
            order_id: "order_1",
            amount: 100,
            currency: "INR",
            status: "authorized",
          },
        },
      },
    }),
  );
});
test("capture extraction preserves provider order, amount and currency", () => {
  assert.deepEqual(
    capturedPayment({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_1",
            order_id: "order_1",
            amount: 100,
            currency: "INR",
            status: "captured",
          },
        },
      },
    }),
    { id: "pay_1", orderId: "order_1", amount: 100, currency: "INR" },
  );
});
