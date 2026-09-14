import { IsIn, IsOptional, IsString, Length } from "class-validator";
export class ProfileDto {
  @IsOptional() @IsString() @Length(2, 60) firstName?: string;
  @IsOptional() @IsString() @Length(1, 60) lastName?: string;
  @IsOptional() @IsIn(["en", "hi"]) preferredLanguage?: "en" | "hi";
}
