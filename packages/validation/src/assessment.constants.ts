export const ASSESSMENT_LIMITS = {
  text: 4000,
  options: 50,
  questions: 500,
  sections: 30,
  dimensions: 50,
  score: 100,
  key: 80,
} as const;
export const QUESTION_TYPES = [
  "LIKERT",
  "SINGLE_SELECT",
  "MULTI_SELECT",
  "MOST_LEAST",
  "TEXT",
  "NUMBER",
] as const;
export const ASSESSMENT_TYPES = [
  "INTEREST",
  "PERSONALITY",
  "APTITUDE",
  "VALUES",
  "EDUCATIONAL_SURVEY",
  "ACADEMIC_PREFERENCE",
] as const;
export const SCORING_MODELS = [
  "OPTION_SUM_V1",
  "ONET_MINI_IP_V2",
  "ONET_IP_60_V1",
] as const;
