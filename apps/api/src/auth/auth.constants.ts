export const ACCESS_COOKIE_NAME = "ff_access";
export const REFRESH_COOKIE_NAME = "ff_refresh";
export const CSRF_COOKIE_NAME = "ff_csrf";
export const CSRF_COOKIE_PATH = "/";
export const CSRF_HEADER_NAME = "x-csrf-token";
export const ACCESS_COOKIE_PATH = "/api";
export const REFRESH_COOKIE_PATH = "/api/v1/auth";
export const ACCESS_TOKEN_TYPE = "access";
export const REFRESH_TOKEN_TYPE = "refresh";
export const DEFAULT_ACCESS_TTL = "15m";
export const DEFAULT_REFRESH_TTL_DAYS = 30;
export const PASSWORD_HASH_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;
export const EMAIL_VERIFICATION_TTL_MS = 30 * 60 * 1000;
export const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000;
export const TOKEN_BYTE_LENGTH = 32;
export const AUTH_EMAIL_SUBJECTS = {
  verification: "Verify your Future Fit email",
  passwordReset: "Reset your Future Fit password",
} as const;
export const AUTH_MESSAGES = {
  invalidCredentials: "Email or password is incorrect.",
  suspended: "This account has been suspended.",
  verificationRequired: "Verify your email before signing in.",
  emailTaken: "An account with this email already exists.",
  invalidToken: "This token is invalid or has expired.",
  invalidSession: "Your session is invalid or has expired.",
  genericRecovery:
    "If an account exists, recovery instructions have been sent.",
} as const;
