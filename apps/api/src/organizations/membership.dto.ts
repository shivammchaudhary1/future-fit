import { IsEmail, IsIn, IsMongoId } from "class-validator";
export class InviteMemberDto {
  @IsEmail() email!: string;
  @IsIn(["SCHOOL_ADMIN", "TEACHER", "STUDENT"]) role!:
    "SCHOOL_ADMIN" | "TEACHER" | "STUDENT";
}
export class MembershipStatusDto {
  @IsMongoId() userId!: string;
  @IsIn(["ACTIVE", "SUSPENDED"]) status!: "ACTIVE" | "SUSPENDED";
}
