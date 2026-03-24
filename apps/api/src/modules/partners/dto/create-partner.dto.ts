import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min
} from "class-validator";

export class CreatePartnerDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  rateLimitPerMinute?: number;
}
