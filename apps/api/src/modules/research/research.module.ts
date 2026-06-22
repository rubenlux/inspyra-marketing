import { Module } from '@nestjs/common';
import { ResearchController } from './research.controller';
import { ResearchService } from './research.service';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { DatabaseModule } from '../../database/database.module';
import { EvidenceValidator } from './evidence/evidence-validator';
import { SonnetEvaluator } from './evaluation/sonnet-evaluator';
import { ProspectPromoter } from './prospect/prospect-promoter';
import { QualificationSignalsDetector } from './qualification/qualification-signals.detector';
import { ContactAcquisitionService } from './contact/contact-acquisition.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ResearchController, CampaignsController],
  providers: [
    ResearchService,
    CampaignsService,
    EvidenceValidator,
    SonnetEvaluator,
    ProspectPromoter,
    QualificationSignalsDetector,
    ContactAcquisitionService,
  ],
  exports: [ResearchService, CampaignsService],
})
export class ResearchModule {}

