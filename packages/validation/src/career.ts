import { z } from "zod";
const text = z.string().trim().min(1).max(4000);
const profile = z.record(
  z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/),
  z.number().finite().min(0).max(100),
);
export const careerSchema = z
  .object({
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(100),
    translations: z
      .object({
        en: z
          .object({ name: text, summary: text, description: text.optional() })
          .strict(),
        hi: z
          .object({ name: text, summary: text, description: text.optional() })
          .strict(),
      })
      .strict(),
    domain: text,
    riasecProfile: profile.optional(),
    aptitudeProfile: profile.optional(),
    personalityProfile: profile.optional(),
    valuesProfile: profile.optional(),
    educationPath: z
      .array(z.object({ level: text, options: z.array(text).max(30) }).strict())
      .max(20)
      .default([]),
    entranceExams: z.array(text).max(50).default([]),
    skills: z.array(text).max(100).default([]),
    status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  })
  .strict();
export type CareerContent = z.infer<typeof careerSchema>;
export function cosineMatch(
  student: Record<string, number>,
  career: Record<string, number>,
) {
  const keys = Object.keys(student);
  if (
    !keys.length ||
    keys.some(
      (k) => !Number.isFinite(student[k]) || !Number.isFinite(career[k]),
    )
  )
    return null;
  let dot = 0,
    left = 0,
    right = 0;
  for (const key of keys) {
    const a = student[key]!;
    const b = career[key]!;
    dot += a * b;
    left += a * a;
    right += b * b;
  }
  if (!left || !right) return null;
  return (
    Math.round(
      Math.max(0, Math.min(1, dot / Math.sqrt(left * right))) * 10000,
    ) / 100
  );
}
