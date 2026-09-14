import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Model } from "mongoose";

import { AccessTokenGuard } from "../auth/access-token.guard.js";
import { CurrentAuth } from "../auth/current-auth.decorator.js";
import type { JwtPayload } from "../auth/auth.types.js";
import { User, type UserDocument } from "./user.schema.js";
import { ProfileDto } from "./profile.dto.js";
import { CsrfGuard } from "../auth/csrf.guard.js";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller({ path: "users", version: "1" })
export class UsersController {
  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
  ) {}
  @Patch("me") @UseGuards(CsrfGuard) async update(
    @CurrentAuth() current: JwtPayload,
    @Body() input: ProfileDto,
  ) {
    await this.users.updateOne({ _id: current.sub }, { $set: input });
    return this.me(current);
  }
  @Get("me")
  async me(@CurrentAuth() current: JwtPayload) {
    const user = await this.users.findById(current.sub);
    if (!user) throw new NotFoundException("User not found.");
    return {
      success: true,
      data: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        preferredLanguage: user.preferredLanguage,
        emailVerified: user.emailVerified,
        status: user.status,
        globalRoles: user.globalRoles,
      },
    };
  }
}
