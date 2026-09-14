import {
  Body,
  Controller,
  Get,
  Module,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import { IsMongoId, IsString, Length } from "class-validator";
import { AuthModule } from "../auth/auth.module.js";
import { AccessTokenGuard } from "../auth/access-token.guard.js";
import { CsrfGuard } from "../auth/csrf.guard.js";
import { CurrentAuth } from "../auth/current-auth.decorator.js";
import type { JwtPayload } from "../auth/auth.types.js";
import { OrganizationsModule } from "../organizations/organizations.module.js";
import { OrganizationsService } from "../organizations/organizations.service.js";
import { ResultsModule } from "./results.module.js";
import { ResultsService } from "./results.service.js";
class NoteDto {
  @IsMongoId() organizationId!: string;
  @IsString() @Length(1, 4000) text!: string;
}
@Controller({ path: "results/:resultId/notes", version: "1" })
@UseGuards(AccessTokenGuard)
class NotesController {
  constructor(
    @InjectConnection() private readonly database: Connection,
    private readonly results: ResultsService,
    private readonly organizations: OrganizationsService,
  ) {}
  @Get() async list(
    @CurrentAuth() auth: JwtPayload,
    @Param("resultId") resultId: string,
  ) {
    await this.results.authorize(auth.sub, resultId);
    return {
      success: true,
      data: await this.database
        .collection("guidance_notes")
        .find({ resultId: new Types.ObjectId(resultId) })
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray(),
    };
  }
  @Post() @UseGuards(CsrfGuard) async create(
    @CurrentAuth() auth: JwtPayload,
    @Param("resultId") resultId: string,
    @Body() body: NoteDto,
  ) {
    await this.organizations.requireRole(auth.sub, body.organizationId, [
      "TEACHER",
      "SCHOOL_ADMIN",
    ]);
    await this.results.authorize(auth.sub, resultId);
    const note = {
      resultId: new Types.ObjectId(resultId),
      authorUserId: new Types.ObjectId(auth.sub),
      organizationId: new Types.ObjectId(body.organizationId),
      text: body.text,
      createdAt: new Date(),
    };
    const inserted = await this.database
      .collection("guidance_notes")
      .insertOne(note);
    return { success: true, data: { ...note, _id: inserted.insertedId } };
  }
}
@Module({
  imports: [AuthModule, OrganizationsModule, ResultsModule],
  controllers: [NotesController],
})
export class NotesModule {}
