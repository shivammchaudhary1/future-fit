import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";
@Schema({ timestamps: true, collection: "guardian_links" })
export class GuardianLink {
  @Prop({ type: SchemaTypes.ObjectId, required: true }) studentId!: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, required: true }) guardianId!: Types.ObjectId;
  @Prop({ required: true }) consentVersion!: string;
  @Prop({ default: "REQUESTED", enum: ["REQUESTED", "APPROVED", "REVOKED"] })
  status!: string;
  @Prop() consentedAt?: Date;
  @Prop() revokedAt?: Date;
}
export type GuardianLinkDocument = HydratedDocument<GuardianLink>;
export const GuardianLinkSchema = SchemaFactory.createForClass(GuardianLink);
GuardianLinkSchema.index({ studentId: 1, guardianId: 1 }, { unique: true });
