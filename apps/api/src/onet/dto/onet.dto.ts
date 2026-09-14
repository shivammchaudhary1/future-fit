import { Transform } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsString,
  Length,
  Max,
  Min,
  Matches,
} from "class-validator";
import {
  ONET_ANSWER_COUNT,
  ONET_CAREER_TOPICS,
  ONET_MAX_ANSWER,
  ONET_MIN_ANSWER,
} from "../onet.constants.js";

export class InterestAnswersDto {
  @IsArray()
  @ArrayMinSize(ONET_ANSWER_COUNT)
  @ArrayMaxSize(ONET_ANSWER_COUNT)
  @IsInt({ each: true })
  @Min(ONET_MIN_ANSWER, { each: true })
  @Max(ONET_MAX_ANSWER, { each: true })
  answers!: number[];
}

export class CareerSearchDto {
  @IsString() @Length(2, 100) keyword!: string;
  @Transform(({ value }) => Number(value)) @IsInt() @Min(1) start = 1;
  @Transform(({ value }) => Number(value)) @IsInt() @Min(1) @Max(100) end = 20;
}

export class CareerTopicDto {
  @Matches(/^\d{2}-\d{4}\.\d{2}$/) code!: string;
  @IsIn(ONET_CAREER_TOPICS) topic!: (typeof ONET_CAREER_TOPICS)[number];
}
