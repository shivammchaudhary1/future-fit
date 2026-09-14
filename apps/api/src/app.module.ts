import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "./auth/auth.module.js";
import { AssessmentsModule } from "./assessments/assessments.module.js";
import { HealthModule } from "./health/health.module.js";
import { OnetModule } from "./onet/onet.module.js";
import { OrganizationsModule } from "./organizations/organizations.module.js";
import { QueueModule } from "./queue/queue.module.js";
import { SchoolsModule } from "./schools/schools.module.js";
import { UsersModule } from "./users/users.module.js";
import { ResultsModule } from "./results/results.module.js";
import { CareersModule } from "./careers/careers.module.js";
import { NotificationsModule } from "./notifications/notifications.module.js";
import { AnalyticsModule } from "./analytics/analytics.module.js";
import { PaymentsModule } from "./payments/payments.module.js";
import { GuardiansModule } from "./guardians/guardians.module.js";
import { AuditModule } from "./audit/audit.module.js";
import { NotesModule } from "./results/notes.module.js";
import { APP_GUARD } from "@nestjs/core";
import { RateLimitGuard } from "./common/rate-limit.guard.js";
import { validateEnvironment } from "./common/environment.js";

@Module({
  providers: [{ provide: APP_GUARD, useClass: RateLimitGuard }],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"],
      validate: validateEnvironment,
    }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI ?? "mongodb://localhost:27017/future-fit",
      }),
    }),
    AuthModule,
    QueueModule,
    AssessmentsModule,
    UsersModule,
    ResultsModule,
    CareersModule,
    NotificationsModule,
    AnalyticsModule,
    PaymentsModule,
    GuardiansModule,
    AuditModule,
    NotesModule,
    OnetModule,
    OrganizationsModule,
    SchoolsModule,
    HealthModule,
  ],
})
export class AppModule {}
