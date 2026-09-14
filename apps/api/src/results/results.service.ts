import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  GuardianLink,
  type GuardianLinkDocument,
} from "../guardians/guardian.schema.js";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  AssessmentResult,
  type AssessmentResultDocument,
} from "../assessments/result.schema.js";
import {
  AssessmentAttempt,
  type AssessmentAttemptDocument,
} from "../assessments/attempt.schema.js";
import { OrganizationsService } from "../organizations/organizations.service.js";
import {
  SchoolClass,
  type SchoolClassDocument,
} from "../schools/class.schema.js";
import {
  ClassEnrollment,
  type ClassEnrollmentDocument,
} from "../schools/class-enrollment.schema.js";
import {
  ResultShare,
  type ResultShareDocument,
} from "./result-share.schema.js";
@Injectable()
export class ResultsService {
  constructor(
    @InjectModel(AssessmentResult.name)
    private readonly results: Model<AssessmentResultDocument>,
    @InjectModel(AssessmentAttempt.name)
    private readonly attempts: Model<AssessmentAttemptDocument>,
    @InjectModel(ResultShare.name)
    private readonly shares: Model<ResultShareDocument>,
    @InjectModel(SchoolClass.name)
    private readonly classes: Model<SchoolClassDocument>,
    @InjectModel(ClassEnrollment.name)
    private readonly enrollments: Model<ClassEnrollmentDocument>,
    private readonly organizations: OrganizationsService,
    private readonly config: ConfigService,
    @InjectModel(GuardianLink.name)
    private readonly guardians: Model<GuardianLinkDocument>,
  ) {}
  list(userId: string) {
    return this.results
      .find({ userId })
      .select("-providerResult -reportKey")
      .sort({ _id: -1 })
      .limit(100)
      .lean();
  }
  async shared(userId: string) {
    const shares = await this.shares
      .find({ sharedWithUserId: userId, revokedAt: { $exists: false } })
      .limit(100)
      .lean();
    const visible = [];
    for (const share of shares) {
      try {
        visible.push(await this.get(userId, share.resultId.toHexString()));
      } catch (error) {
        if (
          !(error instanceof ForbiddenException) &&
          !(error instanceof NotFoundException)
        )
          throw error;
      }
    }
    return visible;
  }
  async get(userId: string, resultId: string) {
    const result = await this.authorize(userId, resultId);
    const publicResult = result.toObject();
    delete publicResult.reportKey;
    delete publicResult.providerResult;
    return publicResult;
  }
  async authorize(userId: string, resultId: string) {
    const result = await this.results.findById(resultId);
    if (!result) throw new NotFoundException("Result not found.");
    if (result.userId.equals(userId)) return result;
    const share = await this.shares.findOne({
      resultId,
      sharedWithUserId: userId,
      revokedAt: { $exists: false },
    });
    if (share) {
      if (!share.organizationId) {
        if (
          !(await this.guardians.exists({
            studentId: result.userId,
            guardianId: userId,
            status: "APPROVED",
          }))
        )
          throw new ForbiddenException("Guardian access has been revoked.");
        return result;
      }
      await this.organizations.requireRole(
        userId,
        share.organizationId.toHexString(),
        ["TEACHER", "SCHOOL_ADMIN"],
      );
      return result;
    }
    const attempt = await this.attempts.findById(result.attemptId);
    if (attempt?.context !== "SCHOOL" || !attempt.organizationId)
      throw new ForbiddenException("This result is private.");
    const orgId = attempt.organizationId.toHexString();
    const membership = await this.organizations.requireRole(userId, orgId, [
      "SCHOOL_ADMIN",
      "TEACHER",
    ]);
    if (membership.role === "SCHOOL_ADMIN") return result;
    const classIds = await this.classes.distinct("_id", {
      organizationId: orgId,
      teacherIds: userId,
    });
    if (
      !(await this.enrollments.exists({
        organizationId: orgId,
        classId: { $in: classIds },
        studentId: result.userId,
        active: true,
      }))
    )
      throw new ForbiddenException("Student is not in an assigned class.");
    return result;
  }
  async share(
    userId: string,
    resultId: string,
    recipientId: string,
    organizationId?: string,
  ) {
    const result = await this.results.findOne({ _id: resultId, userId });
    if (!result) throw new NotFoundException("Owned result not found.");
    if (!organizationId) {
      if (
        !(await this.guardians.exists({
          studentId: userId,
          guardianId: recipientId,
          status: "APPROVED",
        }))
      )
        throw new ForbiddenException(
          "Approved guardian relationship required.",
        );
      return this.shares.findOneAndUpdate(
        { resultId, sharedWithUserId: recipientId },
        {
          $set: { ownerUserId: new Types.ObjectId(userId) },
          $unset: { revokedAt: "", organizationId: "" },
        },
        { upsert: true, new: true },
      );
    }
    await this.organizations.requireMembership(userId, organizationId);
    await this.organizations.requireRole(recipientId, organizationId, [
      "TEACHER",
      "SCHOOL_ADMIN",
    ]);
    const organization = await this.organizations.getForMember(
      userId,
      organizationId,
    );
    if (!organization.settings.allowPersonalReportSharing)
      throw new ForbiddenException(
        "Sharing is disabled for this organization.",
      );
    return this.shares.findOneAndUpdate(
      { resultId, sharedWithUserId: recipientId },
      {
        $set: {
          ownerUserId: new Types.ObjectId(userId),
          organizationId: new Types.ObjectId(organizationId),
        },
        $unset: { revokedAt: "" },
      },
      { upsert: true, new: true },
    );
  }
  async revoke(userId: string, resultId: string, shareId: string) {
    const result = await this.shares.updateOne(
      { _id: shareId, resultId, ownerUserId: userId },
      { $set: { revokedAt: new Date() } },
    );
    if (!result.matchedCount) throw new NotFoundException("Share not found.");
  }
  async listShares(userId: string, resultId: string) {
    if (!(await this.results.exists({ _id: resultId, userId })))
      throw new NotFoundException("Owned result not found.");
    return this.shares.find({ resultId, ownerUserId: userId }).lean();
  }
  async report(userId: string, resultId: string) {
    const result = await this.authorize(userId, resultId);
    if (result.reportStatus !== "READY" || !result.reportKey)
      throw new ServiceUnavailableException("Report is not ready.");
    const storage = new S3Client({
      region: "auto",
      endpoint: this.config.getOrThrow<string>("R2_ENDPOINT"),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>("R2_ACCESS_KEY_ID"),
        secretAccessKey: this.config.getOrThrow<string>("R2_SECRET_ACCESS_KEY"),
      },
    });
    try {
      return {
        url: await getSignedUrl(
          storage,
          new GetObjectCommand({
            Bucket: this.config.getOrThrow<string>("R2_BUCKET"),
            Key: result.reportKey,
            ResponseContentDisposition:
              'attachment; filename="future-fit-report.pdf"',
          }),
          { expiresIn: 60 },
        ),
        expiresIn: 60,
      };
    } finally {
      storage.destroy();
    }
  }
}
