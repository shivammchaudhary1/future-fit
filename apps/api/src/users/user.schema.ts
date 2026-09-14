import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

@Schema({ timestamps: true, collection: "users" })
export class User {
  @Prop({ required: true, trim: true }) firstName!: string;
  @Prop({ required: true, trim: true }) lastName!: string;
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;
  @Prop({ select: false }) passwordHash?: string;
  @Prop({ type: [{ provider: String, providerId: String }], default: [] })
  authProviders!: Array<{ provider: "LOCAL" | "GOOGLE"; providerId?: string }>;
  @Prop({ type: String, enum: ["en", "hi"], default: "en" })
  preferredLanguage!: "en" | "hi";
  @Prop({ type: [String], default: [] }) globalRoles!: Array<"SUPER_ADMIN">;
  @Prop({
    type: String,
    enum: ["ACTIVE", "PENDING_VERIFICATION", "SUSPENDED"],
    default: "PENDING_VERIFICATION",
  })
  status!: "ACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED";
  @Prop({ default: false }) emailVerified!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ status: 1, createdAt: -1 });
