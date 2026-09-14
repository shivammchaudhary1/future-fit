import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

@Schema({ timestamps: true, collection: "auth_sessions" })
export class AuthSession {
  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;
  @Prop({ required: true, select: false }) refreshTokenHash!: string;
  @Prop() userAgent?: string;
  @Prop() ipAddress?: string;
  @Prop({ required: true }) expiresAt!: Date;
  @Prop() revokedAt?: Date;
  @Prop({ required: true }) lastUsedAt!: Date;
  createdAt!: Date;
  updatedAt!: Date;
}

export type AuthSessionDocument = HydratedDocument<AuthSession>;
export const AuthSessionSchema = SchemaFactory.createForClass(AuthSession);
AuthSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
AuthSessionSchema.index({ userId: 1, revokedAt: 1 });
