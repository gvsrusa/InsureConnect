import { IsNotEmpty, IsString, IsDateString } from "class-validator";

export class BindPolicyDto {
  @IsString()
  @IsNotEmpty()
  quoteRequestId!: string;

  @IsString()
  @IsNotEmpty()
  quoteId!: string;

  @IsDateString()
  @IsNotEmpty()
  effectiveDate!: string;

  @IsDateString()
  @IsNotEmpty()
  expirationDate!: string;
}
