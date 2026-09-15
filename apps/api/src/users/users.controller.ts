import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Model } from "mongoose";

import { AccessTokenGuard } from "../auth/access-token.guard.js";
import { CurrentAuth } from "../auth/current-auth.decorator.js";
import type { JwtPayload } from "../auth/auth.types.js";
import { CsrfGuard } from "../auth/csrf.guard.js";
import {
  GuardianLink,
  type GuardianLinkDocument,
} from "../guardians/guardian.schema.js";
import {
  OrganizationMembership,
  type OrganizationMembershipDocument,
} from "../organizations/membership.schema.js";
import { ProfileDto } from "./profile.dto.js";
import { User, type UserDocument } from "./user.schema.js";

type WorkspaceKind =
  | "SUPER_ADMIN"
  | "SCHOOL_ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "GUARDIAN";

interface WorkspaceSummary {
  kind: WorkspaceKind;
  label: string;
  href: string;
  organizationIds: string[];
}

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller({ path: "users", version: "1" })
export class UsersController {
  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(OrganizationMembership.name)
    private readonly memberships: Model<OrganizationMembershipDocument>,
    @InjectModel(GuardianLink.name)
    private readonly guardianLinks: Model<GuardianLinkDocument>,
  ) {}

  @Get("me/access-context")
  async accessContext(@CurrentAuth() current: JwtPayload) {
    const user = await this.users
      .findById(current.sub)
      .select("globalRoles status")
      .lean();

    if (!user) throw new NotFoundException("User not found.");

    const memberships = await this.memberships
      .find({
        userId: current.sub,
        status: "ACTIVE",
      })
      .select("organizationId role status")
      .lean();

    const guardianLinks = await this.guardianLinks
      .find({
        guardianId: current.sub,
        status: { $in: ["REQUESTED", "APPROVED"] },
      })
      .select("studentId guardianId status")
      .lean();

    const schoolAdminOrganizationIds = memberships
      .filter((membership) => membership.role === "SCHOOL_ADMIN")
      .map((membership) => membership.organizationId.toString());

    const teacherOrganizationIds = memberships
      .filter((membership) => membership.role === "TEACHER")
      .map((membership) => membership.organizationId.toString());

    const studentOrganizationIds = memberships
      .filter((membership) => membership.role === "STUDENT")
      .map((membership) => membership.organizationId.toString());

    const isSuperAdmin = user.globalRoles.includes("SUPER_ADMIN");
    const isGuardian = guardianLinks.length > 0;

    /*
     * STUDENT is the normal Future Fit assessment workspace.
     *
     * A student can be:
     * - independent (no school membership yet), or
     * - linked to a school with STUDENT membership.
     *
     * Staff/guardian-only accounts do not automatically receive the student
     * workspace simply because every account is stored in the users collection.
     */
    const hasStaffWorkspace =
      isSuperAdmin ||
      schoolAdminOrganizationIds.length > 0 ||
      teacherOrganizationIds.length > 0;

    const hasStudentWorkspace =
      studentOrganizationIds.length > 0 ||
      (!hasStaffWorkspace && !isGuardian);

    const workspaces: WorkspaceSummary[] = [];

    if (isSuperAdmin) {
      workspaces.push({
        kind: "SUPER_ADMIN",
        label: "Super Admin",
        href: "/admin/dashboard",
        organizationIds: [],
      });
    }

    if (schoolAdminOrganizationIds.length > 0) {
      workspaces.push({
        kind: "SCHOOL_ADMIN",
        label: "Principal / School Admin",
        href: "/school/dashboard",
        organizationIds: schoolAdminOrganizationIds,
      });
    }

    if (teacherOrganizationIds.length > 0) {
      workspaces.push({
        kind: "TEACHER",
        label: "Teacher",
        href: "/teacher/dashboard",
        organizationIds: teacherOrganizationIds,
      });
    }

    if (hasStudentWorkspace) {
      workspaces.push({
        kind: "STUDENT",
        label: "Student",
        href: "/student/dashboard",
        organizationIds: studentOrganizationIds,
      });
    }

    if (isGuardian) {
      workspaces.push({
        kind: "GUARDIAN",
        label: "Guardian",
        href: "/guardian/dashboard",
        organizationIds: [],
      });
    }

    let defaultWorkspace: WorkspaceKind = "STUDENT";

    if (isSuperAdmin) {
      defaultWorkspace = "SUPER_ADMIN";
    } else if (schoolAdminOrganizationIds.length > 0) {
      defaultWorkspace = "SCHOOL_ADMIN";
    } else if (teacherOrganizationIds.length > 0) {
      defaultWorkspace = "TEACHER";
    } else if (studentOrganizationIds.length > 0) {
      defaultWorkspace = "STUDENT";
    } else if (isGuardian) {
      defaultWorkspace = "GUARDIAN";
    }

    const defaultEntry =
      workspaces.find((workspace) => workspace.kind === defaultWorkspace) ??
      workspaces[0];

    return {
      success: true,
      data: {
        defaultWorkspace: defaultEntry?.kind ?? "STUDENT",
        defaultHref: defaultEntry?.href ?? "/student/dashboard",
        workspaces,
        memberships: memberships.map((membership) => ({
          organizationId: membership.organizationId.toString(),
          role: membership.role,
          status: membership.status,
        })),
        guardianLinks: guardianLinks.map((link) => ({
          id: link._id.toString(),
          studentId: link.studentId.toString(),
          guardianId: link.guardianId.toString(),
          status: link.status,
        })),
      },
    };
  }

  @Patch("me")
  @UseGuards(CsrfGuard)
  async update(
    @CurrentAuth() current: JwtPayload,
    @Body() input: ProfileDto,
  ) {
    await this.users.updateOne({ _id: current.sub }, { $set: input });
    return this.me(current);
  }

  @Get("me")
  async me(@CurrentAuth() current: JwtPayload) {
    const user = await this.users.findById(current.sub);

    if (!user) throw new NotFoundException("User not found.");

    return {
      success: true,
      data: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        preferredLanguage: user.preferredLanguage,
        emailVerified: user.emailVerified,
        status: user.status,
        globalRoles: user.globalRoles,
      },
    };
  }
}
