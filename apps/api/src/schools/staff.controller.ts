import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { IsMongoId } from "class-validator";
import { AccessTokenGuard } from "../auth/access-token.guard.js";
import { CurrentAuth } from "../auth/current-auth.decorator.js";
import type { JwtPayload } from "../auth/auth.types.js";
import { OrganizationsService } from "../organizations/organizations.service.js";
import {
  OrganizationMembership,
  type OrganizationMembershipDocument,
} from "../organizations/membership.schema.js";
import { User, type UserDocument } from "../users/user.schema.js";
import {
  AssessmentAttempt,
  type AssessmentAttemptDocument,
} from "../assessments/attempt.schema.js";
import {
  AssessmentResult,
  type AssessmentResultDocument,
} from "../assessments/result.schema.js";
import { SchoolClass, type SchoolClassDocument } from "./class.schema.js";
import {
  ClassEnrollment,
  type ClassEnrollmentDocument,
} from "./class-enrollment.schema.js";
class StaffQuery {
  @IsMongoId() organizationId!: string;
}
@Controller({ path: "staff", version: "1" })
@UseGuards(AccessTokenGuard)
export class StaffController {
  constructor(
    private readonly organizations: OrganizationsService,
    @InjectModel(SchoolClass.name)
    private readonly classes: Model<SchoolClassDocument>,
    @InjectModel(ClassEnrollment.name)
    private readonly enrollments: Model<ClassEnrollmentDocument>,
    @InjectModel(OrganizationMembership.name)
    private readonly memberships: Model<OrganizationMembershipDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(AssessmentAttempt.name)
    private readonly attempts: Model<AssessmentAttemptDocument>,
    @InjectModel(AssessmentResult.name)
    private readonly results: Model<AssessmentResultDocument>,
  ) {}
  private async studentsInScope(userId: string, organizationId: string) {
    const member = await this.organizations.requireRole(
      userId,
      organizationId,
      ["SCHOOL_ADMIN", "TEACHER"],
    );
    if (member.role === "SCHOOL_ADMIN")
      return this.memberships.distinct("userId", {
        organizationId,
        role: "STUDENT",
        status: "ACTIVE",
      });
    const classes = await this.classes.distinct("_id", {
      organizationId,
      teacherIds: userId,
    });
    const students = await this.enrollments.distinct("studentId", {
      organizationId,
      classId: { $in: classes },
      active: true,
    });
    return this.memberships.distinct("userId", {
      organizationId,
      userId: { $in: students },
      role: "STUDENT",
      status: "ACTIVE",
    });
  }
  @Get("students") async students(
    @CurrentAuth() auth: JwtPayload,
    @Query() query: StaffQuery,
  ) {
    const ids = await this.studentsInScope(auth.sub, query.organizationId);
    return {
      success: true,
      data: await this.users
        .find({ _id: { $in: ids } })
        .select("firstName lastName email")
        .limit(500)
        .lean(),
    };
  }
  @Get("results") async resultsList(
    @CurrentAuth() auth: JwtPayload,
    @Query() query: StaffQuery,
  ) {
    const ids = await this.studentsInScope(auth.sub, query.organizationId);
    const attempts = await this.attempts.distinct("_id", {
      organizationId: query.organizationId,
      context: "SCHOOL",
      userId: { $in: ids },
    });
    return {
      success: true,
      data: await this.results
        .find({ attemptId: { $in: attempts } })
        .select("-providerResult -reportKey")
        .sort({ _id: -1 })
        .limit(100)
        .lean(),
    };
  }
  @Get("completion") async completion(
    @CurrentAuth() auth: JwtPayload,
    @Query() query: StaffQuery,
  ) {
    const ids = await this.studentsInScope(auth.sub, query.organizationId);
    return {
      success: true,
      data: await this.attempts
        .find({
          organizationId: query.organizationId,
          context: "SCHOOL",
          userId: { $in: ids },
        })
        .select("userId assessmentId assignmentId progress status")
        .sort({ _id: -1 })
        .limit(500)
        .lean(),
    };
  }
}
