import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AuthModule } from "../auth/auth.module.js";
import {
  GuardianLink,
  GuardianLinkSchema,
} from "../guardians/guardian.schema.js";
import {
  OrganizationMembership,
  OrganizationMembershipSchema,
} from "../organizations/membership.schema.js";
import { UsersController } from "./users.controller.js";

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      {
        name: OrganizationMembership.name,
        schema: OrganizationMembershipSchema,
      },
      {
        name: GuardianLink.name,
        schema: GuardianLinkSchema,
      },
    ]),
  ],
  controllers: [UsersController],
})
export class UsersModule {}
