export const PAYMENT_CONFIG = {
  currency: "INR",
  timeoutMs: 15_000,
  dayMs: 86_400_000,
  maxAmount: 100_000_000,
  maxDurationDays: 3660,
  baseUrl: "https://api.razorpay.com/v1",
} as const;
