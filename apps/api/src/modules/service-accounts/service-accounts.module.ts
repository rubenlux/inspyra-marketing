import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ServiceAccountsService } from './service-accounts.service';
import { ServiceAccountsController } from './service-accounts.controller';

@Module({
  imports: [ConfigModule, JwtModule.register({})],
  providers: [ServiceAccountsService],
  controllers: [ServiceAccountsController],
  exports: [ServiceAccountsService],
})
export class ServiceAccountsModule {}
