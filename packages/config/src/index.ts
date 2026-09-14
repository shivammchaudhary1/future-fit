export const PRODUCT_NAME = "Future Fit";
export const PRODUCT_TAGLINE = "Discover Today, Build Tomorrow.";
export const SUPPORTED_LOCALES = ["en", "hi"] as const;
export const DEFAULT_LOCALE = "en";
export const API_PREFIX = "/api/v1";

export const AUTH_ROUTES = {
  register: "/auth/register",
  login: "/auth/login",
  google: "/auth/google",
  refresh: "/auth/refresh",
  logout: "/auth/logout",
  verifyEmail: "/auth/verify-email",
  resendVerification: "/auth/resend-verification",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
  sessions: "/auth/sessions",
  me: "/users/me",
} as const;

export const ASSESSMENT_TYPES = [
  "INTEREST",
  "PERSONALITY",
  "APTITUDE",
  "VALUES",
  "EDUCATIONAL_SURVEY",
  "ACADEMIC_PREFERENCE",
] as const;

export const QUEUE_NAMES = {
  assessmentScoring: "assessment-scoring",
  careerMatching: "career-matching",
  aiInterpretation: "ai-interpretation",
  pdfGeneration: "pdf-generation",
  email: "email",
  pushNotification: "push-notification",
  schoolAnalytics: "school-analytics",
  auditProcessing: "audit-processing",
} as const;
