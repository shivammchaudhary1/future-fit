import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes } from "mongoose";
import type { CareerContent } from "@future-fit/validation";
@Schema({ timestamps: true, collection: "career_profiles" })
export class Career {
  @Prop({ required: true, unique: true }) slug!: string;
  @Prop({ required: true, index: true }) status!: string;
  @Prop({ type: SchemaTypes.Mixed, required: true }) content!: CareerContent;
}
export type CareerDocument = HydratedDocument<Career>;
export const CareerSchema = SchemaFactory.createForClass(Career);
