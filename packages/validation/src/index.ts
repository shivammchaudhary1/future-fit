import { z } from "zod";
export * from "./assessment.js";
export * from "./assessment.constants.js";
export * from "./career.js";

export const localeSchema = z.enum(["en", "hi"]);

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
});

export const registerSchema = loginSchema.extend({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(1).max(60),
  preferredLanguage: localeSchema.default("en"),
});

export const forgotPasswordSchema = z.object({ email: z.email() });
export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(8).max(128),
});
export const verifyEmailSchema = z.object({ token: z.string().min(32) });
export const googleAuthSchema = z.object({ credential: z.string().min(20) });
