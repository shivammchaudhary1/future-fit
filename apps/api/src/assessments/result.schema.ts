import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

@Schema({ timestamps: true, collection: "assessment_results" })
export class AssessmentResult {
  @Prop({ type: SchemaTypes.ObjectId, required: true, unique: true })
  attemptId!: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, index: true })
  organizationId?: Types.ObjectId;

  @Prop() reportKey?: string;

  @Prop() generatedAt?: Date;

  @Prop({ type: SchemaTypes.Mixed })
  aiInterpretation?: Record<string, unknown>;

  @Prop({ type: SchemaTypes.Mixed })
  aiProvenance?: Record<string, unknown>;

  @Prop({ required: true })
  scoringVersion!: string;

  @Prop({ type: SchemaTypes.Mixed, required: true })
  dimensions!: Record<string, number>;

  @Prop({ type: SchemaTypes.Mixed })
  normalizedDimensions?: Record<string, number>;

  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  careerMatches!: Array<Record<string, unknown>>;

  @Prop({
    type: String,
    enum: ["PENDING", "READY", "FAILED"],
    default: "PENDING",
  })
  resultStatus!: "PENDING" | "READY" | "FAILED";

  @Prop({
    type: String,
    enum: ["NOT_CONFIGURED", "PENDING", "READY", "FAILED"],
    default: "NOT_CONFIGURED",
  })
  aiStatus!: "NOT_CONFIGURED" | "PENDING" | "READY" | "FAILED";

  @Prop({
    type: String,
    enum: ["NOT_CONFIGURED", "PENDING", "READY", "FAILED"],
    default: "NOT_CONFIGURED",
  })
  reportStatus!: "NOT_CONFIGURED" | "PENDING" | "READY" | "FAILED";

  @Prop({ type: SchemaTypes.Mixed })
  providerResult?: unknown;
}

export type AssessmentResultDocument = HydratedDocument<AssessmentResult>;

export const AssessmentResultSchema =
  SchemaFactory.createForClass(AssessmentResult);
