import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

@Schema({ timestamps: true, collection: "class_enrollments" })
export class ClassEnrollment {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  organizationId!: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, required: true }) classId!: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, required: true }) studentId!: Types.ObjectId;
  @Prop({ default: true }) active!: boolean;
}
export type ClassEnrollmentDocument = HydratedDocument<ClassEnrollment>;
export const ClassEnrollmentSchema =
  SchemaFactory.createForClass(ClassEnrollment);
ClassEnrollmentSchema.index({ classId: 1, studentId: 1 }, { unique: true });
ClassEnrollmentSchema.index({ organizationId: 1, studentId: 1, active: 1 });
