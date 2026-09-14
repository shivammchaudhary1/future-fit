import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";
import { GRADES } from "./school.constants.js";

@Schema({ timestamps: true, collection: "school_classes" })
export class SchoolClass {
  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  organizationId!: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  academicYearId!: Types.ObjectId;
  @Prop({ type: String, enum: GRADES, required: true })
  grade!: (typeof GRADES)[number];
  @Prop({ required: true, trim: true, uppercase: true }) section!: string;
  @Prop({ type: [SchemaTypes.ObjectId], default: [] }) teacherIds!: Types.ObjectId[];
}
export type SchoolClassDocument = HydratedDocument<SchoolClass>;
export const SchoolClassSchema = SchemaFactory.createForClass(SchoolClass);
SchoolClassSchema.index(
  { organizationId: 1, academicYearId: 1, grade: 1, section: 1 },
  { unique: true },
);
SchoolClassSchema.index({ organizationId: 1, teacherIds: 1 });
