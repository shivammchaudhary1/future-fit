import { z } from "zod";
import { AI_LIMITS as L } from "./ai.constants.js";
const text = z.string().trim().min(1).max(L.itemLength);
const list = z.array(text).min(1).max(L.listItems);
export const interpretationSchema = z
  .object({
    summary: z.string().trim().min(1).max(L.summaryLength),
    strengths: list,
    growthAreas: list,
    actionPlan: list,
    limitations: list,
    evidence: z
      .array(z.object({ dimension: text, value: z.number().finite() }).strict())
      .min(1)
      .max(L.dimensions),
    careerExplanations: z
      .array(z.object({ careerCode: text, explanation: text }).strict())
      .max(L.careers),
  })
  .strict();
export type Interpretation = z.infer<typeof interpretationSchema>;
export interface InterpretationInput {
  language: "en" | "hi";
  dimensions: Record<string, number>;
  careerMatches: Record<string, unknown>[];
  scoringVersion?: string;
}
export interface SafeProfile {
  language: "en" | "hi";
  dimensions: Record<string, number>;
  careers: Array<{ code: string; title: string }>;
  scoringVersion: string;
}
// Use the common JSON-schema subset supported by all configured providers.
const stringList = { type: "array", items: { type: "string" } };
export const INTERPRETATION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    strengths: stringList,
    growthAreas: stringList,
    actionPlan: stringList,
    limitations: stringList,
    evidence: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          dimension: { type: "string" },
          value: { type: "number" },
        },
        required: ["dimension", "value"],
      },
    },
    careerExplanations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          careerCode: { type: "string" },
          explanation: { type: "string" },
        },
        required: ["careerCode", "explanation"],
      },
    },
  },
  required: [
    "summary",
    "strengths",
    "growthAreas",
    "actionPlan",
    "limitations",
    "evidence",
    "careerExplanations",
  ],
} as const;
export function safeProfile(input: InterpretationInput): SafeProfile {
  if (!["en", "hi"].includes(input.language))
    throw new Error("Unsupported AI language");
  const entries = Object.entries(input.dimensions).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  if (
    !entries.length ||
    entries.length > L.dimensions ||
    entries.some(
      ([key, value]) =>
        !/^[a-zA-Z0-9_-]{1,80}$/.test(key) || !Number.isFinite(value),
    )
  )
    throw new Error("Invalid AI score input");
  const careers: SafeProfile["careers"] = [];
  for (const match of input.careerMatches.slice(0, L.careers)) {
    const code = match.code ?? match.careerId;
    const title = match.title ?? match.name;
    if (
      typeof code !== "string" ||
      typeof title !== "string" ||
      !code.trim() ||
      !title.trim() ||
      code.length > 100 ||
      title.length > 300
    )
      throw new Error("Invalid AI career input");
    if (careers.some((career) => career.code === code)) continue;
    careers.push({ code, title });
  }
  const profile = {
    language: input.language,
    dimensions: Object.fromEntries(entries),
    careers,
    scoringVersion: input.scoringVersion ?? "unspecified",
  };
  if (Buffer.byteLength(JSON.stringify(profile)) > L.inputBytes)
    throw new Error("AI input exceeds size limit");
  return profile;
}
export function validateInterpretation(
  value: unknown,
  input: SafeProfile,
): Interpretation {
  const parsed = interpretationSchema.safeParse(value);
  if (!parsed.success) throw new Error("Invalid AI interpretation schema");
  const output = parsed.data;
  const referenced = new Set<string>();
  for (const evidence of output.evidence) {
    if (
      !Object.hasOwn(input.dimensions, evidence.dimension) ||
      input.dimensions[evidence.dimension] !== evidence.value ||
      referenced.has(evidence.dimension)
    )
      throw new Error("AI evidence does not match supplied scores");
    referenced.add(evidence.dimension);
  }
  const careers = new Set<string>();
  for (const explanation of output.careerExplanations) {
    if (
      !input.careers.some((career) => career.code === explanation.careerCode) ||
      careers.has(explanation.careerCode)
    )
      throw new Error(
        "AI explanation references an unknown or duplicate career",
      );
    careers.add(explanation.careerCode);
  }
  return output;
}
