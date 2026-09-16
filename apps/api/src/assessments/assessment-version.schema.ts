import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";
import type { QuestionSnapshot } from "@future-fit/validation";

@Schema({ timestamps: true, collection: "assessment_versions", minimize: false })
export class AssessmentVersion {
  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  assessmentId!: Types.ObjectId;
  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  questionSnapshots!: QuestionSnapshot[];
  @Prop({ required: true }) version!: string;
  @Prop({ type: [SchemaTypes.Mixed], required: true }) sections!: Array<
    Record<string, unknown>
  >;
  @Prop({ type: SchemaTypes.Mixed, required: true })
  scoringConfiguration!: Record<string, unknown>;
  @Prop({ type: SchemaTypes.Mixed })
  provenance?: Record<string, unknown>;
  @Prop({
    type: String,
    enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
    default: "DRAFT",
  })
  status!: string;
  @Prop() publishedAt?: Date;
}
export type AssessmentVersionDocument = HydratedDocument<AssessmentVersion>;
export const AssessmentVersionSchema =
  SchemaFactory.createForClass(AssessmentVersion);
AssessmentVersionSchema.index(
  { assessmentId: 1, version: 1 },
  { unique: true },
);
