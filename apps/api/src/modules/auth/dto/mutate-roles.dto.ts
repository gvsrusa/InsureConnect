import { UserRole } from "@prisma/client";
import { ArrayMinSize, IsArray, IsIn } from "class-validator";

const MUTABLE_ROLES: UserRole[] = [
  UserRole.CUSTOMER,
  UserRole.AGENT,
  UserRole.PARTNER_UNDERWRITER,
  UserRole.PARTNER_VIEWER
];

export class MutateRolesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(MUTABLE_ROLES, { each: true })
  roles!: UserRole[];
}
