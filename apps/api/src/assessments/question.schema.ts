import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes } from "mongoose";
import type { QuestionContent } from "@future-fit/validation";
@Schema({ timestamps: true, collection: "questions", minimize: false })
export class Question {
  @Prop({ type: SchemaTypes.Mixed, required: true }) content!: QuestionContent;
}
export type QuestionDocument = HydratedDocument<Question>;
export const QuestionSchema = SchemaFactory.createForClass(Question);
