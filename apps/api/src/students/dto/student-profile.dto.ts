import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

import {
  STUDENT_BOARDS,
  STUDENT_GRADES,
  STUDENT_STREAMS,
} from "../student-profile.schema.js";

export class UpdateStudentProfileDto {
  @IsOptional()
  @IsIn(STUDENT_GRADES)
  grade?: (typeof STUDENT_GRADES)[number];

  @IsOptional()
  @IsIn(STUDENT_BOARDS)
  board?: (typeof STUDENT_BOARDS)[number];

  @IsOptional()
  @IsIn(STUDENT_STREAMS)
  stream?: (typeof STUDENT_STREAMS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(15)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  subjects?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(300)
  careerGoal?: string;
}
