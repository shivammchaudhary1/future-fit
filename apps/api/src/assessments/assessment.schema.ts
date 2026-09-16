import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

@Schema({ timestamps: true, collection: "assessments" })
export class Assessment {
  @Prop({ trim: true }) stableKey?: string;
  @Prop({ default: false }) isPaid!: boolean;
  @Prop({ required: true }) name!: string;
  @Prop({
    required: true,
    type: String,
    enum: [
      "INTEREST",
      "PERSONALITY",
      "APTITUDE",
      "VALUES",
      "EDUCATIONAL_SURVEY",
      "ACADEMIC_PREFERENCE",
    ],
  })
  type!: string;
  @Prop({ required: true }) description!: string;
  @Prop({ type: SchemaTypes.ObjectId }) activeVersionId?: Types.ObjectId;
  @Prop({
    required: true,
    type: String,
    enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
    default: "DRAFT",
  })
  status!: string;
  @Prop({ type: SchemaTypes.ObjectId, required: true }) createdBy!: Types.ObjectId;
}
export type AssessmentDocument = HydratedDocument<Assessment>;
export const AssessmentSchema = SchemaFactory.createForClass(Assessment);
AssessmentSchema.index({ status: 1, type: 1 });
AssessmentSchema.index({ stableKey: 1 }, { sparse: true });
