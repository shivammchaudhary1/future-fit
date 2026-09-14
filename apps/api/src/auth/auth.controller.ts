import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { CookieOptions, Response } from "express";

import { AccessTokenGuard } from "./access-token.guard.js";
import { randomBytes } from "node:crypto";
import {
  ACCESS_COOKIE_NAME,
  ACCESS_COOKIE_PATH,
  CSRF_COOKIE_NAME,
  CSRF_COOKIE_PATH,
  DEFAULT_REFRESH_TTL_DAYS,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  TOKEN_BYTE_LENGTH,
} from "./auth.constants.js";
import { AuthService } from "./auth.service.js";
import type { AuthenticatedRequest, JwtPayload } from "./auth.types.js";
import { CurrentAuth } from "./current-auth.decorator.js";
import { CsrfGuard } from "./csrf.guard.js";
import { OriginGuard } from "./origin.guard.js";
import { TurnstileGuard } from "./turnstile.guard.js";
import {
  ForgotPasswordDto,
  GoogleAuthDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  TokenDto,
} from "./dto/auth.dto.js";

@ApiTags("auth")
@Controller({ path: "auth", version: "1" })
@UseGuards(OriginGuard)
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post("register")
  @UseGuards(TurnstileGuard)
  register(@Body() input: RegisterDto) {
    return this.success(this.auth.register(input));
  }

  @Post("login")
  @UseGuards(TurnstileGuard)
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() input: LoginDto,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const auth = await this.auth.login(input, this.metadata(request));
    this.setAuthCookies(response, auth.accessToken, auth.refreshToken);
    return this.success(auth.result);
  }

  @Post("google")
  @HttpCode(HttpStatus.OK)
  async google(
    @Body() input: GoogleAuthDto,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const auth = await this.auth.googleLogin(input, this.metadata(request));
    this.setAuthCookies(response, auth.accessToken, auth.refreshToken);
    return this.success(auth.result);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const auth = await this.auth.refresh(request.cookies[REFRESH_COOKIE_NAME]);
    this.setAuthCookies(response, auth.accessToken, auth.refreshToken);
    return this.success(auth.result);
  }

  @Post("logout")
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard, CsrfGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentAuth() current: JwtPayload,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.logout(current.sid);
    this.clearAuthCookies(response);
  }

  @Get("sessions")
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  async sessions(@CurrentAuth() current: JwtPayload) {
    return this.success(await this.auth.listSessions(current.sub, current.sid));
  }

  @Delete("sessions/:sessionId")
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard, CsrfGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeSession(
    @CurrentAuth() current: JwtPayload,
    @Param("sessionId") sessionId: string,
  ) {
    await this.auth.revokeSession(current.sub, sessionId);
  }

  @Post("verify-email")
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() input: TokenDto) {
    return this.success(await this.auth.verifyEmail(input));
  }

  @Post("resend-verification")
  @UseGuards(TurnstileGuard)
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() input: ForgotPasswordDto) {
    return this.success(await this.auth.resendVerification(input));
  }

  @Post("forgot-password")
  @UseGuards(TurnstileGuard)
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() input: ForgotPasswordDto) {
    return this.success(await this.auth.forgotPassword(input));
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() input: ResetPasswordDto) {
    return this.success(await this.auth.resetPassword(input));
  }

  private success<T>(data: T | Promise<T>) {
    return Promise.resolve(data).then((resolved) => ({
      success: true,
      data: resolved,
    }));
  }
  private metadata(request: AuthenticatedRequest) {
    return { ipAddress: request.ip, userAgent: request.headers["user-agent"] };
  }
  private baseCookieOptions(): CookieOptions {
    return {
      secure:
        this.config.get("NODE_ENV") === "production" ||
        this.config.get("AUTH_COOKIE_SECURE", "false") === "true",
      sameSite: "lax",
    };
  }
  private setAuthCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const base = this.baseCookieOptions();
    response.clearCookie(CSRF_COOKIE_NAME, {
      ...base,
      path: ACCESS_COOKIE_PATH,
    });
    response.cookie(ACCESS_COOKIE_NAME, accessToken, {
      ...base,
      httpOnly: true,
      path: ACCESS_COOKIE_PATH,
      maxAge: 15 * 60 * 1000,
    });
    response.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      ...base,
      httpOnly: true,
      path: REFRESH_COOKIE_PATH,
      maxAge:
        this.config.get<number>(
          "JWT_REFRESH_TTL_DAYS",
          DEFAULT_REFRESH_TTL_DAYS,
        ) * 86_400_000,
    });
    response.cookie(
      CSRF_COOKIE_NAME,
      randomBytes(TOKEN_BYTE_LENGTH).toString("hex"),
      {
        ...base,
        httpOnly: false,
        path: CSRF_COOKIE_PATH,
        maxAge:
          this.config.get<number>(
            "JWT_REFRESH_TTL_DAYS",
            DEFAULT_REFRESH_TTL_DAYS,
          ) * 86_400_000,
      },
    );
  }
  private clearAuthCookies(response: Response) {
    const base = this.baseCookieOptions();
    response.clearCookie(ACCESS_COOKIE_NAME, {
      ...base,
      path: ACCESS_COOKIE_PATH,
    });
    response.clearCookie(REFRESH_COOKIE_NAME, {
      ...base,
      path: REFRESH_COOKIE_PATH,
    });
    response.clearCookie(CSRF_COOKIE_NAME, {
      ...base,
      path: CSRF_COOKIE_PATH,
    });
  }
}
