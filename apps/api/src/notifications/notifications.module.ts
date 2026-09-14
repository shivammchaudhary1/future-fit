import {
  Controller,
  Get,
  Module,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import { AuthModule } from "../auth/auth.module.js";
import { AccessTokenGuard } from "../auth/access-token.guard.js";
import { CsrfGuard } from "../auth/csrf.guard.js";
import { CurrentAuth } from "../auth/current-auth.decorator.js";
import type { JwtPayload } from "../auth/auth.types.js";
@Controller({ path: "notifications", version: "1" })
@UseGuards(AccessTokenGuard)
class NotificationsController {
  constructor(@InjectConnection() private readonly database: Connection) {}
  @Get() async list(@CurrentAuth() auth: JwtPayload) {
    return {
      success: true,
      data: await this.database
        .collection("notifications")
        .find({ userId: new Types.ObjectId(auth.sub) })
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray(),
    };
  }
  @Post(":id/read") @UseGuards(CsrfGuard) async read(
    @CurrentAuth() auth: JwtPayload,
    @Param("id") id: string,
  ) {
    await this.database
      .collection("notifications")
      .updateOne(
        { _id: new Types.ObjectId(id), userId: new Types.ObjectId(auth.sub) },
        { $set: { read: true } },
      );
    return { success: true, data: { read: true } };
  }
}
@Module({ imports: [AuthModule], controllers: [NotificationsController] })
export class NotificationsModule {}
