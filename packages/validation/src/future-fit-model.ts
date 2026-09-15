import { z } from "zod";

import type {
  Answer,
  QuestionSnapshot,
  VersionContent,
} from "./assessment.js";
import {
  CAREER_MATCH_MODES,
  DEFAULT_MIN_MATCH_COVERAGE,
  FIT_GROUPS,
  FUTURE_FIT_MODEL_VERSION,
  type FitGroup,
} from "./future-fit-model.constants.js";

const dimensionKey = z
  .string()
  .regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/);

const zeroToHundred = z.number().finite().min(0).max(100);

export const fitDimensionScoresSchema = z.record(
  dimensionKey,
  zeroToHundred,
);

export const studentFitProfileSchema = z
  .object({
    modelVersion: z.literal(FUTURE_FIT_MODEL_VERSION),
    interest: fitDimensionScoresSchema.default({}),
    aptitude: fitDimensionScoresSchema.default({}),
    personality: fitDimensionScoresSchema.default({}),
    values: fitDimensionScoresSchema.default({}),
    academic: fitDimensionScoresSchema.default({}),
  })
  .strict();

export type StudentFitProfile = z.infer<typeof studentFitProfileSchema>;

export interface DimensionRange {
  min: number;
  max: number;
}

export type DimensionRanges = Record<string, DimensionRange>;

export interface ScoredAssessmentFragment {
  assessmentType:
    | "INTEREST"
    | "PERSONALITY"
    | "APTITUDE"
    | "VALUES"
    | "EDUCATIONAL_SURVEY"
    | "ACADEMIC_PREFERENCE";
  normalizedDimensions: Record<string, number>;
}

export interface CareerRequirement {
  group: FitGroup;
  dimension: string;
  importance: number;
  matchMode: (typeof CAREER_MATCH_MODES)[number];
  target?: number;
  min?: number;
  max?: number;
}

export interface CareerMatchComponent {
  group: FitGroup;
  dimension: string;
  studentScore?: number;
  alignment?: number;
  importance: number;
  matchMode: CareerRequirement["matchMode"];
  target?: number;
  min?: number;
  max?: number;
}

export interface CareerMatchResult {
  score: number | null;
  coverage: number;
  eligibleForRanking: boolean;
  components: CareerMatchComponent[];
  strongestFactors: CareerMatchComponent[];
  developmentFactors: CareerMatchComponent[];
}

