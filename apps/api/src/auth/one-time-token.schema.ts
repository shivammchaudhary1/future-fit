import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

@Schema({ timestamps: true, collection: "auth_one_time_tokens" })
export class OneTimeToken {
  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;
  @Prop({ required: true, unique: true }) tokenHash!: string;
  @Prop({
    type: String,
    enum: ["EMAIL_VERIFICATION", "PASSWORD_RESET"],
    required: true,
  })
  purpose!: "EMAIL_VERIFICATION" | "PASSWORD_RESET";
  @Prop({ required: true }) expiresAt!: Date;
  @Prop() consumedAt?: Date;
}

export type OneTimeTokenDocument = HydratedDocument<OneTimeToken>;
export const OneTimeTokenSchema = SchemaFactory.createForClass(OneTimeToken);
OneTimeTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
