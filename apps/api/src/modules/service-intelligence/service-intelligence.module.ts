import { Module } from '@nestjs/common';
import { ServiceIntelligenceService } from './service-intelligence.service';
import { ServiceIntelligenceController } from './service-intelligence.controller';

@Module({
  providers: [ServiceIntelligenceService],
  controllers: [ServiceIntelligenceController],
  exports: [ServiceIntelligenceService],
})
export class ServiceIntelligenceModule {}
