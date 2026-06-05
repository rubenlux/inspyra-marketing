import { Module } from '@nestjs/common';
import { ProspectValidationService } from './prospect-validation.service';
import { ProspectValidationController } from './prospect-validation.controller';
import { ServiceIntelligenceModule } from '../service-intelligence/service-intelligence.module';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [ServiceIntelligenceModule, PricingModule],
  controllers: [ProspectValidationController],
  providers: [ProspectValidationService],
  exports: [ProspectValidationService],
})
export class ProspectValidationModule {}
