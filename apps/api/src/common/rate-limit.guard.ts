import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { createHash } from "node:crypto";
import type { Request } from "express";
import { QueueService } from "../queue/queue.service.js";
import { HTTP_LIMITS } from "./http.constants.js";
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly queue: QueueService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    if (request.path.includes("/health")) return true;
    const auth = request.path.includes("/auth/");
    const identity = createHash("sha256")
      .update(request.ip ?? "unknown")
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
