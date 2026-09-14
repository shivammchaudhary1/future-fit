import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  Assessment,
  AssessmentSchema,
} from "../assessments/assessment.schema.js";
import { AuthModule } from "../auth/auth.module.js";
import {
  OrganizationMembership,
  OrganizationMembershipSchema,
} from "../organizations/membership.schema.js";
import { OrganizationsModule } from "../organizations/organizations.module.js";
import { AcademicYear, AcademicYearSchema } from "./academic-year.schema.js";
import {
  AssessmentAssignment,
  AssessmentAssignmentSchema,
} from "./assessment-assignment.schema.js";
import {
  ClassEnrollment,
  ClassEnrollmentSchema,
} from "./class-enrollment.schema.js";
import { SchoolClass, SchoolClassSchema } from "./class.schema.js";
import { ClassesController, SchoolsController } from "./schools.controller.js";
import { SchoolsService } from "./schools.service.js";
import { StaffController } from "./staff.controller.js";
import {
  AssessmentAttempt,
  AssessmentAttemptSchema,
} from "../assessments/attempt.schema.js";
import {
  AssessmentResult,
  AssessmentResultSchema,
} from "../assessments/result.schema.js";

@Module({
  imports: [
    AuthModule,
    OrganizationsModule,
    MongooseModule.forFeature([
      { name: AssessmentAttempt.name, schema: AssessmentAttemptSchema },
      { name: AssessmentResult.name, schema: AssessmentResultSchema },
      { name: AcademicYear.name, schema: AcademicYearSchema },
      { name: SchoolClass.name, schema: SchoolClassSchema },
      { name: ClassEnrollment.name, schema: ClassEnrollmentSchema },
      { name: AssessmentAssignment.name, schema: AssessmentAssignmentSchema },
      {
        name: OrganizationMembership.name,
        schema: OrganizationMembershipSchema,
      },
      { name: Assessment.name, schema: AssessmentSchema },
    ]),
  ],
  controllers: [SchoolsController, ClassesController, StaffController],
  providers: [SchoolsService],
  exports: [SchoolsService],
})
export class SchoolsModule {}
