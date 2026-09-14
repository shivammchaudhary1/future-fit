export function validateEnvironment(environment: Record<string, unknown>) {
  if (environment.NODE_ENV === "production") {
    for (const name of ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"]) {
      const value = environment[name];
      if (
        typeof value !== "string" ||
        value.length < 32 ||
        value.includes("replace-me")
      )
        throw new Error(`A strong ${name} must be configured.`);
    }
    if (environment.JWT_ACCESS_SECRET === environment.JWT_REFRESH_SECRET)
      throw new Error("Access and refresh secrets must be different.");
    for (const name of [
      "MONGODB_URI",
      "REDIS_URL",
      "WEB_ORIGIN",
      "RESEND_API_KEY",
      "AUTH_EMAIL_FROM",
    ])
      if (!environment[name]) throw new Error(`${name} must be configured.`);
    if (
      typeof environment.WEB_ORIGIN !== "string" ||
      !environment.WEB_ORIGIN.split(",").every((origin) =>
        origin.trim().startsWith("https://"),
      )
    )
      throw new Error("Production origins require HTTPS.");
  }
  return environment;
}
