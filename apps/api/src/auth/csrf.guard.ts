import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { timingSafeEqual } from "node:crypto";
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "./auth.constants.js";
import type { AuthenticatedRequest } from "./auth.types.js";

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const cookie = request.cookies[CSRF_COOKIE_NAME];
    const header = request.headers[CSRF_HEADER_NAME] as string | undefined;
    if (!cookie || !header) throw new ForbiddenException("Invalid CSRF token.");
    const left = Buffer.from(cookie);
    const right = Buffer.from(header);
    if (left.length !== right.length || !timingSafeEqual(left, right))
      throw new ForbiddenException("Invalid CSRF token.");
    return true;
  }
}
