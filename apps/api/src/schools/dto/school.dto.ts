import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDate,
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
} from "class-validator";
import { ASSIGNMENT_TARGET_TYPES, GRADES } from "../school.constants.js";

export class CreateAcademicYearDto {
  @IsString() @Length(2, 40) name!: string;
  @Type(() => Date) @IsDate() startDate!: Date;
  @Type(() => Date) @IsDate() endDate!: Date;
}
export class CreateClassDto {
  @IsMongoId() academicYearId!: string;
  @IsIn(GRADES) grade!: (typeof GRADES)[number];
  @IsString() @Length(1, 20) section!: string;
}
export class UserIdsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @IsMongoId({ each: true })
  userIds!: string[];
}
export class CreateAssignmentDto {
  @IsMongoId() assessmentId!: string;
  @IsIn(ASSIGNMENT_TARGET_TYPES)
  targetType!: (typeof ASSIGNMENT_TARGET_TYPES)[number];
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsMongoId({ each: true })
  targetIds!: string[];
  @IsOptional() @Type(() => Date) @IsDate() dueDate?: Date;
}
