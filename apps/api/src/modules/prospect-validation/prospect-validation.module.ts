import { Module } from '@nestjs/common';
import { ProspectValidationService } from './prospect-validation.service';
import { ProspectValidationController } from './prospect-validation.controller';

@Module({
  controllers: [ProspectValidationController],
  providers: [ProspectValidationService],
  exports: [ProspectValidationService],
})
export class ProspectValidationModule {}
