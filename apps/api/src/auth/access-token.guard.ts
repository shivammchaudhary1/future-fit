import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { AuthSession, type AuthSessionDocument } from "./session.schema.js";
import { User, type UserDocument } from "../users/user.schema.js";

import {
  ACCESS_COOKIE_NAME,
  ACCESS_TOKEN_TYPE,
  AUTH_MESSAGES,
} from "./auth.constants.js";
import type { AuthenticatedRequest, JwtPayload } from "./auth.types.js";

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectModel(AuthSession.name)
    private readonly sessions: Model<AuthSessionDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token =
      request.cookies[ACCESS_COOKIE_NAME] ??
      request.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) throw new UnauthorizedException(AUTH_MESSAGES.invalidSession);
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
      });
      if (payload.type !== ACCESS_TOKEN_TYPE)
        throw new Error("Invalid token type");
      if (
        !Types.ObjectId.isValid(payload.sid) ||
        !Types.ObjectId.isValid(payload.sub)
      )
        throw new Error("Invalid token identity");
      const [session, user] = await Promise.all([
        this.sessions.exists({
          _id: payload.sid,
          userId: payload.sub,
          revokedAt: { $exists: false },
          expiresAt: { $gt: new Date() },
        }),
        this.users.exists({
          _id: payload.sub,
          emailVerified: true,
          status: { $ne: "SUSPENDED" },
        }),
      ]);
      if (!session || !user) throw new Error("Revoked session");
      request.auth = payload;
      return true;
    } catch {
      throw new UnauthorizedException(AUTH_MESSAGES.invalidSession);
    }
  }
}
