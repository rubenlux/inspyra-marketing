import { IsUUID } from 'class-validator';

export class GenerateProposalDto {
  @IsUUID()
  prospectId: string;
}
