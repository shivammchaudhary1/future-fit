import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";
import {
  MEMBERSHIP_STATUSES,
  ORGANIZATION_ROLES,
} from "./organization.constants.js";

@Schema({ timestamps: true, collection: "organization_memberships" })
export class OrganizationMembership {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  organizationId!: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, required: true }) userId!: Types.ObjectId;
  @Prop({ type: String, enum: ORGANIZATION_ROLES, required: true })
  role!: (typeof ORGANIZATION_ROLES)[number];
  @Prop({ type: String, enum: MEMBERSHIP_STATUSES, default: "ACTIVE" })
  status!: (typeof MEMBERSHIP_STATUSES)[number];
  @Prop() joinedAt?: Date;
}
export type OrganizationMembershipDocument =
  HydratedDocument<OrganizationMembership>;
export const OrganizationMembershipSchema = SchemaFactory.createForClass(
  OrganizationMembership,
);
OrganizationMembershipSchema.index(
  { organizationId: 1, userId: 1 },
  { unique: true },
);
OrganizationMembershipSchema.index({ organizationId: 1, role: 1 });
OrganizationMembershipSchema.index({ userId: 1, status: 1 });
