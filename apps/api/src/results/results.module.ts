import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module.js";
import { OrganizationsModule } from "../organizations/organizations.module.js";
import {
  AssessmentResult,
  AssessmentResultSchema,
} from "../assessments/result.schema.js";
import {
  AssessmentAttempt,
  AssessmentAttemptSchema,
} from "../assessments/attempt.schema.js";
import { SchoolClass, SchoolClassSchema } from "../schools/class.schema.js";
import {
  ClassEnrollment,
  ClassEnrollmentSchema,
} from "../schools/class-enrollment.schema.js";
import { ResultShare, ResultShareSchema } from "./result-share.schema.js";
import { ResultsController } from "./results.controller.js";
import { ResultsService } from "./results.service.js";
import {
  GuardianLink,
  GuardianLinkSchema,
} from "../guardians/guardian.schema.js";
@Module({
  imports: [
    AuthModule,
    OrganizationsModule,
    MongooseModule.forFeature([
      { name: GuardianLink.name, schema: GuardianLinkSchema },
      { name: AssessmentResult.name, schema: AssessmentResultSchema },
      { name: AssessmentAttempt.name, schema: AssessmentAttemptSchema },
      { name: ResultShare.name, schema: ResultShareSchema },
      { name: SchoolClass.name, schema: SchoolClassSchema },
      { name: ClassEnrollment.name, schema: ClassEnrollmentSchema },
    ]),
  ],
  controllers: [ResultsController],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}
