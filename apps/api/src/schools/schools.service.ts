import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  Assessment,
  type AssessmentDocument,
} from "../assessments/assessment.schema.js";
import {
  OrganizationMembership,
  type OrganizationMembershipDocument,
} from "../organizations/membership.schema.js";
import { OrganizationsService } from "../organizations/organizations.service.js";
import type {
  CreateAcademicYearDto,
  CreateAssignmentDto,
  CreateClassDto,
} from "./dto/school.dto.js";
import {
  AcademicYear,
  type AcademicYearDocument,
} from "./academic-year.schema.js";
import {
  AssessmentAssignment,
  type AssessmentAssignmentDocument,
} from "./assessment-assignment.schema.js";
import {
  ClassEnrollment,
  type ClassEnrollmentDocument,
} from "./class-enrollment.schema.js";
import { SchoolClass, type SchoolClassDocument } from "./class.schema.js";
import {
  ACTIVE_ASSIGNMENT,
  ACTIVE_MEMBERSHIP,
  ASSIGNMENT_CREATOR_ROLES,
  CLASS_MANAGER_ROLES,
  STUDENT_ROLE,
  TEACHER_ROLE,
} from "./school.constants.js";

@Injectable()
export class SchoolsService {
  constructor(
    @InjectModel(AcademicYear.name)
    private readonly years: Model<AcademicYearDocument>,
    @InjectModel(SchoolClass.name)
    private readonly classes: Model<SchoolClassDocument>,
    @InjectModel(ClassEnrollment.name)
    private readonly enrollments: Model<ClassEnrollmentDocument>,
    @InjectModel(AssessmentAssignment.name)
    private readonly assignments: Model<AssessmentAssignmentDocument>,
    @InjectModel(OrganizationMembership.name)
    private readonly memberships: Model<OrganizationMembershipDocument>,
    @InjectModel(Assessment.name)
    private readonly assessments: Model<AssessmentDocument>,
    private readonly organizations: OrganizationsService,
  ) {}

  async createYear(
    actorId: string,
    organizationId: string,
    input: CreateAcademicYearDto,
  ) {
    await this.organizations.requireRole(actorId, organizationId, [
      ...CLASS_MANAGER_ROLES,
    ]);
    if (input.endDate <= input.startDate)
      throw new BadRequestException(
        "Academic year end date must follow its start date.",
      );
    return this.years.create({
      ...input,
      organizationId: new Types.ObjectId(organizationId),
    });
  }

  async listYears(actorId: string, organizationId: string) {
    await this.organizations.requireMembership(actorId, organizationId);
    return this.years.find({ organizationId }).sort({ startDate: -1 }).lean();
  }

  async createClass(
    actorId: string,
    organizationId: string,
    input: CreateClassDto,
  ) {
    await this.organizations.requireRole(actorId, organizationId, [
      ...CLASS_MANAGER_ROLES,
    ]);
    const year = await this.years.exists({
      _id: input.academicYearId,
      organizationId,
      status: "ACTIVE",
    });
    if (!year)
      throw new NotFoundException(
        "Academic year not found in this organization.",
      );
    return this.classes.create({
      ...input,
      organizationId: new Types.ObjectId(organizationId),
      academicYearId: new Types.ObjectId(input.academicYearId),
    });
  }

  async listClasses(actorId: string, organizationId: string) {
    const membership = await this.organizations.requireMembership(
      actorId,
      organizationId,
    );
    const filter =
      membership.role === TEACHER_ROLE
        ? { organizationId, teacherIds: actorId }
        : membership.role === STUDENT_ROLE
          ? {
              organizationId,
              _id: {
                $in: await this.enrollments.distinct("classId", {
                  organizationId,
                  studentId: actorId,
                  active: true,
                }),
              },
            }
          : { organizationId };
    return this.classes.find(filter).sort({ grade: 1, section: 1 }).lean();
  }

  async addStudents(actorId: string, classId: string, studentIds: string[]) {
    const schoolClass = await this.requireClass(classId);
    await this.organizations.requireRole(
      actorId,
      schoolClass.organizationId.toString(),
      [...CLASS_MANAGER_ROLES],
    );
    await this.assertMembers(
      schoolClass.organizationId,
      studentIds,
      STUDENT_ROLE,
    );
    await this.enrollments.bulkWrite(
      studentIds.map((studentId) => ({
        updateOne: {
          filter: {
            classId: schoolClass._id,
            studentId: new Types.ObjectId(studentId),
          },
          update: {
            $set: { organizationId: schoolClass.organizationId, active: true },
          },
          upsert: true,
        },
      })),
    );
    return { enrolled: studentIds.length };
  }

