import { IsIn, IsOptional, IsString } from 'class-validator';

export class ReviewEnrichmentDto {
  @IsIn(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  notes?: string;
}
