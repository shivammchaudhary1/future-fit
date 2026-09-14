import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Module,
  Post,
  Req,
  UseGuards,
  type RawBodyRequest,
} from "@nestjs/common";
import type { Request } from "express";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module.js";
import { AccessTokenGuard } from "../auth/access-token.guard.js";
import { SuperAdminGuard } from "../auth/super-admin.guard.js";
import { CsrfGuard } from "../auth/csrf.guard.js";
import { CurrentAuth } from "../auth/current-auth.decorator.js";
import type { JwtPayload } from "../auth/auth.types.js";
import {
  Assessment,
  AssessmentSchema,
} from "../assessments/assessment.schema.js";
import {
  Product,
  ProductSchema,
  Payment,
  PaymentSchema,
  Entitlement,
  EntitlementSchema,
} from "./payment.schema.js";
import { PaymentsService } from "./payments.service.js";
import { CreateOrderDto, ProductDto } from "./payment.dto.js";
@Controller({ path: "payments", version: "1" })
class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}
  @Get("products") @UseGuards(AccessTokenGuard) async products() {
    return { success: true, data: await this.payments.productsList() };
  }
  @Get() @UseGuards(AccessTokenGuard) async mine(
    @CurrentAuth() auth: JwtPayload,
  ) {
    return { success: true, data: await this.payments.mine(auth.sub) };
  }
  @Post("orders") @UseGuards(AccessTokenGuard, CsrfGuard) async order(
    @CurrentAuth() auth: JwtPayload,
    @Body() body: CreateOrderDto,
  ) {
    return { success: true, data: await this.payments.order(auth.sub, body) };
  }
  @Post("products")
  @UseGuards(AccessTokenGuard, SuperAdminGuard, CsrfGuard)
  async product(@Body() body: ProductDto) {
    return { success: true, data: await this.payments.product(body) };
  }
  @Post("webhook") @HttpCode(200) async webhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers("x-razorpay-signature") signature: string | undefined,
  ) {
    await this.payments.webhook(request.rawBody ?? Buffer.alloc(0), signature);
    return { success: true };
  }
}
@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Entitlement.name, schema: EntitlementSchema },
      { name: Assessment.name, schema: AssessmentSchema },
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
