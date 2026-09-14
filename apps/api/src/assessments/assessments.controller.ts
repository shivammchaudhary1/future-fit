import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AccessTokenGuard } from "../auth/access-token.guard.js";
import type { JwtPayload } from "../auth/auth.types.js";
import { CsrfGuard } from "../auth/csrf.guard.js";
import { CurrentAuth } from "../auth/current-auth.decorator.js";
import { AssessmentsService } from "./assessments.service.js";
import { SaveResponsesDto, StartAssessmentDto } from "./dto/assessment.dto.js";

@ApiTags("assessments")
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller({ path: "assessments", version: "1" })
export class AssessmentsController {
  constructor(private readonly assessments: AssessmentsService) {}
  @Get() async list() {
    return this.wrap(await this.assessments.list());
  }
  @Get(":assessmentId") async get(@Param("assessmentId") id: string) {
    return this.wrap(await this.assessments.get(id));
  }
  @Post(":assessmentId/start") @UseGuards(CsrfGuard) async start(
    @CurrentAuth() auth: JwtPayload,
    @Param("assessmentId") id: string,
    @Body() input: StartAssessmentDto,
  ) {
    return this.wrap(await this.assessments.start(auth.sub, id, input));
  }
  private wrap<T>(data: T) {
    return { success: true, data };
  }
}

@ApiTags("attempts")
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller({ path: "attempts", version: "1" })
export class AttemptsController {
  constructor(private readonly assessments: AssessmentsService) {}
  @Get() async list(@CurrentAuth() auth: JwtPayload) {
    return this.wrap(await this.assessments.listAttempts(auth.sub));
  }
  @Post(":attemptId/save-exit") @UseGuards(CsrfGuard) async saveExit(
    @CurrentAuth() auth: JwtPayload,
    @Param("attemptId") id: string,
    @Body() input: SaveResponsesDto,
  ) {
    return this.wrap(await this.assessments.save(auth.sub, id, input));
  }
  @Get(":attemptId") async get(
    @CurrentAuth() auth: JwtPayload,
    @Param("attemptId") id: string,
  ) {
    return this.wrap(await this.assessments.getAttempt(auth.sub, id));
  }
  @Patch(":attemptId/responses") @UseGuards(CsrfGuard) async save(
    @CurrentAuth() auth: JwtPayload,
    @Param("attemptId") id: string,
    @Body() input: SaveResponsesDto,
  ) {
    return this.wrap(await this.assessments.save(auth.sub, id, input));
  }
  @Post(":attemptId/submit")
  @UseGuards(CsrfGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async submit(
    @CurrentAuth() auth: JwtPayload,
    @Param("attemptId") id: string,
  ) {
    return this.wrap(await this.assessments.submit(auth.sub, id));
  }
  @Get(":attemptId/result") async result(
    @CurrentAuth() auth: JwtPayload,
    @Param("attemptId") id: string,
  ) {
    return this.wrap(await this.assessments.result(auth.sub, id));
  }
  private wrap<T>(data: T) {
    return { success: true, data };
  }
}
