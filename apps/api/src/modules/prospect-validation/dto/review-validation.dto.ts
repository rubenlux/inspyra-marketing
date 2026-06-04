import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ValidationStatus, RejectionReason } from '@prisma/client';

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

  // Required when status === REJECTED — the learning signal
  @IsOptional()
  @IsEnum(RejectionReason)
  rejectionReason?: RejectionReason;

  @IsOptional()
  @IsString()
  feedbackNotes?: string;
}
