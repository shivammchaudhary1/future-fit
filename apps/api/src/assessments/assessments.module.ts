import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module.js";
import { OrganizationsModule } from "../organizations/organizations.module.js";
import { SchoolsModule } from "../schools/schools.module.js";
import { Assessment, AssessmentSchema } from "./assessment.schema.js";
import {
  AssessmentVersion,
  AssessmentVersionSchema,
} from "./assessment-version.schema.js";
import {
  AssessmentAttempt,
  AssessmentAttemptSchema,
} from "./attempt.schema.js";
import {
  AssessmentsController,
  AttemptsController,
} from "./assessments.controller.js";
import { AssessmentsService } from "./assessments.service.js";
import { AssessmentResult, AssessmentResultSchema } from "./result.schema.js";
import { Question, QuestionSchema } from "./question.schema.js";
import { AuthoringService } from "./authoring.service.js";
import { AuthoringController } from "./authoring.controller.js";
import { Entitlement, EntitlementSchema } from "../payments/payment.schema.js";

@Module({
  imports: [
    AuthModule,
    OrganizationsModule,
    SchoolsModule,
    MongooseModule.forFeature([
      { name: Entitlement.name, schema: EntitlementSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: Assessment.name, schema: AssessmentSchema },
      { name: AssessmentVersion.name, schema: AssessmentVersionSchema },
      { name: AssessmentAttempt.name, schema: AssessmentAttemptSchema },
      { name: AssessmentResult.name, schema: AssessmentResultSchema },
    ]),
  ],
  controllers: [AssessmentsController, AttemptsController, AuthoringController],
  providers: [AssessmentsService, AuthoringService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
