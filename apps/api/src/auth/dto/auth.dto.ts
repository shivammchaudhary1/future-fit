import {
  IsEmail,
  IsIn,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from "class-validator";

export class RegisterDto {
  @IsString() @Length(2, 60) firstName!: string;
  @IsString() @Length(1, 60) lastName!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) @MaxLength(128) password!: string;
  @IsIn(["en", "hi"]) preferredLanguage: "en" | "hi" = "en";
}

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) @MaxLength(128) password!: string;
}

export class TokenDto {
  @IsString() @MinLength(32) token!: string;
}
export class ForgotPasswordDto {
  @IsEmail() email!: string;
}
export class ResetPasswordDto extends TokenDto {
  @IsString() @MinLength(8) @MaxLength(128) password!: string;
}
export class GoogleAuthDto {
  @IsString() @MinLength(20) credential!: string;
}