  async addTeachers(actorId: string, classId: string, teacherIds: string[]) {
    const schoolClass = await this.requireClass(classId);
    await this.organizations.requireRole(
      actorId,
      schoolClass.organizationId.toString(),
      [...CLASS_MANAGER_ROLES],
    );
    await this.assertMembers(
      schoolClass.organizationId,
      teacherIds,
      TEACHER_ROLE,
    );
    await this.classes.updateOne(
      { _id: classId },
      {
        $addToSet: {
          teacherIds: { $each: teacherIds.map((id) => new Types.ObjectId(id)) },
        },
      },
    );
    return { assigned: teacherIds.length };
  }

  async createAssignment(
    actorId: string,
    organizationId: string,
    input: CreateAssignmentDto,
  ) {
    const membership = await this.organizations.requireRole(
      actorId,
      organizationId,
      [...ASSIGNMENT_CREATOR_ROLES],
    );
    const assessment = await this.assessments.findOne({
      _id: input.assessmentId,
      status: "PUBLISHED",
    });
    if (!assessment?.activeVersionId)
      throw new NotFoundException("Published assessment not found.");
    if (input.targetType === "CLASS") {
      const classes = await this.classes.find({
        _id: { $in: input.targetIds },
        organizationId,
      });
      if (classes.length !== input.targetIds.length)
        throw new BadRequestException(
          "One or more target classes are invalid.",
        );
      if (
        membership.role === TEACHER_ROLE &&
        classes.some(
          (item) => !item.teacherIds.some((id) => id.equals(actorId)),
        )
      )
        throw new ForbiddenException(
          "Teachers may assign only to their own classes.",
        );
    } else {
      await this.assertMembers(
        new Types.ObjectId(organizationId),
        input.targetIds,
        STUDENT_ROLE,
      );
      if (membership.role === TEACHER_ROLE) {
        const classIds = await this.classes.distinct("_id", {
          organizationId,
          teacherIds: actorId,
        });
        const students = await this.enrollments.distinct("studentId", {
          organizationId,
          classId: { $in: classIds },
          studentId: { $in: input.targetIds },
          active: true,
        });
        if (students.length !== new Set(input.targetIds).size)
          throw new ForbiddenException(
            "Teachers may assign only to students in their classes.",
          );
      }
    }
    return this.assignments.create({
      organizationId: new Types.ObjectId(organizationId),
      assessmentId: assessment._id,
      assessmentVersionId: assessment.activeVersionId,
      assignedBy: new Types.ObjectId(actorId),
      targetType: input.targetType,
      targetIds: input.targetIds.map((id) => new Types.ObjectId(id)),
      dueDate: input.dueDate,
      status: ACTIVE_ASSIGNMENT,
    });
  }

  async listAssignments(actorId: string, organizationId: string) {
    const membership = await this.organizations.requireMembership(
      actorId,
      organizationId,
    );
    const filter =
      membership.role === TEACHER_ROLE
        ? { organizationId, assignedBy: actorId }
        : membership.role === STUDENT_ROLE
          ? {
              organizationId,
              status: ACTIVE_ASSIGNMENT,
              $or: [
                { targetType: "STUDENT", targetIds: actorId },
                {
                  targetType: "CLASS",
                  targetIds: {
                    $in: await this.enrollments.distinct("classId", {
                      organizationId,
                      studentId: actorId,
                      active: true,
                    }),
                  },
                },
              ],
            }
          : { organizationId };
    return this.assignments
      .find(filter)
      .select(membership.role === STUDENT_ROLE ? "-targetIds" : "")
      .sort({ _id: -1 })
      .lean();
  }

  async requireAssignmentForStudent(
    assignmentId: string,
    organizationId: string,
    studentId: string,
  ) {
    await this.organizations.requireRole(studentId, organizationId, [
      STUDENT_ROLE,
    ]);
    const assignment = await this.assignments.findOne({
      _id: assignmentId,
      organizationId,
      status: ACTIVE_ASSIGNMENT,
    });
    if (!assignment)
      throw new NotFoundException("Active assessment assignment not found.");
    if (assignment.dueDate && assignment.dueDate < new Date())
      throw new BadRequestException("The assignment deadline has passed.");
    const targeted =
      assignment.targetType === "STUDENT"
        ? assignment.targetIds.some((id) => id.equals(studentId))
        : Boolean(
            await this.enrollments.exists({
              classId: { $in: assignment.targetIds },
              studentId,
              organizationId,
              active: true,
            }),
          );
    if (!targeted)
      throw new ForbiddenException(
        "This assessment is not assigned to the student.",
      );
    return assignment;
  }

  private async requireClass(classId: string) {
    const schoolClass = await this.classes.findById(classId);
    if (!schoolClass) throw new NotFoundException("Class not found.");
    return schoolClass;
  }
  private async assertMembers(
    organizationId: Types.ObjectId,
    userIds: string[],
    role: string,
  ) {
    const count = await this.memberships.countDocuments({
      organizationId,
      userId: { $in: userIds },
      role,
      status: ACTIVE_MEMBERSHIP,
    });
    if (count !== new Set(userIds).size)
      throw new BadRequestException(
        `Every selected user must be an active ${role.toLowerCase()} in this organization.`,
      );
  }
}
