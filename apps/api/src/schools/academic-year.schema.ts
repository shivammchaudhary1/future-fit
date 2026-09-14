import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";
import { ACADEMIC_YEAR_STATUSES } from "./school.constants.js";

@Schema({ timestamps: true, collection: "academic_years" })
export class AcademicYear {
  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  organizationId!: Types.ObjectId;
  @Prop({ required: true, trim: true }) name!: string;
  @Prop({ required: true }) startDate!: Date;
  @Prop({ required: true }) endDate!: Date;
  @Prop({ type: String, enum: ACADEMIC_YEAR_STATUSES, default: "ACTIVE" })
  status!: (typeof ACADEMIC_YEAR_STATUSES)[number];
}
export type AcademicYearDocument = HydratedDocument<AcademicYear>;
export const AcademicYearSchema = SchemaFactory.createForClass(AcademicYear);
AcademicYearSchema.index({ organizationId: 1, name: 1 }, { unique: true });
