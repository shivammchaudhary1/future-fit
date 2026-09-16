import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AuthModule } from "../auth/auth.module.js";
import {
  Assessment,
  AssessmentSchema,
} from "../assessments/assessment.schema.js";
import {
  AssessmentAttempt,
  AssessmentAttemptSchema,
} from "../assessments/attempt.schema.js";
import {
  AssessmentResult,
  AssessmentResultSchema,
} from "../assessments/result.schema.js";
import {
  AssessmentVersion,
  AssessmentVersionSchema,
} from "../assessments/assessment-version.schema.js";
import {
  StudentProfile,
  StudentProfileSchema,
} from "./student-profile.schema.js";
import { StudentsController } from "./students.controller.js";
import { StudentsService } from "./students.service.js";

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: StudentProfile.name, schema: StudentProfileSchema },
      { name: Assessment.name, schema: AssessmentSchema },
      { name: AssessmentAttempt.name, schema: AssessmentAttemptSchema },
      { name: AssessmentResult.name, schema: AssessmentResultSchema },
      { name: AssessmentVersion.name, schema: AssessmentVersionSchema },
    ]),
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
