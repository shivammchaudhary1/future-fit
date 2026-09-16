import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { AccessTokenGuard } from "../auth/access-token.guard.js";
import type { JwtPayload } from "../auth/auth.types.js";
import { CsrfGuard } from "../auth/csrf.guard.js";
import { CurrentAuth } from "../auth/current-auth.decorator.js";
import { UpdateStudentProfileDto } from "./dto/student-profile.dto.js";
import { StudentsService } from "./students.service.js";

@ApiTags("students")
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller({ path: "students", version: "1" })
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  @Get("me/profile")
  async profile(@CurrentAuth() auth: JwtPayload) {
    return this.wrap(await this.students.getProfile(auth.sub));
  }

  @Patch("me/profile")
  @UseGuards(CsrfGuard)
  async updateProfile(
    @CurrentAuth() auth: JwtPayload,
    @Body() input: UpdateStudentProfileDto,
  ) {
    return this.wrap(await this.students.updateProfile(auth.sub, input));
  }

  @Get("me/fit-profile")
  async fitProfile(@CurrentAuth() auth: JwtPayload) {
    return this.wrap(await this.students.getFitProfile(auth.sub));
  }

  private wrap<T>(data: T) {
    return { success: true, data };
  }
}
