import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ValidationStatus } from '@prisma/client';

export class ReviewValidationDto {
  @IsInt()
  @Min(0)
  @Max(100)
  humanScore: number;

  @IsEnum(ValidationStatus)
  status: ValidationStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
