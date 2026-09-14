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
    return this.questions.find().sort({ _id: -1 }).limit(100).lean();
  }
  async listVersions(assessmentId: string) {
    if (!(await this.assessments.exists({ _id: assessmentId })))
      throw new NotFoundException("Assessment not found.");
    return this.versions.find({ assessmentId }).sort({ _id: -1 }).limit(100).lean();
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
      .find({ _id: { $in: references.map((q) => q.questionId) } })
      .lean();
    if (questions.length !== references.length)
      throw new BadRequestException("One or more questions do not exist.");
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
