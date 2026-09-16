import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  composeStudentFitProfile,
  deriveDimensionRanges,
  normalizeDimensionScores,
  type ScoredAssessmentFragment,
} from "@future-fit/validation";
import { Model, Types } from "mongoose";

import {
  Assessment,
  type AssessmentDocument,
} from "../assessments/assessment.schema.js";
import {
  AssessmentAttempt,
  type AssessmentAttemptDocument,
} from "../assessments/attempt.schema.js";
import {
  AssessmentResult,
  type AssessmentResultDocument,
} from "../assessments/result.schema.js";
import {
  AssessmentVersion,
  type AssessmentVersionDocument,
} from "../assessments/assessment-version.schema.js";
import type { UpdateStudentProfileDto } from "./dto/student-profile.dto.js";
import {
  StudentProfile,
  type StudentProfileDocument,
} from "./student-profile.schema.js";

const FIT_GROUPS = [
  "interest",
  "aptitude",
  "personality",
  "values",
  "academic",
] as const;

type FitAssessmentType = ScoredAssessmentFragment["assessmentType"];

function isFitAssessmentType(value: string): value is FitAssessmentType {
  return [
    "INTEREST",
    "PERSONALITY",
    "APTITUDE",
    "VALUES",
    "EDUCATIONAL_SURVEY",
    "ACADEMIC_PREFERENCE",
  ].includes(value);
}

@Injectable()
export class StudentsService {
  constructor(
    @InjectModel(StudentProfile.name)
    private readonly profiles: Model<StudentProfileDocument>,
    @InjectModel(AssessmentResult.name)
    private readonly results: Model<AssessmentResultDocument>,
    @InjectModel(AssessmentAttempt.name)
    private readonly attempts: Model<AssessmentAttemptDocument>,
    @InjectModel(AssessmentVersion.name)
    private readonly versions: Model<AssessmentVersionDocument>,
    @InjectModel(Assessment.name)
    private readonly assessments: Model<AssessmentDocument>,
  ) {}

  async getProfile(userId: string) {
    const profile = await this.profiles.findOne({ userId }).lean();

    return (
      profile ?? {
        userId,
        subjects: [],
        profileComplete: false,
      }
    );
  }

  async updateProfile(userId: string, input: UpdateStudentProfileDto) {
    const cleaned = {
      ...input,
      state: input.state?.trim() || undefined,
      city: input.city?.trim() || undefined,
      careerGoal: input.careerGoal?.trim() || undefined,
      subjects: input.subjects
        ? [...new Set(input.subjects.map((value) => value.trim()).filter(Boolean))]
        : undefined,
    };

    const current = await this.profiles.findOne({ userId }).lean();
    const grade = cleaned.grade ?? current?.grade;
    const board = cleaned.board ?? current?.board;

    return this.profiles.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        $set: {
          ...cleaned,
          profileComplete: Boolean(grade && board),
        },
        $setOnInsert: {
          userId: new Types.ObjectId(userId),
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      },
    );
  }

  async getFitProfile(userId: string) {
    const results = await this.results
      .find({
        userId,
        scoringVersion: { $ne: "pending" },
      })
      .sort({ _id: -1 })
      .limit(100)
      .lean();

    const usedAssessmentTypes = new Set<FitAssessmentType>();
    const fragments: ScoredAssessmentFragment[] = [];
    const sources: Array<{
      resultId: string;
      attemptId: string;
      assessmentType: FitAssessmentType;
      assessmentVersion: string;
      scoringVersion: string;
    }> = [];

    for (const result of results) {
      const attempt = await this.attempts.findOne({
        _id: result.attemptId,
        userId,
      }).lean();

      if (!attempt) continue;

      const [version, assessment] = await Promise.all([
        this.versions.findById(attempt.assessmentVersionId).lean(),
        this.assessments.findById(attempt.assessmentId).lean(),
      ]);

      if (
        !version ||
        !assessment ||
        !isFitAssessmentType(assessment.type) ||
        usedAssessmentTypes.has(assessment.type) ||
        version.scoringConfiguration.scoringModel !== "OPTION_SUM_V1"
      ) {
        continue;
      }

      const ranges = deriveDimensionRanges(
        version.questionSnapshots,
        version.scoringConfiguration as Parameters<
          typeof deriveDimensionRanges
        >[1],
      );

      const normalizedDimensions = normalizeDimensionScores(
        result.dimensions,
        ranges,
      );

      fragments.push({
        assessmentType: assessment.type,
        normalizedDimensions,
      });

      sources.push({
        resultId: result._id.toString(),
        attemptId: attempt._id.toString(),
        assessmentType: assessment.type,
        assessmentVersion: version.version,
        scoringVersion: result.scoringVersion,
      });

      usedAssessmentTypes.add(assessment.type);
    }

    const profile = composeStudentFitProfile(fragments);

    const completedGroups = FIT_GROUPS.filter(
      (group) => Object.keys(profile[group]).length > 0,
    );

    return {
      profile,
      completedGroups,
      coverage: Math.round((completedGroups.length / FIT_GROUPS.length) * 100),
      sources,
      note:
        "Career matching is intentionally not calculated here until reviewed canonical career requirement profiles are available.",
    };
  }
}
