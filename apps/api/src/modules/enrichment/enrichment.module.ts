import { Module } from '@nestjs/common';
import { EnrichmentController } from './enrichment.controller';
import { EnrichmentService } from './enrichment.service';
import { PlaywrightAuditService } from './playwright-audit.service';
import { EnrichmentEvaluatorService } from './enrichment-evaluator.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [EnrichmentController],
  providers: [EnrichmentService, PlaywrightAuditService, EnrichmentEvaluatorService],
  exports: [EnrichmentService, PlaywrightAuditService, EnrichmentEvaluatorService],
})
export class EnrichmentModule {}
