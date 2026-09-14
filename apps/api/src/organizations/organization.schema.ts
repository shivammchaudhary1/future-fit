import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import {
  ORGANIZATION_STATUSES,
  ORGANIZATION_TYPES,
} from "./organization.constants.js";

@Schema({ timestamps: true, collection: "organizations" })
export class Organization {
  @Prop({ required: true, trim: true, index: true }) name!: string;
  @Prop({ required: true, type: String, enum: ORGANIZATION_TYPES })
  type!: (typeof ORGANIZATION_TYPES)[number];
  @Prop({ type: String, enum: ["CBSE", "ICSE", "STATE", "IB", "OTHER"] })
  board?: string;
  @Prop({
    type: { city: String, state: String, country: String },
    required: true,
  })
  address!: { city: string; state: string; country: string };
  @Prop({
    type: {
      supportedLanguages: [String],
      allowStudentSelfAssessment: Boolean,
      allowPersonalReportSharing: Boolean,
    },
    default: {
      supportedLanguages: ["en", "hi"],
      allowStudentSelfAssessment: true,
      allowPersonalReportSharing: true,
    },
  })
  settings!: {
    supportedLanguages: Array<"en" | "hi">;
    allowStudentSelfAssessment: boolean;
    allowPersonalReportSharing: boolean;
  };
  @Prop({ type: String, enum: ORGANIZATION_STATUSES, default: "ACTIVE" })
  status!: (typeof ORGANIZATION_STATUSES)[number];
}
export type OrganizationDocument = HydratedDocument<Organization>;
export const OrganizationSchema = SchemaFactory.createForClass(Organization);
