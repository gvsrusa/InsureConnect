import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Length,
  Min
} from "class-validator";

const COVERAGE_TYPES = ["AUTO", "HOME", "COMMERCIAL"] as const;
type CoverageType = (typeof COVERAGE_TYPES)[number];

export class CreateQuoteRequestDto {
  @IsString()
  @IsNotEmpty()
  businessName!: string;

  @IsString()
  @IsIn(COVERAGE_TYPES)
  coverageType!: CoverageType;

  @IsString()
  @Length(2, 2)
  state!: string;

  @IsInt()
  @Min(1)
  annualRevenue!: number;
}
