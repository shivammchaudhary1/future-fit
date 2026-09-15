export const FUTURE_FIT_MODEL_VERSION = "ff-model-v1" as const;

export const FIT_GROUPS = [
  "interest",
  "aptitude",
  "personality",
  "values",
  "academic",
] as const;

export type FitGroup = (typeof FIT_GROUPS)[number];

export const INTEREST_DIMENSIONS = [
  "R",
  "I",
  "A",
  "S",
  "E",
  "C",
] as const;

export const APTITUDE_DIMENSIONS = [
  "logical",
  "numerical",
  "verbal",
  "spatial",
  "dataInterpretation",
  "patternRecognition",
] as const;

export const PERSONALITY_DIMENSIONS = [
  "openness",
  "conscientiousness",
  "extraversion",
  "agreeableness",
  "emotionalStability",
] as const;

export const VALUES_DIMENSIONS = [
  "achievement",
  "independence",
  "helpingOthers",
  "recognition",
  "stability",
  "creativity",
  "leadership",
  "workLifeBalance",
  "financialReward",
  "learning",
] as const;

export const CAREER_MATCH_MODES = [
  "TARGET",
  "MINIMUM",
  "RANGE",
] as const;

export const CAREER_SOURCE_TYPES = [
  "NCO",
  "NSDC",
  "NCS",
  "ESCO",
  "FUTURE_FIT",
  "OTHER",
] as const;

export const DEFAULT_MIN_MATCH_COVERAGE = 70;
