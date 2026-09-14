import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AccessTokenGuard } from "../auth/access-token.guard.js";
import type { JwtPayload } from "../auth/auth.types.js";
import { CsrfGuard } from "../auth/csrf.guard.js";
import { CurrentAuth } from "../auth/current-auth.decorator.js";
import { CreateOrganizationDto } from "./dto/organization.dto.js";
import { OrganizationsService } from "./organizations.service.js";
import { InviteMemberDto, MembershipStatusDto } from "./membership.dto.js";
import { SuperAdminGuard } from "../auth/super-admin.guard.js";

@ApiTags("organizations")
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller({ path: "organizations", version: "1" })
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}
  @Get() async mine(@CurrentAuth() auth: JwtPayload) {
    return this.wrap(await this.organizations.mine(auth.sub));
  }
  @Post(":organizationId/invitations") @UseGuards(CsrfGuard) async invite(
    @CurrentAuth() auth: JwtPayload,
    @Param("organizationId") id: string,
    @Body() body: InviteMemberDto,
  ) {
    return this.wrap(await this.organizations.invite(auth.sub, id, body));
  }
  @Post(":organizationId/accept") @UseGuards(CsrfGuard) async accept(
    @CurrentAuth() auth: JwtPayload,
    @Param("organizationId") id: string,
  ) {
    return this.wrap(await this.organizations.accept(auth.sub, id));
  }
  @Post(":organizationId/member-status") @UseGuards(CsrfGuard) async status(
    @CurrentAuth() auth: JwtPayload,
    @Param("organizationId") id: string,
    @Body() body: MembershipStatusDto,
  ) {
    return this.wrap(
      await this.organizations.setMemberStatus(
        auth.sub,
        id,
        body.userId,
        body.status,
      ),
    );
  }
  @Post() @UseGuards(CsrfGuard, SuperAdminGuard) async create(
    @CurrentAuth() auth: JwtPayload,
    @Body() input: CreateOrganizationDto,
  ) {
    return this.wrap(await this.organizations.create(auth.sub, input));
  }
  @Get(":organizationId") async get(
    @CurrentAuth() auth: JwtPayload,
    @Param("organizationId") id: string,
  ) {
    return this.wrap(await this.organizations.getForMember(auth.sub, id));
  }
  @Get(":organizationId/members") async members(
    @CurrentAuth() auth: JwtPayload,
    @Param("organizationId") id: string,
  ) {
    return this.wrap(await this.organizations.members(auth.sub, id));
  }
  private wrap<T>(data: T) {
    return { success: true, data };
  }
}