function clamp100(value: number) {
  return Math.max(0, Math.min(100, value));
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function contributionForSingleChoice(
  question: QuestionSnapshot,
  dimension: string,
  weight: number,
): DimensionRange {
  const values = question.options.map(
    (option) => (option.scoring[dimension] ?? 0) * weight,
  );

  if (!values.length) return { min: 0, max: 0 };

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function contributionForMultiSelect(
  question: QuestionSnapshot,
  dimension: string,
  weight: number,
): DimensionRange {
  const values = question.options.map(
    (option) => (option.scoring[dimension] ?? 0) * weight,
  );

  if (!values.length) return { min: 0, max: 0 };

  const negatives = values.filter((value) => value < 0);
  const positives = values.filter((value) => value > 0);

  return {
    min: negatives.length ? negatives.reduce((a, b) => a + b, 0) : 0,
    max: positives.length ? positives.reduce((a, b) => a + b, 0) : 0,
  };
}

function contributionForMostLeast(
  question: QuestionSnapshot,
  dimension: string,
  weight: number,
): DimensionRange {
  const values = question.options.map(
    (option) => (option.scoring[dimension] ?? 0) * weight,
  );

  if (values.length < 2) return { min: 0, max: 0 };

  let min = Infinity;
  let max = -Infinity;

  for (let most = 0; most < values.length; most += 1) {
    for (let least = 0; least < values.length; least += 1) {
      if (most === least) continue;
      const value = values[most]! - values[least]!;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }

  return {
    min: Number.isFinite(min) ? min : 0,
    max: Number.isFinite(max) ? max : 0,
  };
}

export function deriveDimensionRanges(
  questions: QuestionSnapshot[],
  config: VersionContent["scoringConfiguration"],
): DimensionRanges {
  const ranges: DimensionRanges = Object.fromEntries(
    config.dimensions.map((dimension) => [
      dimension,
      { min: 0, max: 0 },
    ]),
  );

  for (const question of questions) {
    for (const dimension of config.dimensions) {
      const weight = config.weights[dimension] ?? 1;
      let contribution: DimensionRange;

      switch (question.type) {
        case "MULTI_SELECT":
          contribution = contributionForMultiSelect(
            question,
            dimension,
            weight,
          );
          break;
        case "MOST_LEAST":
          contribution = contributionForMostLeast(
            question,
            dimension,
            weight,
          );
          break;
        case "TEXT":
        case "NUMBER":
          contribution = { min: 0, max: 0 };
          break;
        default:
          contribution = contributionForSingleChoice(
            question,
            dimension,
            weight,
          );
      }

      const range = ranges[dimension]!;
      range.min += contribution.min;
      range.max += contribution.max;
    }
  }

  return ranges;
}

export function normalizeDimensionScore(
  rawScore: number,
  range: DimensionRange,
) {
  if (!Number.isFinite(rawScore)) {
    throw new Error("Raw dimension score must be finite");
  }

  if (
    !Number.isFinite(range.min) ||
    !Number.isFinite(range.max) ||
    range.max <= range.min
  ) {
    return 0;
  }

  return round2(
    clamp100(((rawScore - range.min) / (range.max - range.min)) * 100),
  );
}

export function normalizeDimensionScores(
  rawScores: Record<string, number>,
  ranges: DimensionRanges,
) {
  const normalized: Record<string, number> = {};

  for (const [dimension, range] of Object.entries(ranges)) {
    normalized[dimension] = normalizeDimensionScore(
      rawScores[dimension] ?? range.min,
      range,
    );
  }

  return normalized;
}

export function composeStudentFitProfile(
  fragments: ScoredAssessmentFragment[],
): StudentFitProfile {
  const profile: StudentFitProfile = {
    modelVersion: FUTURE_FIT_MODEL_VERSION,
    interest: {},
    aptitude: {},
    personality: {},
    values: {},
    academic: {},
  };

  for (const fragment of fragments) {
    switch (fragment.assessmentType) {
      case "INTEREST":
        Object.assign(profile.interest, fragment.normalizedDimensions);
        break;
      case "APTITUDE":
        Object.assign(profile.aptitude, fragment.normalizedDimensions);
        break;
      case "PERSONALITY":
        Object.assign(profile.personality, fragment.normalizedDimensions);
        break;
      case "VALUES":
        Object.assign(profile.values, fragment.normalizedDimensions);
        break;
      case "ACADEMIC_PREFERENCE":
      case "EDUCATIONAL_SURVEY":
        Object.assign(profile.academic, fragment.normalizedDimensions);
        break;
    }
  }

  return studentFitProfileSchema.parse(profile);
}

function targetAlignment(studentScore: number, target: number) {
  return clamp100(100 - Math.abs(studentScore - target));
}

function minimumAlignment(studentScore: number, target: number) {
  if (target <= 0 || studentScore >= target) return 100;
  return clamp100((studentScore / target) * 100);
}

function rangeAlignment(
  studentScore: number,
  min: number,
  max: number,
) {
  if (studentScore >= min && studentScore <= max) return 100;

  if (studentScore < min) {
    if (min <= 0) return 100;
    return clamp100((studentScore / min) * 100);
  }

  if (max >= 100) return 100;

  const availableDistance = 100 - max;
  const distance = studentScore - max;
  return clamp100(100 - (distance / availableDistance) * 100);
}

function requirementAlignment(
  studentScore: number,
  requirement: CareerRequirement,
) {
  switch (requirement.matchMode) {
    case "MINIMUM":
      if (requirement.target === undefined) {
        throw new Error("MINIMUM requirement must define target");
      }
      return minimumAlignment(studentScore, requirement.target);

    case "RANGE":
      if (
        requirement.min === undefined ||
        requirement.max === undefined ||
        requirement.min > requirement.max
      ) {
        throw new Error("RANGE requirement must define a valid min/max");
      }
      return rangeAlignment(
        studentScore,
        requirement.min,
        requirement.max,
      );

    case "TARGET":
    default:
      if (requirement.target === undefined) {
        throw new Error("TARGET requirement must define target");
      }
      return targetAlignment(studentScore, requirement.target);
  }
}

export function matchCareerProfile(
  studentProfile: StudentFitProfile,
  requirements: CareerRequirement[],
  minCoverage = DEFAULT_MIN_MATCH_COVERAGE,
): CareerMatchResult {
  if (!requirements.length) {
    return {
      score: null,
      coverage: 0,
      eligibleForRanking: false,
      components: [],
      strongestFactors: [],
      developmentFactors: [],
    };
  }

  let totalWeight = 0;
  let matchedWeight = 0;
  let weightedAlignment = 0;

  const components: CareerMatchComponent[] = requirements.map(
    (requirement) => {
      if (
        !FIT_GROUPS.includes(requirement.group) ||
        !Number.isFinite(requirement.importance) ||
        requirement.importance <= 0
      ) {
        throw new Error("Invalid career requirement");
      }

      totalWeight += requirement.importance;

      const group = studentProfile[requirement.group];
      const studentScore = group[requirement.dimension];

      const component: CareerMatchComponent = {
        group: requirement.group,
        dimension: requirement.dimension,
        importance: requirement.importance,
        matchMode: requirement.matchMode,
        target: requirement.target,
        min: requirement.min,
        max: requirement.max,
      };

      if (studentScore === undefined) return component;

      const alignment = requirementAlignment(
        studentScore,
        requirement,
      );

      component.studentScore = studentScore;
      component.alignment = round2(alignment);

      matchedWeight += requirement.importance;
      weightedAlignment += alignment * requirement.importance;

      return component;
    },
  );

  const coverage =
    totalWeight > 0 ? round2((matchedWeight / totalWeight) * 100) : 0;

  const score =
    matchedWeight > 0
      ? round2(weightedAlignment / matchedWeight)
      : null;

  const matched = components.filter(
    (component) => component.alignment !== undefined,
  );

  const strongestFactors = [...matched]
    .sort((a, b) => {
      const scoreA = (a.alignment ?? 0) * a.importance;
      const scoreB = (b.alignment ?? 0) * b.importance;
      return scoreB - scoreA;
    })
    .slice(0, 5);

  const developmentFactors = [...matched]
    .filter((component) => (component.alignment ?? 100) < 75)
    .sort((a, b) => {
      const scoreA = (a.alignment ?? 100) * a.importance;
      const scoreB = (b.alignment ?? 100) * b.importance;
      return scoreA - scoreB;
    })
    .slice(0, 3);

  return {
    score,
    coverage,
    eligibleForRanking:
      score !== null && coverage >= clamp100(minCoverage),
    components,
    strongestFactors,
    developmentFactors,
  };
}

/*
 * Reserved for the next integration step.
 *
 * The assessment worker will call this model only after individual
 * assessment results have been normalized and combined into a Student
 * Fit Profile. Keeping that aggregation separate prevents one assessment
 * (for example Interest alone) from pretending to be a complete career
 * recommendation model.
 */
export function assertNoRawAnswerLeak(_answers: Answer[]) {
  return true;
}
