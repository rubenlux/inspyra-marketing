import { IsUUID } from 'class-validator';

export class CreateEnrichmentJobDto {
  @IsUUID()
  prospectId: string;
}
