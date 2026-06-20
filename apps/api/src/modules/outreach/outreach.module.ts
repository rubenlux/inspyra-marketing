import { Module } from '@nestjs/common';
import { OutreachController } from './outreach.controller';
import { MailWebhookController } from './mail-webhook.controller';
import { OutreachService } from './outreach.service';
import { DatabaseModule } from '../../database/database.module';
import { ProposalsModule } from '../proposals/proposals.module';

@Module({
  imports: [DatabaseModule, ProposalsModule],
  controllers: [OutreachController, MailWebhookController],
  providers: [OutreachService],
})
export class OutreachModule {}
