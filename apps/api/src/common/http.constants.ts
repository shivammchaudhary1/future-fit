export const HTTP_LIMITS = {
  windowMs: 60_000,
  authRequests: 30,
  apiRequests: 300,
  requestIdLength: 64,
} as const;
export const HTTP_ERROR_CODES: Record<number, string> = {
  400: "INVALID_REQUEST",
  401: "UNAUTHENTICATED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  429: "RATE_LIMITED",
  500: "INTERNAL_ERROR",
  503: "SERVICE_UNAVAILABLE",
};
