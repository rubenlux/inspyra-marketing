import * as crypto from 'crypto';
import { Controller, Headers, HttpCode, Logger, Post, Req, UnauthorizedException } from '@nestjs/common';
import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { OutreachService } from './outreach.service';

@Controller('webhooks')
export class MailWebhookController {
  private readonly logger = new Logger(MailWebhookController.name);

  constructor(private readonly outreachService: OutreachService) {}

  @Post('mail')
  @HttpCode(200)
  async handleMail(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-inspyra-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      this.logger.warn('Webhook received without raw body');
      return { ok: true };
    }

    if (!this.verifySignature(rawBody, signature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody.toString());
    } catch {
      this.logger.warn('Webhook: malformed JSON body');
      return { ok: true };
    }

    // Support both { event, data } and { type, ...rest } shapes
    const event: string = payload?.event ?? payload?.type ?? '';
    const data: any = payload?.data ?? payload;

    this.logger.log(`Webhook event: ${event}`);

    await this.outreachService.handleMailWebhook(event, data).catch(err => {
      this.logger.error(`Webhook handler error [${event}]: ${err.message}`);
    });

    return { ok: true };
  }

  private verifySignature(rawBody: Buffer, signature: string): boolean {
    const secret = process.env.WEBHOOK_SECRET;
    if (!secret) {
      this.logger.warn('WEBHOOK_SECRET not configured — skipping signature verification');
      return true;
    }
    if (!signature) return false;

    const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const expected = signature.startsWith('sha256=') ? signature.slice(7) : signature;

    try {
      return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(expected, 'hex'));
    } catch {
      return false;
    }
  }
}
