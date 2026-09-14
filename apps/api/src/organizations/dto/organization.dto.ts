import { Type } from "class-transformer";
import { IsIn, IsString, Length, ValidateNested } from "class-validator";
import { ORGANIZATION_TYPES } from "../organization.constants.js";

class AddressDto {
  @IsString() @Length(2, 80) city!: string;
  @IsString() @Length(2, 80) state!: string;
  @IsString() @Length(2, 80) country!: string;
}
export class CreateOrganizationDto {
  @IsString() @Length(2, 150) name!: string;
  @IsIn(ORGANIZATION_TYPES) type!: (typeof ORGANIZATION_TYPES)[number];
  @IsIn(["CBSE", "ICSE", "STATE", "IB", "OTHER"]) board!: string;
  @ValidateNested() @Type(() => AddressDto) address!: AddressDto;
}
