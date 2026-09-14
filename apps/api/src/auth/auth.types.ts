import type { Request } from "express";

export interface JwtPayload {
  sub: string;
  sid: string;
  type: "access" | "refresh";
}

export interface AuthenticatedRequest extends Request {
  auth: JwtPayload;
  cookies: Record<string, string | undefined>;
}

export interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
}
