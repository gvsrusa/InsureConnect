import { IsNotEmpty, IsString } from "class-validator";

export class BindPolicyDto {
  @IsString()
  @IsNotEmpty()
  quoteRequestId!: string;

  @IsString()
  @IsNotEmpty()
  quoteId!: string;
}
