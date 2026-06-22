import { Module } from '@nestjs/common';
import { EnrichmentController } from './enrichment.controller';
import { EnrichmentService } from './enrichment.service';
import { PlaywrightAuditService } from './playwright-audit.service';
import { OpportunityEngineService } from './opportunity-engine.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [EnrichmentController],
  providers: [EnrichmentService, PlaywrightAuditService, OpportunityEngineService],
  exports: [EnrichmentService, PlaywrightAuditService, OpportunityEngineService],
})
export class EnrichmentModule {}
