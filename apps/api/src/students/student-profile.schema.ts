import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

export const STUDENT_GRADES = ["9", "10", "11", "12"] as const;
export const STUDENT_BOARDS = [
  "CBSE",
  "CISCE",
  "STATE_BOARD",
  "IB",
  "CAMBRIDGE",
  "OTHER",
] as const;
export const STUDENT_STREAMS = [
  "PCM",
  "PCB",
  "PCMB",
  "COMMERCE",
  "HUMANITIES",
  "VOCATIONAL",
  "FLEXIBLE",
  "UNDECIDED",
] as const;

@Schema({
  timestamps: true,
  collection: "student_profiles",
})
export class StudentProfile {
  @Prop({ type: SchemaTypes.ObjectId, required: true, unique: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, enum: STUDENT_GRADES })
  grade?: (typeof STUDENT_GRADES)[number];

  @Prop({ type: String, enum: STUDENT_BOARDS })
  board?: (typeof STUDENT_BOARDS)[number];

  @Prop({ type: String, enum: STUDENT_STREAMS })
  stream?: (typeof STUDENT_STREAMS)[number];

  @Prop({ trim: true, maxlength: 80 })
  state?: string;

  @Prop({ trim: true, maxlength: 80 })
  city?: string;

  @Prop({ type: [String], default: [] })
  subjects!: string[];

  @Prop({ trim: true, maxlength: 300 })
  careerGoal?: string;

  @Prop({ default: false })
  profileComplete!: boolean;
}

export type StudentProfileDocument = HydratedDocument<StudentProfile>;
export const StudentProfileSchema =
  SchemaFactory.createForClass(StudentProfile);

StudentProfileSchema.index({ grade: 1, board: 1 });
