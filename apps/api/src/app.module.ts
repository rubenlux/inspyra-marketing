import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProspectsModule } from './modules/prospects/prospects.module';
import { DealsModule } from './modules/deals/deals.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ServicesModule } from './modules/services/services.module';
import { ServiceCatalogModule } from './modules/service-catalog/service-catalog.module';
import { ServiceIntelligenceModule } from './modules/service-intelligence/service-intelligence.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { ServiceAccountsModule } from './modules/service-accounts/service-accounts.module';
import { AgentRunsModule } from './modules/agent-runs/agent-runs.module';
import { HealthModule } from './modules/health/health.module';
import { ProspectValidationModule } from './modules/prospect-validation/prospect-validation.module';
import { AgentRoiModule } from './modules/agent-roi/agent-roi.module';
import { ResearchModule } from './modules/research/research.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env'],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    ProspectsModule,
    DealsModule,
    ClientsModule,
    ServicesModule,
    ServiceCatalogModule,
    ServiceIntelligenceModule,
    PricingModule,
    ServiceAccountsModule,
    AgentRunsModule,
    HealthModule,
    ProspectValidationModule,
    AgentRoiModule,
    ResearchModule,
  ],
})
export class AppModule {}
