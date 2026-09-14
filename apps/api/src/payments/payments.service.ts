import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model, Types } from "mongoose";
import {
  Product,
  Payment,
  Entitlement,
  type ProductDocument,
  type PaymentDocument,
  type EntitlementDocument,
} from "./payment.schema.js";
import {
  Assessment,
  type AssessmentDocument,
} from "../assessments/assessment.schema.js";
import { PAYMENT_CONFIG } from "./payment.constants.js";
import type { CreateOrderDto, ProductDto } from "./payment.dto.js";
import { capturedPayment, validWebhook } from "./webhook.js";
@Injectable()
export class PaymentsService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Product.name)
    private readonly products: Model<ProductDocument>,
    @InjectModel(Payment.name)
    private readonly payments: Model<PaymentDocument>,
    @InjectModel(Entitlement.name)
    private readonly entitlements: Model<EntitlementDocument>,
    @InjectModel(Assessment.name)
    private readonly assessments: Model<AssessmentDocument>,
    private readonly config: ConfigService,
  ) {}
  productsList() {
    return this.products.find({ active: true }).limit(100).lean();
  }
  mine(userId: string) {
    return this.payments
      .find({ userId })
      .select("-requestKey")
      .sort({ _id: -1 })
      .limit(100)
      .lean();
  }
  async product(input: ProductDto) {
    if (
      (await this.assessments.countDocuments({
        _id: { $in: input.assessmentIds },
      })) !== input.assessmentIds.length
    )
      throw new BadRequestException("Unknown assessment in product.");
    return this.products.create(input);
  }
  async order(userId: string, input: CreateOrderDto) {
    const keyId = this.config.getOrThrow<string>("RAZORPAY_KEY_ID");
    const keySecret = this.config.getOrThrow<string>("RAZORPAY_KEY_SECRET");
    const existing = await this.payments.findOne({
      userId,
      requestKey: input.requestKey,
    });
    if (existing) {
      if (!existing.productId.equals(input.productId))
        throw new ConflictException(
          "Idempotency key was used for a different product.",
        );
      if (!existing.providerOrderId)
        throw new ConflictException(
          "Order creation is pending reconciliation. Do not retry with a new key.",
        );
      return {
        paymentId: existing._id,
        orderId: existing.providerOrderId,
        amount: existing.amount,
        currency: existing.currency,
        keyId,
        status: existing.status,
      };
    }
    const product = await this.products.findOne({
      _id: input.productId,
      active: true,
    });
    if (!product) throw new NotFoundException("Active product not found.");
    const payment = await this.payments.create({
      userId: new Types.ObjectId(userId),
      productId: product._id,
      requestKey: input.requestKey,
      amount: product.amount,
      currency: product.currency,
      durationDays: product.durationDays,
      assessmentIds: product.assessmentIds,
    });
    try {
      const response = await fetch(`${PAYMENT_CONFIG.baseUrl}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
        },
        body: JSON.stringify({
          amount: product.amount,
          currency: product.currency,
          receipt: payment._id.toHexString(),
        }),
        signal: AbortSignal.timeout(PAYMENT_CONFIG.timeoutMs),
      });
      if (!response.ok) throw new Error("Payment provider rejected order");
      const value: unknown = await response.json();
      if (
        !value ||
        typeof value !== "object" ||
        !("id" in value) ||
        typeof value.id !== "string"
      )
        throw new Error("Invalid payment provider order");
      payment.providerOrderId = value.id;
      payment.status = "CREATED";
      await payment.save();
      return {
        paymentId: payment._id,
        orderId: payment.providerOrderId,
        amount: payment.amount,
        currency: payment.currency,
        keyId,
        status: payment.status,
      };
    } catch {
      await this.payments.updateOne(
        { _id: payment._id },
        { $set: { status: "RECONCILIATION_REQUIRED" } },
      );
      throw new BadGatewayException(
        "Payment order requires reconciliation before retrying.",
      );
    }
  }
  async webhook(body: Buffer, signature: string | undefined) {
    if (
      !validWebhook(
        body,
        signature,
        this.config.getOrThrow<string>("RAZORPAY_WEBHOOK_SECRET"),
      )
    )
      throw new UnauthorizedException("Invalid webhook signature.");
    let capture: ReturnType<typeof capturedPayment>;
    try {
      capture = capturedPayment(JSON.parse(body.toString("utf8")) as unknown);
    } catch {
      throw new BadRequestException("Invalid payment webhook.");
    }
    if (!capture) return;
    const payment = await this.payments.findOne({
      providerOrderId: capture.orderId,
    });
    if (!payment) throw new NotFoundException("Payment order not found.");
    if (
      payment.amount !== capture.amount ||
      payment.currency !== capture.currency
    )
      throw new BadRequestException("Payment amount or currency mismatch.");
    const captureId = capture.id;
    await this.connection.transaction(async (session) => {
      const updated = await this.payments.findOneAndUpdate(
        { _id: payment._id, status: { $ne: "PAID" } },
        {
          $set: {
            status: "PAID",
            providerPaymentId: captureId,
            paidAt: new Date(),
          },
        },
        { new: true, session },
      );
      if (!updated) return;
      const expiresAt = new Date(
        Date.now() + payment.durationDays * PAYMENT_CONFIG.dayMs,
      );
      for (const assessmentId of payment.assessmentIds)
        await this.entitlements.updateOne(
          { userId: payment.userId, assessmentId, paymentId: payment._id },
          { $setOnInsert: { expiresAt, active: true } },
          { upsert: true, session },
        );
    });
  }
}
