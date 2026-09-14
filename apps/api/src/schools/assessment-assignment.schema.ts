import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";
import {
  ASSIGNMENT_STATUSES,
  ASSIGNMENT_TARGET_TYPES,
} from "./school.constants.js";

@Schema({ timestamps: true, collection: "assessment_assignments" })
export class AssessmentAssignment {
  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  organizationId!: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, required: true }) assessmentId!: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  assessmentVersionId!: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, required: true }) assignedBy!: Types.ObjectId;
  @Prop({ type: String, enum: ASSIGNMENT_TARGET_TYPES, required: true })
  targetType!: (typeof ASSIGNMENT_TARGET_TYPES)[number];
  @Prop({ type: [SchemaTypes.ObjectId], required: true })
  targetIds!: Types.ObjectId[];
  @Prop() dueDate?: Date;
  @Prop({ type: String, enum: ASSIGNMENT_STATUSES, default: "ACTIVE" })
  status!: (typeof ASSIGNMENT_STATUSES)[number];
}
export type AssessmentAssignmentDocument =
  HydratedDocument<AssessmentAssignment>;
export const AssessmentAssignmentSchema =
  SchemaFactory.createForClass(AssessmentAssignment);
AssessmentAssignmentSchema.index({ organizationId: 1, status: 1, dueDate: 1 });
AssessmentAssignmentSchema.index({ targetIds: 1, status: 1 });
