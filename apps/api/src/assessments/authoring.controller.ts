import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AccessTokenGuard } from "../auth/access-token.guard.js";
import { SuperAdminGuard } from "../auth/super-admin.guard.js";
import { CsrfGuard } from "../auth/csrf.guard.js";
import { CurrentAuth } from "../auth/current-auth.decorator.js";
import type { JwtPayload } from "../auth/auth.types.js";
import { AuthoringService } from "./authoring.service.js";
@Controller({ path: "admin", version: "1" })
@UseGuards(AccessTokenGuard, SuperAdminGuard)
export class AuthoringController {
  constructor(private readonly authoring: AuthoringService) {}
  @Get("assessments") async list() {
    return { success: true, data: await this.authoring.list() };
  }
  @Get("questions") async questions() {
    return { success: true, data: await this.authoring.listQuestions() };
  }
  @Get("assessments/:assessmentId/versions")
  async versions(@Param("assessmentId") id: string) {
    return { success: true, data: await this.authoring.listVersions(id) };
  }
  @Post("assessments") @UseGuards(CsrfGuard) async create(
    @CurrentAuth() auth: JwtPayload,
    @Body() body: unknown,
  ) {
    return { success: true, data: await this.authoring.create(auth.sub, body) };
  }
  @Post("questions") @UseGuards(CsrfGuard) async question(
    @Body() body: unknown,
  ) {
    return { success: true, data: await this.authoring.createQuestion(body) };
  }
  @Post("assessments/:assessmentId/versions")
  @UseGuards(CsrfGuard)
  async version(@Param("assessmentId") id: string, @Body() body: unknown) {
    return {
      success: true,
      data: await this.authoring.createVersion(id, body),
    };
  }
  @Post("assessments/:assessmentId/versions/:versionId/publish")
  @UseGuards(CsrfGuard)
  async publish(
    @Param("assessmentId") id: string,
    @Param("versionId") versionId: string,
  ) {
    return { success: true, data: await this.authoring.publish(id, versionId) };
  }
}
