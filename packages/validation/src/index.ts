import { z } from "zod";

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
