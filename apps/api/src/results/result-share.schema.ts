import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";
@Schema({ timestamps: true, collection: "result_shares" })
export class ResultShare {
  @Prop({ type: SchemaTypes.ObjectId, required: true }) resultId!: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, required: true }) ownerUserId!: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  sharedWithUserId!: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId })
  organizationId?: Types.ObjectId;
  @Prop() revokedAt?: Date;
}
export type ResultShareDocument = HydratedDocument<ResultShare>;
export const ResultShareSchema = SchemaFactory.createForClass(ResultShare);
ResultShareSchema.index({ resultId: 1, sharedWithUserId: 1 }, { unique: true });
ResultShareSchema.index({ sharedWithUserId: 1, revokedAt: 1 });
