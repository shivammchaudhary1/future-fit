import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";
import { PAYMENT_CONFIG } from "./payment.constants.js";
@Schema({ timestamps: true, collection: "products" })
export class Product {
  @Prop({ required: true }) name!: string;
  @Prop({ type: [SchemaTypes.ObjectId], required: true })
  assessmentIds!: Types.ObjectId[];
  @Prop({ required: true, min: 1 }) amount!: number;
  @Prop({ default: PAYMENT_CONFIG.currency }) currency!: string;
  @Prop({ required: true, min: 1 }) durationDays!: number;
  @Prop({ default: true }) active!: boolean;
}
export type ProductDocument = HydratedDocument<Product>;
export const ProductSchema = SchemaFactory.createForClass(Product);
@Schema({ timestamps: true, collection: "payments" })
export class Payment {
  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, required: true }) productId!: Types.ObjectId;
  @Prop({ required: true }) requestKey!: string;
  @Prop({ unique: true, sparse: true }) providerOrderId?: string;
  @Prop() providerPaymentId?: string;
  @Prop({ required: true }) amount!: number;
  @Prop({ required: true }) currency!: string;
  @Prop({ required: true }) durationDays!: number;
  @Prop({ type: [SchemaTypes.ObjectId], required: true })
  assessmentIds!: Types.ObjectId[];
  @Prop({
    default: "CREATING",
    enum: ["CREATING", "CREATED", "PAID", "RECONCILIATION_REQUIRED"],
  })
  status!: string;
  @Prop() paidAt?: Date;
}
export type PaymentDocument = HydratedDocument<Payment>;
export const PaymentSchema = SchemaFactory.createForClass(Payment);
PaymentSchema.index({ userId: 1, requestKey: 1 }, { unique: true });
@Schema({ timestamps: true, collection: "entitlements" })
export class Entitlement {
  @Prop({ type: SchemaTypes.ObjectId, required: true }) userId!: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, required: true }) assessmentId!: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, required: true }) paymentId!: Types.ObjectId;
  @Prop({ required: true }) expiresAt!: Date;
  @Prop({ default: true }) active!: boolean;
}
export type EntitlementDocument = HydratedDocument<Entitlement>;
export const EntitlementSchema = SchemaFactory.createForClass(Entitlement);
EntitlementSchema.index(
  { userId: 1, assessmentId: 1, paymentId: 1 },
  { unique: true },
);
EntitlementSchema.index({
  userId: 1,
  assessmentId: 1,
  active: 1,
  expiresAt: 1,
});
