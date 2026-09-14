import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes } from "mongoose";
import type { QuestionContent } from "@future-fit/validation";
import { QUESTION_STATUSES } from "./authoring.constants.js";
@Schema({ timestamps: true, collection: "questions", minimize: false })
export class Question {
  @Prop({
    type: String,
    enum: QUESTION_STATUSES,
    default: "ACTIVE",
    index: true,
  })
  status!: (typeof QUESTION_STATUSES)[number];
  @Prop({ default: 0, min: 0 }) revision!: number;
  @Prop({ type: SchemaTypes.Mixed, required: true }) content!: QuestionContent;
}
export type QuestionDocument = HydratedDocument<Question>;
export const QuestionSchema = SchemaFactory.createForClass(Question);
