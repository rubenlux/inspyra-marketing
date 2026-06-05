import { IsIn, IsOptional, IsString } from 'class-validator';

export class SuggestEnrichmentDto {
  @IsIn(['SUGGEST_APPROVE', 'SUGGEST_REJECT'])
  recommendedStatus: 'SUGGEST_APPROVE' | 'SUGGEST_REJECT';

  @IsOptional()
  @IsString()
  notes?: string;
}
