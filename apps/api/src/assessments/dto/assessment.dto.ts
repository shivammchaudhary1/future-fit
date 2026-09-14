import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsDefined,
  IsIn,
  IsMongoId,
  IsNumber,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import {
  ASSESSMENT_CONTEXTS,
  ATTEMPT_SYNC_LIMIT,
} from "../assessment.constants.js";

export class StartAssessmentDto {
  @IsIn(ASSESSMENT_CONTEXTS) context!: "PERSONAL" | "SCHOOL";
  @IsIn(["en", "hi"]) language: "en" | "hi" = "en";
  @IsOptional() @IsMongoId() organizationId?: string;
  @IsOptional() @IsMongoId() assignmentId?: string;
}
export class ResponseDto {
  @IsString() questionId!: string;
  @IsDefined() answer!: unknown;
}
export class SaveResponsesDto {
  @IsInt() @Min(0) revision!: number;
  @IsArray()
  @ArrayMaxSize(ATTEMPT_SYNC_LIMIT)
  @ValidateNested({ each: true })
  @Type(() => ResponseDto)
  responses!: ResponseDto[];
  @IsNumber() @Min(0) @Max(100) progress!: number;
}
