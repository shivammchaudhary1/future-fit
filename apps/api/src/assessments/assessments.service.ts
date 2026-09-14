import {
  BadRequestException,
  ConflictException,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { publicQuestion, validateAnswers } from "@future-fit/validation";
import {
  Entitlement,
  type EntitlementDocument,
} from "../payments/payment.schema.js";
import { QueueService } from "../queue/queue.service.js";
import { SchoolsService } from "../schools/schools.service.js";
import { OrganizationsService } from "../organizations/organizations.service.js";
import { Assessment, type AssessmentDocument } from "./assessment.schema.js";
import {
  AssessmentVersion,
  type AssessmentVersionDocument,
} from "./assessment-version.schema.js";
import {
  AssessmentAttempt,
  type AssessmentAttemptDocument,
} from "./attempt.schema.js";
import { PERSONAL_CONTEXT, PUBLISHED_STATUS } from "./assessment.constants.js";
import type {
  SaveResponsesDto,
  StartAssessmentDto,
} from "./dto/assessment.dto.js";
import {
  AssessmentResult,
  type AssessmentResultDocument,
} from "./result.schema.js";

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectModel(Assessment.name)
    private readonly assessments: Model<AssessmentDocument>,
    @InjectModel(AssessmentVersion.name)
    private readonly versions: Model<AssessmentVersionDocument>,
    @InjectModel(AssessmentAttempt.name)
    private readonly attempts: Model<AssessmentAttemptDocument>,
    @InjectModel(AssessmentResult.name)
    private readonly results: Model<AssessmentResultDocument>,
    private readonly queue: QueueService,
    private readonly organizations: OrganizationsService,
    private readonly schools: SchoolsService,
    @InjectModel(Entitlement.name)
    private readonly entitlements: Model<EntitlementDocument>,
  ) {}

  list() {
    return this.assessments
      .find({ status: PUBLISHED_STATUS })
      .select("name type description activeVersionId isPaid")
      .lean();
  }
  async get(assessmentId: string) {
    const assessment = await this.assessments
      .findOne({ _id: assessmentId, status: PUBLISHED_STATUS })
      .lean();
    if (!assessment) throw new NotFoundException("Assessment not found.");
    return assessment;
  }

  async start(userId: string, assessmentId: string, input: StartAssessmentDto) {
    if (
      input.context === PERSONAL_CONTEXT &&
      (input.organizationId || input.assignmentId)
    )
      throw new BadRequestException(
        "Personal attempts cannot include school assignment details.",
      );
    if (input.context === "SCHOOL" && !input.organizationId)
      throw new BadRequestException("School attempts require an organization.");
    if (input.context === "SCHOOL" && input.organizationId)
      await this.organizations.requireMembership(userId, input.organizationId);
    const assessment = await this.assessments.findOne({
      _id: assessmentId,
      status: PUBLISHED_STATUS,
    });
    if (!assessment?.activeVersionId)
      throw new NotFoundException("Published assessment version not found.");
    let versionId = assessment.activeVersionId;
    if (
      assessment.isPaid &&
      !(await this.entitlements.exists({
        userId,
        assessmentId,
        active: true,
        expiresAt: { $gt: new Date() },
      }))
    )
      throw new ForbiddenException(
        "A verified payment entitlement is required for this assessment.",
      );
    if (input.context === "SCHOOL" && input.organizationId) {
      if (!input.assignmentId)
        throw new BadRequestException(
          "School attempts require an assessment assignment.",
        );
      const assignment = await this.schools.requireAssignmentForStudent(
        input.assignmentId,
        input.organizationId,
        userId,
      );
      if (!assignment.assessmentId.equals(assessment._id))
        throw new BadRequestException(
          "The assignment does not match this assessment version.",
        );
      versionId = assignment.assessmentVersionId;
    }
    if (
      !(await this.versions.exists({
        _id: versionId,
        assessmentId,
        status: PUBLISHED_STATUS,
        "questionSnapshots.0": { $exists: true },
      }))
    )
      throw new NotFoundException(
        "Published question content is not available.",
      );
    const existing = await this.attempts.findOne({
      userId,
      assessmentId,
      assessmentVersionId: versionId,
      context: input.context,
      organizationId: input.organizationId ?? { $exists: false },
      assignmentId: input.assignmentId ?? { $exists: false },
      status: "IN_PROGRESS",
    });
    if (existing) return existing;
    return this.attempts.create({
      userId: new Types.ObjectId(userId),
      assessmentId: assessment._id,
      assessmentVersionId: versionId,
      context: input.context,
      organizationId: input.organizationId
        ? new Types.ObjectId(input.organizationId)
        : undefined,
      assignmentId: input.assignmentId
        ? new Types.ObjectId(input.assignmentId)
        : undefined,
      language: input.language,
      status: "IN_PROGRESS",
      startedAt: new Date(),
    });
  }

  async getAttempt(userId: string, attemptId: string) {
    const attempt = await this.attempts
      .findOne({ _id: attemptId, userId })
      .lean();
    if (!attempt) throw new NotFoundException("Assessment attempt not found.");
    const version = await this.versions
      .findById(attempt.assessmentVersionId)
      .lean();
    if (!version) throw new NotFoundException("Assessment version not found.");
    return {
      attempt,
      version: {
        _id: version._id,
        version: version.version,
        sections: version.sections,
        questions: version.questionSnapshots.map(publicQuestion),
      },
    };
  }

  async save(userId: string, attemptId: string, input: SaveResponsesDto) {
    const attempt = await this.attempts.findOne({ _id: attemptId, userId });
    if (!attempt) throw new NotFoundException("Assessment attempt not found.");
    if (attempt.status !== "IN_PROGRESS")
      throw new ConflictException(
        "Only an in-progress attempt can be changed.",
      );
    if (attempt.revision !== input.revision)
      throw new ConflictException("Reload the latest answers before saving.");
    const version = await this.versions.findById(attempt.assessmentVersionId);
    if (!version) throw new NotFoundException("Assessment version not found.");
    try {
      validateAnswers(version.questionSnapshots, input.responses);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Invalid responses",
      );
    }
    const merged = new Map(
      attempt.responses.map((response) => [response.questionId, response]),
    );
    for (const response of input.responses) {
      if (response.answer === null) merged.delete(response.questionId);
      else
        merged.set(response.questionId, {
          ...response,
          answeredAt: new Date(),
        });
    }
    const saved = await this.attempts.findOneAndUpdate(
      {
        _id: attemptId,
        userId,
        status: "IN_PROGRESS",
        revision: input.revision,
      },
      {
        $set: {
          responses: [...merged.values()],
          progress: Math.round(
            (merged.size / version.questionSnapshots.length) * 100,
          ),
          lastSavedAt: new Date(),
        },
        $inc: { revision: 1 },
      },
      { new: true },
    );
    if (!saved)
      throw new ConflictException(
        "Answers changed in another session. Reload and merge before saving.",
      );
    return saved;
  }

  async submit(userId: string, attemptId: string) {
    const current = await this.attempts.findOne({ _id: attemptId, userId });
    if (!current) throw new NotFoundException("Assessment attempt not found.");
    if (current.status !== "IN_PROGRESS") {
      if (current.status === "SUBMITTED")
        await this.queue.enqueueScoring(attemptId);
      return { attemptId, status: current.status };
    }
    const version = await this.versions.findById(current.assessmentVersionId);
    if (!version) throw new NotFoundException("Assessment version not found.");
    try {
      validateAnswers(version.questionSnapshots, current.responses, true);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Incomplete responses",
      );
    }
    const attempt = await this.attempts.findOneAndUpdate(
      {
        _id: attemptId,
        userId,
        status: "IN_PROGRESS",
        revision: current.revision,
      },
      { status: "SUBMITTED", submittedAt: new Date(), progress: 100 },
      { new: true },
    );
    if (!attempt) {
      const found = await this.attempts.findOne({ _id: attemptId, userId });
      if (!found) throw new NotFoundException("Assessment attempt not found.");
      throw new ConflictException("Assessment has already been submitted.");
    }
    await this.results.updateOne(
      { attemptId: attempt._id },
      {
        $setOnInsert: {
          attemptId: attempt._id,
          userId: attempt.userId,
          scoringVersion: "pending",
          dimensions: {},
          careerMatches: [],
          reportStatus: "PENDING",
        },
      },
      { upsert: true },
    );
    await this.queue.enqueueScoring(attempt._id.toString());
    return { attemptId: attempt._id.toString(), status: attempt.status };
  }

  listAttempts(userId: string) {
    return this.attempts
      .find({ userId })
      .select("-responses")
      .sort({ _id: -1 })
      .limit(100)
      .lean();
  }

  async result(userId: string, attemptId: string) {
    const result = await this.results.findOne({ attemptId, userId }).select("-providerResult -reportKey").lean();
    if (!result) throw new NotFoundException("Result not found.");
    return result;
  }
}
