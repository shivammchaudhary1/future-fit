import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { createHash } from "node:crypto";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { ACCESS_COOKIE_NAME, ACCESS_TOKEN_TYPE } from "../auth/auth.constants.js";
import type { JwtPayload } from "../auth/auth.types.js";
import type { Request } from "express";
import { QueueService } from "../queue/queue.service.js";
import { HEALTH_ROUTE_PATTERN, HTTP_LIMITS } from "./http.constants.js";
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly queue: QueueService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    if (HEALTH_ROUTE_PATTERN.test(request.path)) return true;
    const auth = request.path.includes("/auth/");
    let subject = `ip:${request.ip ?? "unknown"}`;
    const token = (request.cookies as Record<string, string> | undefined)?.[ACCESS_COOKIE_NAME] ?? request.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
    if (!auth && token) {
      try {
        const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
          secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
          algorithms: ["HS256"],
        });
        if (payload.type === ACCESS_TOKEN_TYPE && /^[a-f\d]{24}$/i.test(payload.sub))
          subject = `user:${payload.sub.toLowerCase()}`;
      } catch {
        // Invalid credentials retain the shared anonymous limit. Authorization
        // and live session revocation checks still run in AccessTokenGuard.
      }
    }
    const identity = createHash("sha256")
      .update(subject)
      .digest("hex");
    let count: number;
    try {
      count = await this.queue.rateLimit(
        `rate-limit:${auth ? "auth" : "api"}:${identity}`,
        HTTP_LIMITS.windowMs,
      );
    } catch {
      throw new ServiceUnavailableException("Rate limit service unavailable.");
    }
    if (count > (auth ? HTTP_LIMITS.authRequests : HTTP_LIMITS.apiRequests))
      throw new HttpException("Too many requests. Try again shortly.", 429);
    return true;
  }
}
