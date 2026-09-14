import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsMongoId,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from "class-validator";
import { PAYMENT_CONFIG } from "./payment.constants.js";
export class ProductDto {
  @IsString() @Length(2, 100) name!: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsMongoId({ each: true })
  assessmentIds!: string[];
  @IsInt() @Min(1) @Max(PAYMENT_CONFIG.maxAmount) amount!: number;
  @IsInt() @Min(1) @Max(PAYMENT_CONFIG.maxDurationDays) durationDays!: number;
}
export class CreateOrderDto {
  @IsMongoId() productId!: string;
  @IsUUID() requestKey!: string;
}
