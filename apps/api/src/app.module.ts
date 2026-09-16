import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";

import { AnalyticsModule } from "./analytics/analytics.module.js";
import { AssessmentsModule } from "./assessments/assessments.module.js";
import { AuditModule } from "./audit/audit.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { CareersModule } from "./careers/careers.module.js";
import { RateLimitGuard } from "./common/rate-limit.guard.js";
import { validateEnvironment } from "./common/environment.js";
import { GuardiansModule } from "./guardians/guardians.module.js";
import { HealthModule } from "./health/health.module.js";
import { NotificationsModule } from "./notifications/notifications.module.js";
import { OnetModule } from "./onet/onet.module.js";
import { OrganizationsModule } from "./organizations/organizations.module.js";
import { PaymentsModule } from "./payments/payments.module.js";
import { QueueModule } from "./queue/queue.module.js";
import { NotesModule } from "./results/notes.module.js";
import { ResultsModule } from "./results/results.module.js";
import { SchoolsModule } from "./schools/schools.module.js";
import { StudentsModule } from "./students/students.module.js";
import { UsersModule } from "./users/users.module.js";

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
    StudentsModule,
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
