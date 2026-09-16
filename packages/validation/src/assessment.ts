import { z } from "zod";
import {
  ASSESSMENT_LIMITS as L,
  ASSESSMENT_TYPES,
  QUESTION_TYPES,
  SCORING_MODELS,
} from "./assessment.constants.js";

const key = z
  .string()
  .regex(/^[a-zA-Z0-9_-]+$/)
  .max(L.key);
const text = z.string().trim().min(1).max(L.text);
const translations = z.object({ en: text, hi: text }).strict();
const scores = z.record(key, z.number().finite().min(-L.score).max(L.score));
export const questionSchema = z
  .object({
    type: z.enum(QUESTION_TYPES),
    translations: z
      .object({
        en: z.object({ question: text, helperText: text.optional() }).strict(),
        hi: z.object({ question: text, helperText: text.optional() }).strict(),
      })
      .strict(),
    options: z
      .array(
        z
          .object({ id: key, translations, scoring: scores.default({}) })
          .strict(),
      )
      .max(L.options)
      .default([]),
    metadata: z
      .object({
        dimension: key.optional(),
        category: text.optional(),
        difficulty: z.number().min(0).max(1).optional(),
        min: z.number().finite().optional(),
        max: z.number().finite().optional(),
        onetOrder: z.number().int().min(1).max(60).optional(),
      })
      .strict()
      .default({}),
  })
  .strict()
  .superRefine((q, ctx) => {
    if (new Set(q.options.map((o) => o.id)).size !== q.options.length)
      ctx.addIssue({ code: "custom", message: "Duplicate option IDs" });
    if (!["TEXT", "NUMBER"].includes(q.type) && q.options.length < 2)
      ctx.addIssue({
        code: "custom",
        message: "Choice questions require at least two options",
      });
    if (
      q.metadata.min !== undefined &&
      q.metadata.max !== undefined &&
      q.metadata.min > q.metadata.max
    )
      ctx.addIssue({ code: "custom", message: "Invalid numeric bounds" });
  });
export const assessmentSchema = z
  .object({
    name: text,
    description: text,
    type: z.enum(ASSESSMENT_TYPES),
    isPaid: z.boolean().default(false),
  })
  .strict();
export const versionSchema = z
  .object({
    version: key,
    sections: z
      .array(
        z
          .object({
            key,
            translations,
            questions: z
              .array(
                z
                  .object({
                    questionId: z.string().regex(/^[a-f\d]{24}$/i),
                    order: z.number().int().nonnegative(),
                    required: z.boolean(),
                  })
                  .strict(),
              )
              .min(1)
              .max(L.questions),
          })
          .strict(),
      )
      .min(1)
      .max(L.sections),
    scoringConfiguration: z
      .object({
        scoringModel: z.enum(SCORING_MODELS),
        dimensions: z.array(key).min(1).max(L.dimensions),
        weights: z.record(key, z.number().finite().positive()).default({}),
      })
      .strict(),
  })
  .strict()
  .superRefine((v, ctx) => {
    const questions = v.sections.flatMap((s) => s.questions);
    if (
      questions.length > L.questions ||
      new Set(questions.map((q) => q.questionId)).size !== questions.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Question IDs must be unique and within the version limit",
      });
    if (
      new Set(v.sections.map((s) => s.key)).size !== v.sections.length ||
      v.sections.some(
        (s) =>
          new Set(s.questions.map((q) => q.order)).size !== s.questions.length,
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Section keys and question orders must be unique",
      });
    if (
      new Set(v.scoringConfiguration.dimensions).size !==
      v.scoringConfiguration.dimensions.length
    )
      ctx.addIssue({ code: "custom", message: "Duplicate dimensions" });
    if (
      Object.keys(v.scoringConfiguration.weights).some(
        (d) => !v.scoringConfiguration.dimensions.includes(d),
      )
    )
      ctx.addIssue({ code: "custom", message: "Unknown weighted dimension" });
  });
export type QuestionContent = z.infer<typeof questionSchema>;
export type QuestionSnapshot = QuestionContent & {
  questionId: string;
  required: boolean;
  order: number;
};
export type VersionContent = z.infer<typeof versionSchema>;
export type Answer = { questionId: string; answer: unknown };

export function validateAnswers(
  questions: QuestionSnapshot[],
  responses: Answer[],
  complete = false,
) {
  const byId = new Map(questions.map((q) => [q.questionId, q]));
  const seen = new Set<string>();
  for (const response of responses) {
    const question = byId.get(response.questionId);
    if (!question || seen.has(response.questionId))
      throw new Error("Unknown or duplicate question ID");
    seen.add(response.questionId);
    const value = response.answer;
    if (value === null && !complete) continue;
    const validOption = (id: unknown): id is string =>
      typeof id === "string" && question.options.some((o) => o.id === id);
    let valid = false;
    switch (question.type) {
      case "TEXT":
        valid =
          typeof value === "string" &&
          value.trim().length > 0 &&
          value.length <= L.text;
        break;
      case "NUMBER":
        valid =
          typeof value === "number" &&
          Number.isFinite(value) &&
          value >= (question.metadata.min ?? -Infinity) &&
          value <= (question.metadata.max ?? Infinity);
        break;
      case "MULTI_SELECT":
        valid =
          Array.isArray(value) &&
          value.length > 0 &&
          value.every(validOption) &&
          new Set(value).size === value.length;
        break;
      case "MOST_LEAST": {
        if (
          typeof value === "object" &&
          value !== null &&
          "most" in value &&
          "least" in value
        )
          valid =
            validOption(value.most) &&
            validOption(value.least) &&
            value.most !== value.least &&
            Object.keys(value).length === 2;
        break;
      }
      default:
        valid = validOption(value);
    }
    if (!valid)
      throw new Error(`Invalid answer for question ${question.questionId}`);
  }
  if (complete && questions.some((q) => q.required && !seen.has(q.questionId)))
    throw new Error("Required questions are unanswered");
}

export function scoreAnswers(
  questions: QuestionSnapshot[],
  responses: Answer[],
  config: VersionContent["scoringConfiguration"],
) {
  validateAnswers(questions, responses, true);
  if (config.scoringModel !== "OPTION_SUM_V1")
    throw new Error("External scoring provider required");
  const dimensions: Record<string, number> = Object.fromEntries(
    config.dimensions.map((d) => [d, 0]),
  );
  const answers = new Map(responses.map((r) => [r.questionId, r.answer]));
  for (const question of questions) {
    const answer = answers.get(question.questionId);
    for (const option of question.options) {
      let multiplier = 0;
      if (
        answer === option.id ||
        (Array.isArray(answer) && answer.includes(option.id))
      )
        multiplier = 1;
      if (
        question.type === "MOST_LEAST" &&
        typeof answer === "object" &&
        answer !== null &&
        "most" in answer &&
        "least" in answer
      )
        multiplier =
          answer.most === option.id ? 1 : answer.least === option.id ? -1 : 0;
      for (const [dimension, score] of Object.entries(option.scoring)) {
        if (!(dimension in dimensions))
          throw new Error("Question references an unconfigured dimension");
        dimensions[dimension] =
          (dimensions[dimension] ?? 0) +
          multiplier * score * (config.weights[dimension] ?? 1);
      }
    }
  }
  return dimensions;
}

export function publicQuestion(question: QuestionSnapshot) {
  return {
    questionId: question.questionId,
    required: question.required,
    order: question.order,
    type: question.type,
    translations: question.translations,
    options: question.options.map((o) => ({
      id: o.id,
      translations: o.translations,
    })),
    metadata: { min: question.metadata.min, max: question.metadata.max },
  };
}
