import { BadRequestException, Logger } from '@nestjs/common';

export interface MailApiSendResult {
  messageId: string;
  sesMessageId: string | null;
}

export class MailApiClient {
  private readonly logger = new Logger(MailApiClient.name);

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly defaultFrom: string,
  ) {}

  async send(params: {
    to: string;
    subject: string;
    html: string;
    externalReference?: string;
    externalType?: string;
  }): Promise<MailApiSendResult> {
    // MAIL_API_URL is the full send endpoint: https://api.inspyra.cloud/v1/public/mail/send
    const url = this.baseUrl;

    const body: Record<string, any> = {
      from: this.defaultFrom,
      to: params.to,
      subject: params.subject,
      html: params.html,
    };
    if (params.externalReference) body.externalReference = params.externalReference;
    if (params.externalType) body.externalType = params.externalType;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      this.logger.error({ err, to: params.to }, '[MailApiClient] Network error');
      throw new BadRequestException('Error de red al contactar INSPYRA Mail: ' + (err as Error).message);
    }

    const data = await response.json().catch(() => ({})) as any;

    if (!response.ok) {
      const msg = data?.error ?? data?.message ?? `HTTP ${response.status}`;
      this.logger.warn({ status: response.status, msg, to: params.to }, '[MailApiClient] Send rejected');
      throw new BadRequestException(`INSPYRA Mail rechazó el envío: ${msg}`);
    }

    // Accept any 2xx — extract ID from common response shapes
    const messageId: string =
      data?.messageId ?? data?.id ?? data?.data?.id ?? `sent-${Date.now()}`;

    if (!data?.messageId && !data?.id) {
      this.logger.warn({ data, to: params.to }, '[MailApiClient] OK but no messageId in response — using fallback');
    }

    return {
      messageId,
      sesMessageId: data?.sesMessageId ?? null,
    };
  }
}

export function createMailApiClient(fromOverride?: string): MailApiClient {
  const baseUrl = process.env.MAIL_API_URL;
  const apiKey  = process.env.MAIL_API_KEY;
  const from    = fromOverride ?? process.env.MAIL_API_FROM ?? '"Inspyra Servicios" <contacto@inspyra.cloud>';

  if (!baseUrl) throw new BadRequestException('MAIL_API_URL no está configurado en el servidor');
  if (!apiKey)  throw new BadRequestException('MAIL_API_KEY no está configurado en el servidor');

  return new MailApiClient(baseUrl, apiKey, from);
}
