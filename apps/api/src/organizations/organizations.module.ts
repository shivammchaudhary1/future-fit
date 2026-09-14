import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module.js";
import {
  OrganizationMembership,
  OrganizationMembershipSchema,
} from "./membership.schema.js";
import { Organization, OrganizationSchema } from "./organization.schema.js";
import { OrganizationsController } from "./organizations.controller.js";
import { OrganizationsService } from "./organizations.service.js";

export const organizationModels = MongooseModule.forFeature([
  { name: Organization.name, schema: OrganizationSchema },
  { name: OrganizationMembership.name, schema: OrganizationMembershipSchema },
]);
@Module({
  imports: [AuthModule, organizationModels],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService, organizationModels],
})
export class OrganizationsModule {}
