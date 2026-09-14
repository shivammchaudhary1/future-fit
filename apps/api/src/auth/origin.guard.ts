import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AuthenticatedRequest } from "./auth.types.js";

@Injectable()
export class OriginGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;
    const origin = request.headers.origin;
    const allowed = this.config
      .get<string>("WEB_ORIGIN", "http://localhost:3000")
      .split(",")
      .map((value) => value.trim());
    if (!origin || !allowed.includes(origin))
      throw new ForbiddenException("Untrusted request origin.");
    return true;
  }
}
