import { Controller, Get, Module, Query, UseGuards } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import { IsMongoId } from "class-validator";
import { AuthModule } from "../auth/auth.module.js";
import { AccessTokenGuard } from "../auth/access-token.guard.js";
import { CurrentAuth } from "../auth/current-auth.decorator.js";
import type { JwtPayload } from "../auth/auth.types.js";
import { OrganizationsModule } from "../organizations/organizations.module.js";
import { OrganizationsService } from "../organizations/organizations.service.js";
class SchoolQuery {
  @IsMongoId() organizationId!: string;
}
@Controller({ path: "school", version: "1" })
@UseGuards(AccessTokenGuard)
class AnalyticsController {
  constructor(
    @InjectConnection() private readonly database: Connection,
    private readonly organizations: OrganizationsService,
  ) {}
  @Get("dashboard") async dashboard(
    @CurrentAuth() auth: JwtPayload,
    @Query() query: SchoolQuery,
  ) {
    await this.organizations.requireRole(auth.sub, query.organizationId, [
      "SCHOOL_ADMIN",
    ]);
    const aggregate = await this.database
      .collection("school_aggregates")
      .findOne({ organizationId: new Types.ObjectId(query.organizationId) });
    return {
      success: true,
      data: aggregate ?? {
        organizationId: query.organizationId,
        status: "PENDING",
        updatedAt: null,
      },
    };
  }
  @Get("analytics") analytics(
    @CurrentAuth() auth: JwtPayload,
    @Query() query: SchoolQuery,
  ) {
    return this.dashboard(auth, query);
  }
}
@Module({
  imports: [AuthModule, OrganizationsModule],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
