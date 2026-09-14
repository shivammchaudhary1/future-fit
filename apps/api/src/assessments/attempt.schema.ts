import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";
import { ATTEMPT_STATUSES } from "./assessment.constants.js";

@Schema({ timestamps: true, collection: "assessment_attempts" })
export class AssessmentAttempt {
  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, required: true }) assessmentId!: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  assessmentVersionId!: Types.ObjectId;
  @Prop({ type: String, enum: ["PERSONAL", "SCHOOL"], required: true })
  context!: "PERSONAL" | "SCHOOL";
  @Prop({ type: SchemaTypes.ObjectId }) organizationId?: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId }) assignmentId?: Types.ObjectId;
  @Prop({ type: String, enum: ["en", "hi"], default: "en" }) language!:
    "en" | "hi";
  @Prop({ type: String, enum: ATTEMPT_STATUSES, default: "IN_PROGRESS" })
  status!: string;
  @Prop({
    type: [{ questionId: String, answer: SchemaTypes.Mixed, answeredAt: Date }],
    default: [],
  })
  responses!: Array<{ questionId: string; answer: unknown; answeredAt: Date }>;
  @Prop({ min: 0, max: 100, default: 0 }) progress!: number;
  @Prop({ default: 0 }) revision!: number;
  @Prop() startedAt?: Date;
  @Prop() lastSavedAt?: Date;
  @Prop() submittedAt?: Date;
  @Prop() completedAt?: Date;
}
export type AssessmentAttemptDocument = HydratedDocument<AssessmentAttempt>;
export const AssessmentAttemptSchema =
  SchemaFactory.createForClass(AssessmentAttempt);
AssessmentAttemptSchema.index({ userId: 1, status: 1 });
AssessmentAttemptSchema.index({ organizationId: 1, status: 1 });
AssessmentAttemptSchema.index({ assessmentId: 1, assessmentVersionId: 1 });
AssessmentAttemptSchema.index(
  {
    userId: 1,
    assessmentId: 1,
    assessmentVersionId: 1,
    context: 1,
    organizationId: 1,
    assignmentId: 1,
  },
  { unique: true, partialFilterExpression: { status: "IN_PROGRESS" } },
);
