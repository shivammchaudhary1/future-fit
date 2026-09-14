export const DEFAULT_REDIS_URL = "redis://localhost:6379";
export const DEFAULT_MONGO_URL = "mongodb://localhost:27017/future-fit";
export const DEFAULT_ONET_URL = "https://api-v2.onetcenter.org";
export const ONET_TIMEOUT_MS = 10_000;
export const COLLECTIONS = {
  attempts: "assessment_attempts",
  assessments: "assessments",
  results: "assessment_results",
} as const;
export const PROCESS_STATES = {
  submitted: "SUBMITTED",
  scoring: "SCORING",
  matching: "MATCHING",
  ready: "RESULT_READY",
  failed: "FAILED",
} as const;
