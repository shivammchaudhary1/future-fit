import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AuthenticatedRequest } from "./auth.types.js";
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const VERIFY_TIMEOUT_MS = 10_000;
@Injectable()
export class TurnstileGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}
  async canActivate(context: ExecutionContext) {
    const secret = this.config.get<string>("TURNSTILE_SECRET_KEY");
    if (!secret) {
      if (this.config.get("NODE_ENV") === "production")
        throw new ServiceUnavailableException(
          "Bot protection is not configured.",
        );
      return true;
    }
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.headers["x-turnstile-token"];
    if (typeof token !== "string" || !token || token.length > 2048)
      throw new ForbiddenException("Complete the security challenge.");
    let value: unknown;
    try {
      const response = await fetch(VERIFY_URL, {
        method: "POST",
        body: new URLSearchParams({
          secret,
          response: token,
          remoteip: request.ip ?? "",
        }),
        signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error("Verification unavailable");
      value = await response.json();
    } catch {
      throw new ServiceUnavailableException(
        "Security verification unavailable. Try again.",
      );
    }
    const allowedHosts = this.config
      .get<string>("WEB_ORIGIN", "http://localhost:3000")
      .split(",")
      .map((origin) => new URL(origin.trim()).hostname);
    if (
      !value ||
      typeof value !== "object" ||
      !("success" in value) ||
      value.success !== true ||
      !("hostname" in value) ||
      typeof value.hostname !== "string" ||
      !allowedHosts.includes(value.hostname) ||
      !("action" in value) ||
      value.action !== request.path.split("/").pop()
    )
      throw new ForbiddenException("Security challenge verification failed.");
    return true;
  }
}
