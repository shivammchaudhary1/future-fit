import { createHmac, timingSafeEqual } from "node:crypto";
export function validWebhook(
  body: Buffer,
  signature: string | undefined,
  secret: string,
) {
  if (!signature || !/^[a-f\d]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(body).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
export function capturedPayment(value: unknown) {
  const record = (v: unknown): Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : {};
  const event = record(value);
  if (event.event !== "payment.captured") return null;
  const payment = record(record(record(event.payload).payment).entity);
  if (
    typeof payment.id !== "string" ||
    typeof payment.order_id !== "string" ||
    !Number.isSafeInteger(payment.amount) ||
    typeof payment.currency !== "string" ||
    payment.status !== "captured"
  )
    throw new Error("Invalid captured payment payload");
  return {
    id: payment.id,
    orderId: payment.order_id,
    amount: payment.amount as number,
    currency: payment.currency,
  };
}
