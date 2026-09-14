import {
  Controller,
  Get,
  Injectable,
  Module,
  UseGuards,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { mergeMap } from "rxjs";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import { AuthModule } from "../auth/auth.module.js";
import { AccessTokenGuard } from "../auth/access-token.guard.js";
import { SuperAdminGuard } from "../auth/super-admin.guard.js";
@Injectable()
class AuditInterceptor implements NestInterceptor {
  constructor(@InjectConnection() private readonly database: Connection) {}
  intercept(context: ExecutionContext, next: CallHandler<unknown>) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return next.handle().pipe(
      mergeMap(async (data: unknown) => {
        const requestId = request.headers["x-request-id"];
        if (
          request.auth &&
          !["GET", "HEAD", "OPTIONS"].includes(request.method)
        ) {
          // Never record request bodies, credentials, cookies, or answer content.
          await this.database.collection("audit_logs").insertOne({
            actorUserId: request.auth.sub,
            requestId,
            method: request.method,
            route: request.path,
            createdAt: new Date(),
            outcome: "SUCCEEDED",
          });
        }
        if (data && typeof data === "object" && "success" in data)
          return { ...data, meta: { requestId } };
        return data;
      }),
    );
  }
}
@Controller({ path: "admin/audit-logs", version: "1" })
@UseGuards(AccessTokenGuard, SuperAdminGuard)
class AuditController {
  constructor(@InjectConnection() private readonly database: Connection) {}
  @Get() async list() {
    return {
      success: true,
      data: await this.database
        .collection("audit_logs")
        .find()
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray(),
    };
  }
}
@Module({
  imports: [AuthModule],
  controllers: [AuditController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: AuditInterceptor }],
})
export class AuditModule {}
