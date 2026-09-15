import { z } from "zod";

const text = z.string().trim().min(1).max(4000);
const key = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/);

const profile = z.record(
  key,
  z.number().finite().min(0).max(100),
);

export const careerSourceReferenceSchema = z
  .object({
    sourceType: z.enum([
      "LEGACY_CAREER_EXPLORER",
      "NCO",
      "NSDC",
      "NCS",
      "ESCO",
      "FUTURE_FIT",
      "OTHER",
    ]),
    sourceRecordId: text.optional(),
    reference: text,
    url: z.url().optional(),
    verifiedAt: z.string().datetime().optional(),
  })
  .strict();

const indiaCareerContextSchema = z
  .object({
    relevance: z.enum(["HIGH", "MEDIUM", "LOW", "REVIEW"]).default("REVIEW"),
    reviewStatus: z.enum(["PENDING", "REVIEWED"]).default("PENDING"),
    schoolStreams: z.array(text).max(20).default([]),
    qualificationRoutes: z.array(text).max(50).default([]),
    vocationalRoutes: z.array(text).max(50).default([]),
    regulators: z.array(text).max(30).default([]),
    notes: z.array(text).max(30).default([]),
  })
  .strict();

const taxonomySchema = z
  .object({
    domain: text.optional(),
    cluster: text.optional(),
    subCluster: text.optional(),
  })
  .strict();

export const careerSchema = z
  .object({
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(100),

    translations: z
      .object({
        en: z
          .object({
            name: text,
            summary: text,
            description: text.optional(),
          })
          .strict(),
        hi: z
          .object({
            name: text,
            summary: text,
            description: text.optional(),
          })
          .strict(),
      })
      .strict(),

    /*
     * Keep `domain` for compatibility with the existing UI/API.
     * `taxonomy` is the newer structured representation.
     */
    domain: text,
    taxonomy: taxonomySchema.optional(),
    aliases: z.array(text).max(50).default([]),

    /*
     * Existing profile fields remain supported while Future Fit migrates
     * from the old O*NET/legacy matching path.
     */
    riasecProfile: profile.optional(),
    aptitudeProfile: profile.optional(),
    personalityProfile: profile.optional(),
    valuesProfile: profile.optional(),

    educationPath: z
      .array(
        z
          .object({
            level: text,
            options: z.array(text).max(30),
          })
          .strict(),
      )
      .max(20)
      .default([]),

    entranceExams: z.array(text).max(50).default([]),
    skills: z.array(text).max(100).default([]),

    india: indiaCareerContextSchema.default({
      relevance: "REVIEW",
      reviewStatus: "PENDING",
      schoolStreams: [],
      qualificationRoutes: [],
      vocationalRoutes: [],
      regulators: [],
      notes: [],
    }),

    sourceReferences: z
      .array(careerSourceReferenceSchema)
      .max(100)
      .default([]),

    verificationStatus: z
      .enum(["UNVERIFIED", "SOURCE_VERIFIED", "REVIEWED"])
      .default("UNVERIFIED"),

    dataVersion: z.string().trim().min(1).max(40).default("1.0.0"),

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
      (k) =>
        !Number.isFinite(student[k]) ||
        !Number.isFinite(career[k]),
    )
  ) {
    return null;
  }

  let dot = 0;
  let left = 0;
  let right = 0;

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
      Math.max(
        0,
        Math.min(1, dot / Math.sqrt(left * right)),
      ) * 10000,
    ) / 100
  );
}
