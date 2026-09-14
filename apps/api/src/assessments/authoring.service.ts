import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  assessmentSchema,
  questionSchema,
  versionSchema,
  type QuestionSnapshot,
} from "@future-fit/validation";
import { Assessment, type AssessmentDocument } from "./assessment.schema.js";
import {
  AssessmentVersion,
  type AssessmentVersionDocument,
} from "./assessment-version.schema.js";
import { Question, type QuestionDocument } from "./question.schema.js";
import { z } from "zod";
import { AUTHORING_LIMITS, QUESTION_STATUSES } from "./authoring.constants.js";
const questionEditSchema = z
  .object({ revision: z.number().int().nonnegative(), content: questionSchema })
  .strict();
const questionStatusSchema = z
  .object({
    revision: z.number().int().nonnegative(),
    status: z.enum(QUESTION_STATUSES),
  })
  .strict();
const questionImportSchema = z
  .object({
    questions: z
      .array(questionSchema)
      .min(1)
      .max(AUTHORING_LIMITS.importQuestions),
  })
  .strict();
@Injectable()
export class AuthoringService {
  constructor(
    @InjectModel(Assessment.name)
    private readonly assessments: Model<AssessmentDocument>,
    @InjectModel(AssessmentVersion.name)
    private readonly versions: Model<AssessmentVersionDocument>,
    @InjectModel(Question.name)
    private readonly questions: Model<QuestionDocument>,
  ) {}
  list() {
    return this.assessments.find().sort({ _id: -1 }).limit(100).lean();
  }
  listQuestions() {
    return this.questions
      .find()
      .sort({ _id: -1 })
      .limit(AUTHORING_LIMITS.pageSize)
      .lean();
  }
  async getQuestion(id: string): Promise<Question & { _id: Types.ObjectId }> {
    const question = await this.questions
      .findById(id)
      .lean<Question & { _id: Types.ObjectId }>();
    if (!question) throw new NotFoundException("Question not found.");
    return {
      ...question,
      revision: question.revision ?? 0,
      status: question.status ?? "ACTIVE",
    };
  }
  private revisionFilter(id: string, revision: number) {
    return {
      _id: id,
      ...(revision === 0
        ? { $or: [{ revision: 0 }, { revision: { $exists: false } }] }
        : { revision }),
    };
  }
  async editQuestion(id: string, body: unknown) {
    const parsed = questionEditSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues);
    const question = await this.questions.findOneAndUpdate(
      {
        ...this.revisionFilter(id, parsed.data.revision),
        status: { $ne: "ARCHIVED" },
      },
      { $set: { content: parsed.data.content }, $inc: { revision: 1 } },
      { new: true, runValidators: true },
    );
    if (!question)
      throw new ConflictException(
        "Question changed, is archived, or no longer exists. Reload before editing.",
      );
    return question;
  }
  async setQuestionStatus(id: string, body: unknown) {
    const parsed = questionStatusSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues);
    const question = await this.questions.findOneAndUpdate(
      this.revisionFilter(id, parsed.data.revision),
      { $set: { status: parsed.data.status }, $inc: { revision: 1 } },
      { new: true, runValidators: true },
    );
    if (!question)
      throw new ConflictException(
        "Question changed or no longer exists. Reload before changing its status.",
      );
    return question;
  }
  async importQuestions(body: unknown) {
    const parsed = questionImportSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues);
    // Validate the whole batch before writing, and roll back all records if a write fails.
    return this.questions.db.transaction(async (session) =>
      this.questions.insertMany(
        parsed.data.questions.map((content) => ({ content })),
        { session },
      ),
    );
  }
  async listVersions(assessmentId: string) {
    if (!(await this.assessments.exists({ _id: assessmentId })))
      throw new NotFoundException("Assessment not found.");
    return this.versions
      .find({ assessmentId })
      .sort({ _id: -1 })
      .limit(100)
      .lean();
  }
  async create(userId: string, body: unknown) {
    const parsed = assessmentSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues);
    return this.assessments.create({
      ...parsed.data,
      createdBy: new Types.ObjectId(userId),
    });
  }
  async createQuestion(body: unknown) {
    const parsed = questionSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues);
    return this.questions.create({ content: parsed.data });
  }
  async createVersion(assessmentId: string, body: unknown) {
    if (!(await this.assessments.exists({ _id: assessmentId })))
      throw new NotFoundException("Assessment not found.");
    const parsed = versionSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues);
    const input = parsed.data;
    const references = input.sections.flatMap((s) =>
      [...s.questions].sort((a, b) => a.order - b.order),
    );
    const questions = await this.questions
      .find({
        _id: { $in: references.map((q) => q.questionId) },
        status: { $ne: "ARCHIVED" },
      })
      .lean();
    if (questions.length !== references.length)
      throw new BadRequestException(
        "One or more questions do not exist or are archived.",
      );
    const snapshots: QuestionSnapshot[] = references.map((reference) => {
      const question = questions.find(
        (q) => q._id.toString() === reference.questionId,
      )!;
      return { ...question.content, ...reference };
    });
    if (
      snapshots.some((q) =>
        q.options.some((o) =>
          Object.keys(o.scoring).some(
            (d) => !input.scoringConfiguration.dimensions.includes(d),
          ),
        ),
      )
    )
      throw new BadRequestException(
        "Question scoring references an unknown dimension.",
      );
    if (
      input.scoringConfiguration.scoringModel === "ONET_MINI_IP_V2" &&
      (snapshots.length !== 30 ||
        new Set(snapshots.map((q) => q.metadata.onetOrder)).size !== 30 ||
        snapshots.some(
          (q) =>
            !q.metadata.onetOrder ||
            !q.required ||
            q.type !== "LIKERT" ||
            q.options
              .map((o) => o.id)
              .sort()
              .join("") !== "12345",
        ))
    )
      throw new BadRequestException(
        "O*NET Mini-IP needs 30 required Likert questions with unique provider order and options 1–5.",
      );
    return this.versions.create({
      ...input,
      assessmentId: new Types.ObjectId(assessmentId),
      questionSnapshots: snapshots,
    });
  }
  async publish(assessmentId: string, versionId: string) {
    const version = await this.versions.findOneAndUpdate(
      { _id: versionId, assessmentId, status: "DRAFT" },
      { $set: { status: "PUBLISHED", publishedAt: new Date() } },
      { new: true },
    );
    if (!version) {
      const published = await this.versions.exists({
        _id: versionId,
        assessmentId,
        status: "PUBLISHED",
      });
      if (!published)
        throw new ConflictException("Only draft versions can be published.");
    }
    // Published content is never updated. Re-publication only selects the active version.
    return this.assessments.findOneAndUpdate(
      { _id: assessmentId },
      {
        $set: {
          activeVersionId: new Types.ObjectId(versionId),
          status: "PUBLISHED",
        },
      },
      { new: true },
    );
  }
}
