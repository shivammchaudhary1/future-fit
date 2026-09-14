import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { hash, verify } from "argon2";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { Model, Types } from "mongoose";

import type {
  AuthResult,
  AuthSession as AuthSessionView,
  AuthUser,
} from "@future-fit/types";
import { User, type UserDocument } from "../users/user.schema.js";
import {
  AUTH_MESSAGES,
  DEFAULT_ACCESS_TTL,
  DEFAULT_REFRESH_TTL_DAYS,
  EMAIL_VERIFICATION_TTL_MS,
  PASSWORD_HASH_OPTIONS,
  PASSWORD_RESET_TTL_MS,
  REFRESH_TOKEN_TYPE,
  ACCESS_TOKEN_TYPE,
  TOKEN_BYTE_LENGTH,
} from "./auth.constants.js";
import { AuthMailService } from "./auth-mail.service.js";
import type {
  ForgotPasswordDto,
  GoogleAuthDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  TokenDto,
} from "./dto/auth.dto.js";
import {
  OneTimeToken,
  type OneTimeTokenDocument,
} from "./one-time-token.schema.js";
import { AuthSession, type AuthSessionDocument } from "./session.schema.js";
import type { JwtPayload, RequestMetadata } from "./auth.types.js";

@Injectable()
export class AuthService {
  private readonly google: OAuth2Client;
  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(AuthSession.name)
    private readonly sessions: Model<AuthSessionDocument>,
    @InjectModel(OneTimeToken.name)
    private readonly oneTimeTokens: Model<OneTimeTokenDocument>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: AuthMailService,
  ) {
    this.google = new OAuth2Client(this.config.get<string>("GOOGLE_CLIENT_ID"));
  }

  async register(input: RegisterDto): Promise<{ message: string }> {
    const email = input.email.trim().toLowerCase();
    if (await this.users.exists({ email }))
      throw new ConflictException(AUTH_MESSAGES.emailTaken);
    const user = await this.users.create({
      ...input,
      email,
      passwordHash: await hash(input.password, PASSWORD_HASH_OPTIONS),
      authProviders: [{ provider: "LOCAL" }],
    });
    const token = await this.createOneTimeToken(
      user._id,
      "EMAIL_VERIFICATION",
      EMAIL_VERIFICATION_TTL_MS,
    );
    await this.mail.sendVerification(user.email, token);
    return { message: "Account created. Check your email to verify it." };
  }

  async login(
    input: LoginDto,
    metadata: RequestMetadata,
  ): Promise<{
    result: AuthResult;
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await this.users
      .findOne({ email: input.email.trim().toLowerCase() })
      .select("+passwordHash");
    if (
      !user?.passwordHash ||
      !(await verify(user.passwordHash, input.password))
    )
      throw new UnauthorizedException(AUTH_MESSAGES.invalidCredentials);
    this.assertCanLogin(user);
    return this.createSession(user, metadata);
  }

  async googleLogin(
    input: GoogleAuthDto,
    metadata: RequestMetadata,
  ): Promise<{
    result: AuthResult;
    accessToken: string;
    refreshToken: string;
  }> {
    const clientId = this.config.getOrThrow<string>("GOOGLE_CLIENT_ID");
    const ticket = await this.google.verifyIdToken({
      idToken: input.credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified || !payload.sub)
      throw new UnauthorizedException(AUTH_MESSAGES.invalidCredentials);
    let user = await this.users.findOne({ email: payload.email.toLowerCase() });
    if (!user)
      user = await this.users.create({
        firstName: payload.given_name ?? "Student",
        lastName: payload.family_name ?? "",
        email: payload.email.toLowerCase(),
        emailVerified: true,
        status: "ACTIVE",
        authProviders: [{ provider: "GOOGLE", providerId: payload.sub }],
      });
    else if (
      !user.authProviders.some((provider) => provider.provider === "GOOGLE")
    ) {
      user.authProviders.push({ provider: "GOOGLE", providerId: payload.sub });
      user.emailVerified = true;
      if (user.status !== "SUSPENDED") user.status = "ACTIVE";
      await user.save();
    }
    this.assertCanLogin(user);
    return this.createSession(user, metadata);
  }

  async refresh(rawToken: string | undefined): Promise<{
    result: AuthResult;
    accessToken: string;
    refreshToken: string;
  }> {
    if (!rawToken)
      throw new UnauthorizedException(AUTH_MESSAGES.invalidSession);
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(rawToken, {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException(AUTH_MESSAGES.invalidSession);
    }
    if (payload.type !== REFRESH_TOKEN_TYPE)
      throw new UnauthorizedException(AUTH_MESSAGES.invalidSession);
    const session = await this.sessions
      .findById(payload.sid)
      .select("+refreshTokenHash");
    if (
      !session ||
      session.userId.toString() !== payload.sub ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      !(await verify(session.refreshTokenHash, rawToken))
    )
      throw new UnauthorizedException(AUTH_MESSAGES.invalidSession);
    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException(AUTH_MESSAGES.invalidSession);
    this.assertCanLogin(user);
    const tokens = await this.issueTokens(user, session._id.toString());
    const refreshTokenHash = await hash(
      tokens.refreshToken,
      PASSWORD_HASH_OPTIONS,
    );
    const rotated = await this.sessions.updateOne(
      {
        _id: session._id,
        refreshTokenHash: session.refreshTokenHash,
        revokedAt: { $exists: false },
        expiresAt: { $gt: new Date() },
      },
      { $set: { refreshTokenHash, lastUsedAt: new Date() } },
    );
    if (rotated.modifiedCount !== 1)
      throw new UnauthorizedException(AUTH_MESSAGES.invalidSession);
    return {
      result: { user: this.toAuthUser(user) },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessions.updateOne(
      { _id: sessionId },
      { revokedAt: new Date() },
    );
  }
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    await this.sessions.updateOne(
      { _id: sessionId, userId },
      { revokedAt: new Date() },
    );
  }
  async listSessions(
    userId: string,
    currentId: string,
  ): Promise<AuthSessionView[]> {
    const sessions = await this.sessions
      .find({
        userId,
        revokedAt: { $exists: false },
        expiresAt: { $gt: new Date() },
      })
      .sort({ lastUsedAt: -1 });
    return sessions.map((session) => ({
      id: session._id.toString(),
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt.toISOString(),
      lastUsedAt: session.lastUsedAt.toISOString(),
      current: session._id.toString() === currentId,
    }));
  }

  async verifyEmail(input: TokenDto): Promise<{ message: string }> {
    const token = await this.consumeOneTimeToken(
      input.token,
      "EMAIL_VERIFICATION",
    );
    await this.users.updateOne({ _id: token.userId }, { emailVerified: true });
    await this.users.updateOne(
      { _id: token.userId, status: "PENDING_VERIFICATION" },
      { status: "ACTIVE" },
    );
    return { message: "Email verified. You can now sign in." };
  }

  async resendVerification(
    input: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.users.findOne({
      email: input.email.trim().toLowerCase(),
      emailVerified: false,
    });
    if (user) {
      const token = await this.createOneTimeToken(
        user._id,
        "EMAIL_VERIFICATION",
        EMAIL_VERIFICATION_TTL_MS,
      );
      await this.mail.sendVerification(user.email, token);
    }
    return { message: AUTH_MESSAGES.genericRecovery };
  }

  async forgotPassword(input: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.users.findOne({
      email: input.email.trim().toLowerCase(),
    });
    if (user) {
      const token = await this.createOneTimeToken(
        user._id,
        "PASSWORD_RESET",
        PASSWORD_RESET_TTL_MS,
      );
      await this.mail.sendPasswordReset(user.email, token);
    }
    return { message: AUTH_MESSAGES.genericRecovery };
  }

  async resetPassword(input: ResetPasswordDto): Promise<{ message: string }> {
    const token = await this.consumeOneTimeToken(input.token, "PASSWORD_RESET");
    await this.users.updateOne(
      { _id: token.userId },
      { passwordHash: await hash(input.password, PASSWORD_HASH_OPTIONS) },
    );
    await this.sessions.updateMany(
      { userId: token.userId, revokedAt: { $exists: false } },
      { revokedAt: new Date() },
    );
    return { message: "Password updated. Sign in with your new password." };
  }

  private async createSession(user: UserDocument, metadata: RequestMetadata) {
    const days = this.config.get<number>(
      "JWT_REFRESH_TTL_DAYS",
      DEFAULT_REFRESH_TTL_DAYS,
    );
    const session = await this.sessions.create({
      userId: user._id,
      refreshTokenHash: "pending",
      expiresAt: new Date(Date.now() + days * 86_400_000),
      lastUsedAt: new Date(),
      ...metadata,
    });
    const tokens = await this.issueTokens(user, session._id.toString());
    session.refreshTokenHash = await hash(
      tokens.refreshToken,
      PASSWORD_HASH_OPTIONS,
    );
    await session.save();
    return {
      result: { user: this.toAuthUser(user) },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private async issueTokens(user: UserDocument, sessionId: string) {
    const accessPayload: JwtPayload = {
      sub: user._id.toString(),
      sid: sessionId,
      type: ACCESS_TOKEN_TYPE,
    };
    const refreshPayload: JwtPayload = {
      ...accessPayload,
      type: REFRESH_TOKEN_TYPE,
    };
    const accessToken = await this.jwt.signAsync(accessPayload, {
      jwtid: randomUUID(),
      secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
      expiresIn: this.config.get("JWT_ACCESS_TTL", DEFAULT_ACCESS_TTL),
    });
    const refreshToken = await this.jwt.signAsync(refreshPayload, {
      jwtid: randomUUID(),
      secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
      expiresIn: `${this.config.get<number>("JWT_REFRESH_TTL_DAYS", DEFAULT_REFRESH_TTL_DAYS)}d`,
    });
    return { accessToken, refreshToken };
  }

  private assertCanLogin(user: UserDocument) {
    if (user.status === "SUSPENDED")
      throw new UnauthorizedException(AUTH_MESSAGES.suspended);
    if (!user.emailVerified)
      throw new UnauthorizedException(AUTH_MESSAGES.verificationRequired);
  }

  private async createOneTimeToken(
    userId: Types.ObjectId,
    purpose: OneTimeToken["purpose"],
    ttl: number,
  ) {
    await this.oneTimeTokens.deleteMany({
      userId,
      purpose,
      consumedAt: { $exists: false },
    });
    const raw = randomBytes(TOKEN_BYTE_LENGTH).toString("hex");
    await this.oneTimeTokens.create({
      userId,
      purpose,
      tokenHash: this.digest(raw),
      expiresAt: new Date(Date.now() + ttl),
    });
    return raw;
  }

  private async consumeOneTimeToken(
    raw: string,
    purpose: OneTimeToken["purpose"],
  ) {
    const token = await this.oneTimeTokens.findOneAndUpdate(
      {
        tokenHash: this.digest(raw),
        purpose,
        consumedAt: { $exists: false },
        expiresAt: { $gt: new Date() },
      },
      { consumedAt: new Date() },
      { new: true },
    );
    if (!token) throw new UnauthorizedException(AUTH_MESSAGES.invalidToken);
    return token;
  }

  private digest(value: string) {
    return createHash("sha256").update(value).digest("hex");
  }
  private toAuthUser(user: UserDocument): AuthUser {
    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      preferredLanguage: user.preferredLanguage,
      emailVerified: user.emailVerified,
      status: user.status,
      globalRoles: user.globalRoles,
    };
  }
}
