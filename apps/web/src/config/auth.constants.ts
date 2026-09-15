export const AUTH_COPY = {
  signInTitle: "Welcome back",
  signInSubtitle: "Continue building a future that fits you.",
  registerTitle: "Start your journey",
  registerSubtitle: "Your strengths. Your choices. Your future.",
  forgotTitle: "Reset your password",
  forgotSubtitle: "We’ll send a secure reset link if the email is registered.",
} as const;

export const AUTH_LINKS = {
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email",

  /*
   * Never hard-code login to the student dashboard.
   * /workspace resolves the authenticated account's real workspace:
   * SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, USER/STUDENT or GUARDIAN.
   */
  dashboard: "/workspace",
} as const;

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";
