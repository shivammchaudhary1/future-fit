export const ONET_DEFAULT_BASE_URL = "https://api-v2.onetcenter.org";
export const ONET_DEFAULT_TIMEOUT_MS = 10_000;
export const ONET_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
export const ONET_PATHS = {
  miniQuestions: "/mnm/interestprofiler/questions_30",
  results: "/mnm/interestprofiler/results",
  matchingCareers: "/mnm/interestprofiler/careers",
  search: "/mnm/search",
  career: (code: string) => `/mnm/careers/${encodeURIComponent(code)}/`,
  careerTopic: (code: string, topic: string) =>
    `/mnm/careers/${encodeURIComponent(code)}/${encodeURIComponent(topic)}`,
} as const;
export const ONET_CAREER_TOPICS = [
  "knowledge",
  "skills",
  "abilities",
  "personality",
  "technology",
  "education",
  "job_outlook",
] as const;
export const ONET_ANSWER_COUNT = 30;
export const ONET_MIN_ANSWER = 1;
export const ONET_MAX_ANSWER = 5;
