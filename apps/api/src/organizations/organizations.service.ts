import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { User, type UserDocument } from "../users/user.schema.js";
import type { InviteMemberDto } from "./membership.dto.js";
import type { CreateOrganizationDto } from "./dto/organization.dto.js";
import { ACTIVE_STATUS, SCHOOL_ADMIN_ROLE } from "./organization.constants.js";
import {
  OrganizationMembership,
  type OrganizationMembershipDocument,
} from "./membership.schema.js";
import {
  Organization,
  type OrganizationDocument,
} from "./organization.schema.js";

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(Organization.name)
    private readonly organizations: Model<OrganizationDocument>,
    @InjectModel(OrganizationMembership.name)
    private readonly memberships: Model<OrganizationMembershipDocument>,
  ) {}
  mine(userId: string) {
    return this.memberships
      .find({ userId, status: { $in: ["ACTIVE", "INVITED"] } })
      .lean();
  }
  async invite(
    actorId: string,
    organizationId: string,
    input: InviteMemberDto,
  ) {
    await this.requireRole(actorId, organizationId, [SCHOOL_ADMIN_ROLE]);
    const user = await this.users.findOne({
      email: input.email.toLowerCase().trim(),
    });
    if (!user)
      throw new NotFoundException(
        "The user must register before being invited.",
      );
    return this.memberships.findOneAndUpdate(
      { userId: user._id, organizationId },
      { $setOnInsert: { role: input.role, status: "INVITED" } },
      { upsert: true, new: true },
    );
  }
  async accept(userId: string, organizationId: string) {
    if (
      !(await this.organizations.exists({
        _id: organizationId,
        status: ACTIVE_STATUS,
      }))
    )
      throw new NotFoundException("Active organization not found.");
    const member = await this.memberships.findOneAndUpdate(
      { userId, organizationId, status: "INVITED" },
      { $set: { status: ACTIVE_STATUS, joinedAt: new Date() } },
      { new: true },
    );
    if (!member) throw new NotFoundException("Invitation not found.");
    return member;
  }
  async setMemberStatus(
    actorId: string,
    organizationId: string,
    userId: string,
    status: "ACTIVE" | "SUSPENDED",
  ) {
    await this.requireRole(actorId, organizationId, [SCHOOL_ADMIN_ROLE]);
    if (actorId === userId)
      throw new ForbiddenException("You cannot suspend your own membership.");
    const member = await this.memberships.findOneAndUpdate(
      {
        userId,
        organizationId,
        role: { $ne: SCHOOL_ADMIN_ROLE },
        status: { $ne: "INVITED" },
      },
      { $set: { status } },
      { new: true },
    );
    if (!member) throw new NotFoundException("Managed membership not found.");
    return member;
  }
  async create(userId: string, input: CreateOrganizationDto) {
    const organization = await this.organizations.create(input);
    try {
      await this.memberships.create({
        organizationId: organization._id,
        userId: new Types.ObjectId(userId),
        role: SCHOOL_ADMIN_ROLE,
        status: ACTIVE_STATUS,
        joinedAt: new Date(),
      });
    } catch (error) {
      await this.organizations.deleteOne({ _id: organization._id });
      throw error;
    }
    return organization;
  }
  async getForMember(userId: string, organizationId: string) {
    await this.requireMembership(userId, organizationId);
    const organization = await this.organizations
      .findOne({ _id: organizationId, status: ACTIVE_STATUS })
      .lean();
    if (!organization) throw new NotFoundException("Organization not found.");
    return organization;
  }
  async members(userId: string, organizationId: string) {
    await this.requireRole(userId, organizationId, [SCHOOL_ADMIN_ROLE]);
    return this.memberships
      .find({ organizationId, status: ACTIVE_STATUS })
      .select("userId role status joinedAt")
      .lean();
  }
  async requireMembership(userId: string, organizationId: string) {
    if (
      !(await this.organizations.exists({
        _id: organizationId,
        status: ACTIVE_STATUS,
      }))
    )
      throw new NotFoundException("Active organization not found.");
    const membership = await this.memberships.findOne({
      userId,
      organizationId,
      status: ACTIVE_STATUS,
    });
    if (!membership)
      throw new NotFoundException("Organization membership not found.");
    return membership;
  }

  async requireRole(
    userId: string,
    organizationId: string,
    roles: OrganizationMembership["role"][],
  ) {
    const membership = await this.requireMembership(userId, organizationId);
    if (!roles.includes(membership.role))
      throw new ForbiddenException(
        "You do not have permission for this organization action.",
      );
    return membership;
  }
}
