import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";

import { User, UserSchema } from "../users/user.schema.js";
import { AccessTokenGuard } from "./access-token.guard.js";
import { AuthController } from "./auth.controller.js";
import { AuthMailService } from "./auth-mail.service.js";
import { AuthService } from "./auth.service.js";
import { CsrfGuard } from "./csrf.guard.js";
import { OriginGuard } from "./origin.guard.js";
import { TurnstileGuard } from "./turnstile.guard.js";
import { SuperAdminGuard } from "./super-admin.guard.js";
import { OneTimeToken, OneTimeTokenSchema } from "./one-time-token.schema.js";
import { AuthSession, AuthSessionSchema } from "./session.schema.js";

@Module({
  imports: [
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AuthSession.name, schema: AuthSessionSchema },
      { name: OneTimeToken.name, schema: OneTimeTokenSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthMailService,
    AccessTokenGuard,
    CsrfGuard,
    OriginGuard,
    TurnstileGuard,
    SuperAdminGuard,
  ],
  exports: [AccessTokenGuard, CsrfGuard, SuperAdminGuard, MongooseModule],
})
export class AuthModule {}
