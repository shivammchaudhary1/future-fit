import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { IsMongoId, IsOptional } from "class-validator";
import { AccessTokenGuard } from "../auth/access-token.guard.js";
import { CsrfGuard } from "../auth/csrf.guard.js";
import { CurrentAuth } from "../auth/current-auth.decorator.js";
import type { JwtPayload } from "../auth/auth.types.js";
import { ResultsService } from "./results.service.js";
class ShareDto {
  @IsMongoId() sharedWithUserId!: string;
  @IsOptional() @IsMongoId() organizationId?: string;
}
@Controller({ path: "results", version: "1" })
@UseGuards(AccessTokenGuard)
export class ResultsController {
  constructor(private readonly results: ResultsService) {}
  @Get("shared") async shared(@CurrentAuth() auth: JwtPayload) {
    return { success: true, data: await this.results.shared(auth.sub) };
  }
  @Get() async list(@CurrentAuth() auth: JwtPayload) {
    return { success: true, data: await this.results.list(auth.sub) };
  }
  @Get(":id") async get(
    @CurrentAuth() auth: JwtPayload,
    @Param("id") id: string,
  ) {
    return { success: true, data: await this.results.get(auth.sub, id) };
  }
  @Get(":id/report") async report(
    @CurrentAuth() auth: JwtPayload,
    @Param("id") id: string,
  ) {
    return { success: true, data: await this.results.report(auth.sub, id) };
  }
  @Get(":id/shares") async shares(
    @CurrentAuth() auth: JwtPayload,
    @Param("id") id: string,
  ) {
    return { success: true, data: await this.results.listShares(auth.sub, id) };
  }
  @Post(":id/share") @UseGuards(CsrfGuard) async share(
    @CurrentAuth() auth: JwtPayload,
    @Param("id") id: string,
    @Body() body: ShareDto,
  ) {
    return {
      success: true,
      data: await this.results.share(
        auth.sub,
        id,
        body.sharedWithUserId,
        body.organizationId,
      ),
    };
  }
  @Delete(":id/share/:shareId")
  @UseGuards(CsrfGuard)
  @HttpCode(204)
  async revoke(
    @CurrentAuth() auth: JwtPayload,
    @Param("id") id: string,
    @Param("shareId") shareId: string,
  ) {
    await this.results.revoke(auth.sub, id, shareId);
  }
}
