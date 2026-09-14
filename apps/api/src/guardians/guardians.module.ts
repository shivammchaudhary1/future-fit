import {
  Body,
  Controller,
  Get,
  Module,
  NotFoundException,
  Param,
  Post,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel, MongooseModule } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Equals, IsMongoId } from "class-validator";
import { AuthModule } from "../auth/auth.module.js";
import { AccessTokenGuard } from "../auth/access-token.guard.js";
import { CsrfGuard } from "../auth/csrf.guard.js";
import { CurrentAuth } from "../auth/current-auth.decorator.js";
import type { JwtPayload } from "../auth/auth.types.js";
import { User, type UserDocument } from "../users/user.schema.js";
import {
  GuardianLink,
  GuardianLinkSchema,
  type GuardianLinkDocument,
} from "./guardian.schema.js";
class GuardianRequestDto {
  @IsMongoId() guardianId!: string;
}
class ConsentDto {
  @Equals(true) accepted!: boolean;
}
@Controller({ path: "guardians", version: "1" })
@UseGuards(AccessTokenGuard)
class GuardiansController {
  constructor(
    @InjectModel(GuardianLink.name)
    private readonly links: Model<GuardianLinkDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    private readonly config: ConfigService,
  ) {}
  @Get() async list(@CurrentAuth() auth: JwtPayload) {
    return {
      success: true,
      data: await this.links
        .find({ $or: [{ studentId: auth.sub }, { guardianId: auth.sub }] })
        .lean(),
    };
  }
  @Get("consent-policy") policy() {
    return {
      success: true,
      data: {
        version: this.config.getOrThrow<string>("GUARDIAN_CONSENT_VERSION"),
        text: this.config.getOrThrow<string>("GUARDIAN_CONSENT_TEXT"),
      },
    };
  }
  @Post("requests") @UseGuards(CsrfGuard) async request(
    @CurrentAuth() auth: JwtPayload,
    @Body() body: GuardianRequestDto,
  ) {
    if (auth.sub === body.guardianId)
      throw new BadRequestException(
        "Student and guardian must be different accounts.",
      );
    if (
      !(await this.users.exists({
        _id: body.guardianId,
        emailVerified: true,
        status: "ACTIVE",
      }))
    )
      throw new NotFoundException("Verified guardian account not found.");
    const consentVersion = this.config.getOrThrow<string>(
      "GUARDIAN_CONSENT_VERSION",
    );
    return {
      success: true,
      data: await this.links.findOneAndUpdate(
        {
          studentId: new Types.ObjectId(auth.sub),
          guardianId: new Types.ObjectId(body.guardianId),
        },
        { $setOnInsert: { consentVersion, status: "REQUESTED" } },
        { upsert: true, new: true },
      ),
    };
  }
  @Post(":id/consent") @UseGuards(CsrfGuard) async consent(
    @CurrentAuth() auth: JwtPayload,
    @Param("id") id: string,
    @Body() _body: ConsentDto,
  ) {
    const link = await this.links.findOneAndUpdate(
      {
        _id: id,
        guardianId: auth.sub,
        status: "REQUESTED",
        consentVersion: this.config.getOrThrow<string>(
          "GUARDIAN_CONSENT_VERSION",
        ),
      },
      { $set: { status: "APPROVED", consentedAt: new Date() } },
      { new: true },
    );
    if (!link)
      throw new NotFoundException("Current consent request not found.");
    return { success: true, data: link };
  }
  @Post(":id/revoke") @UseGuards(CsrfGuard) async revoke(
    @CurrentAuth() auth: JwtPayload,
    @Param("id") id: string,
  ) {
    const link = await this.links.findOneAndUpdate(
      { _id: id, $or: [{ studentId: auth.sub }, { guardianId: auth.sub }] },
      { $set: { status: "REVOKED", revokedAt: new Date() } },
      { new: true },
    );
    if (!link) throw new NotFoundException("Guardian link not found.");
    return { success: true, data: link };
  }
}
@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: GuardianLink.name, schema: GuardianLinkSchema },
    ]),
  ],
  controllers: [GuardiansController],
})
export class GuardiansModule {}
