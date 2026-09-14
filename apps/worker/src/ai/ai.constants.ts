export const AI_PROVIDERS = ["openai", "gemini", "claude"] as const;
export const AI_LIMITS = {
  timeoutMs: 60_000,
  attempts: 2,
  retryDelayMs: 1000,
  maxOutputTokens: 4096,
  responseBytes: 131_072,
  inputBytes: 32_768,
  dimensions: 100,
  careers: 20,
  summaryLength: 4000,
  itemLength: 1000,
  listItems: 10,
} as const;
export const AI_ENDPOINTS = {
  openai: "https://api.openai.com/v1/responses",
  gemini: "https://generativelanguage.googleapis.com/v1beta/models/",
  claude: "https://api.anthropic.com/v1/messages",
} as const;
export const AI_KEY_NAMES = {
  openai: "OPENAI_API_KEY",
  gemini: "GEMINI_API_KEY",
  claude: "ANTHROPIC_API_KEY",
} as const;
export const ANTHROPIC_API_VERSION = "2023-06-01";
export const AI_SCHEMA_VERSION = "career-interpretation-v1";
export const AI_PROMPT_VERSION = "career-guidance-v1";
export const AI_RETRY_STATUSES = [408, 429, 500, 502, 503, 504] as const;
