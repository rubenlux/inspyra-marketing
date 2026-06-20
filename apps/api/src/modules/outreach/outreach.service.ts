import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ContactChannel, ProspectEstado, ResponseType } from '@prisma/client';
import { createMailApiClient } from './mail-api.client';
import { ProposalsService, ReplyAgentResult } from '../proposals/proposals.service';

const CONTACTABLE_FROM: ProspectEstado[] = ['LISTO_OUTREACH'];
const RESPOND_FROM: ProspectEstado[] = ['CONTACTADO'];
const INTERESTED_FROM: ProspectEstado[] = ['RESPONDIO'];
const LOST_FROM: ProspectEstado[] = ['CONTACTADO', 'RESPONDIO', 'INTERESADO'];
const SCHEDULE_FROM: ProspectEstado[] = ['CONTACTADO', 'RESPONDIO', 'INTERESADO'];
const ACTIVITY_STATES: ProspectEstado[] = [
  'LISTO_OUTREACH', 'CONTACTADO', 'RESPONDIO', 'INTERESADO', 'REUNION_AGENDADA', 'PASO_A_PIPELINE', 'CONVERTIDO',
];

@Injectable()
export class OutreachService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly proposalsService: ProposalsService,
  ) {}

  // ── Contact ───────────────────────────────────────────────────────────────────

  async contact(
    prospectId: string,
    tenantId: string,
    userId: string,
    channel: ContactChannel,
    note?: string,
  ) {
    const prospect = await this.findProspect(prospectId, tenantId);
    if (!CONTACTABLE_FROM.includes(prospect.estado)) {
      throw new BadRequestException(
        `El prospecto debe estar en LISTO_OUTREACH para marcar como contactado (actual: ${prospect.estado})`,
      );
    }

    const now = new Date();
    const [updated] = await this.prisma.$transaction([
      this.prisma.prospect.update({
        where: { id: prospectId },
        data: { estado: 'CONTACTADO', contactedAt: now, contactChannel: channel, ultimoContacto: now },
      }),
      this.prisma.outreachActivity.create({
        data: { tenantId, prospectId, type: 'CONTACTADO', channel, note: note ?? null, createdById: userId },
      }),
    ]);
    return updated;
  }

  // ── Respond ───────────────────────────────────────────────────────────────────

  async respond(
    prospectId: string,
    tenantId: string,
    userId: string,
    note?: string,
    responseType?: ResponseType,
    mensajeUtilizado?: string,
    proposalId?: string,
  ) {
    const prospect = await this.findProspect(prospectId, tenantId);
    if (!RESPOND_FROM.includes(prospect.estado)) {
      throw new BadRequestException(
        `El prospecto debe estar en CONTACTADO para marcar como respondió (actual: ${prospect.estado})`,
      );
    }

    const now = new Date();
    const [updated] = await this.prisma.$transaction([
      this.prisma.prospect.update({
        where: { id: prospectId },
        data: { estado: 'RESPONDIO', ultimoContacto: now },
      }),
      this.prisma.outreachActivity.create({
        data: {
          tenantId, prospectId, type: 'RESPONDIO',
          note: note ?? null, createdById: userId,
          responseType: responseType ?? null,
          mensajeUtilizado: mensajeUtilizado ?? null,
          proposalId: proposalId ?? null,
        },
      }),
    ]);
    return updated;
  }

  // ── Mark Interested ───────────────────────────────────────────────────────────

  async markInterested(
    prospectId: string,
    tenantId: string,
    userId: string,
    note?: string,
    mensajeUtilizado?: string,
    proposalId?: string,
  ) {
    const prospect = await this.findProspect(prospectId, tenantId);
    if (!INTERESTED_FROM.includes(prospect.estado)) {
      throw new BadRequestException(
        `El prospecto debe estar en RESPONDIO para marcar como interesado (actual: ${prospect.estado})`,
      );
    }

    const now = new Date();
    const [updated] = await this.prisma.$transaction([
      this.prisma.prospect.update({
        where: { id: prospectId },
        data: { estado: 'INTERESADO', ultimoContacto: now },
      }),
      this.prisma.outreachActivity.create({
        data: {
          tenantId, prospectId, type: 'INTERESADO',
          responseType: 'INTERESADO',
          note: note ?? null, createdById: userId,
          mensajeUtilizado: mensajeUtilizado ?? null,
          proposalId: proposalId ?? null,
        },
      }),
    ]);
    return updated;
  }

  // ── Mark Lost ─────────────────────────────────────────────────────────────────

  async markLost(
    prospectId: string,
    tenantId: string,
    userId: string,
    responseType: ResponseType,
    note?: string,
  ) {
    const prospect = await this.findProspect(prospectId, tenantId);
    if (!LOST_FROM.includes(prospect.estado)) {
      throw new BadRequestException(
        `Estado inválido para marcar como perdido (actual: ${prospect.estado})`,
      );
    }

    const now = new Date();
    const [updated] = await this.prisma.$transaction([
      this.prisma.prospect.update({
        where: { id: prospectId },
        data: { estado: 'DESCARTADO', ultimoContacto: now },
      }),
      this.prisma.outreachActivity.create({
        data: {
          tenantId, prospectId, type: 'PERDIDO',
          responseType, note: note ?? null, createdById: userId,
        },
      }),
    ]);
    return updated;
  }

  // ── No Response ───────────────────────────────────────────────────────────────

  async noResponse(prospectId: string, tenantId: string, userId: string, note?: string) {
    const prospect = await this.findProspect(prospectId, tenantId);
    if (!ACTIVITY_STATES.includes(prospect.estado)) {
      throw new BadRequestException(`Estado inválido para registrar seguimiento: ${prospect.estado}`);
    }

    await this.prisma.outreachActivity.create({
      data: {
        tenantId, prospectId, type: 'SIN_RESPUESTA',
        note: note ?? null, createdById: userId,
      },
    });
    return { ok: true };
  }

  // ── Schedule Meeting ──────────────────────────────────────────────────────────

  async scheduleMeeting(prospectId: string, tenantId: string, userId: string, note?: string, proposalId?: string) {
    const prospect = await this.findProspect(prospectId, tenantId);
    if (!SCHEDULE_FROM.includes(prospect.estado)) {
      throw new BadRequestException(
        `El prospecto debe estar en CONTACTADO, RESPONDIO o INTERESADO para agendar reunión (actual: ${prospect.estado})`,
      );
    }

    const now = new Date();
    const [updated] = await this.prisma.$transaction([
      this.prisma.prospect.update({
        where: { id: prospectId },
        data: { estado: 'REUNION_AGENDADA', ultimoContacto: now },
      }),
      this.prisma.outreachActivity.create({
        data: { tenantId, prospectId, type: 'REUNION_AGENDADA', note: note ?? null, createdById: userId, proposalId: proposalId ?? null },
      }),
    ]);
    return updated;
  }

  // ── Add Note ──────────────────────────────────────────────────────────────────

  async addNote(prospectId: string, tenantId: string, userId: string, note: string) {
    await this.findProspect(prospectId, tenantId);
    return this.prisma.outreachActivity.create({
      data: { tenantId, prospectId, type: 'NOTA', note, createdById: userId },
    });
  }

  // ── Activities ────────────────────────────────────────────────────────────────

  async getActivities(prospectId: string, tenantId: string) {
    await this.findProspect(prospectId, tenantId);
    return this.prisma.outreachActivity.findMany({
      where: { prospectId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Funnel Metrics ────────────────────────────────────────────────────────────

  async getFunnel(tenantId: string) {
    const [listoOutreach, contactado, respondio, interesado, reunionAgendada, convertido] = await Promise.all([
      this.prisma.prospect.count({ where: { tenantId, deletedAt: null, estado: 'LISTO_OUTREACH' } }),
      this.prisma.prospect.count({ where: { tenantId, deletedAt: null, estado: 'CONTACTADO' } }),
      this.prisma.prospect.count({ where: { tenantId, deletedAt: null, estado: 'RESPONDIO' } }),
      this.prisma.prospect.count({ where: { tenantId, deletedAt: null, estado: 'INTERESADO' } }),
      this.prisma.prospect.count({ where: { tenantId, deletedAt: null, estado: 'REUNION_AGENDADA' } }),
      this.prisma.prospect.count({ where: { tenantId, deletedAt: null, estado: 'CONVERTIDO' } }),
    ]);
    return { listoOutreach, contactado, respondio, interesado, reunionAgendada, convertido };
  }

  // ── Send Email ────────────────────────────────────────────────────────────────

  async sendEmail(
    prospectId: string,
    tenantId: string,
    userId: string,
    subject: string,
    proposalId?: string,
    note?: string,
  ) {
    const prospect = await this.findProspect(prospectId, tenantId);

    if (!CONTACTABLE_FROM.includes(prospect.estado)) {
      throw new BadRequestException(
        `El prospecto debe estar en LISTO_OUTREACH para enviar email (actual: ${prospect.estado})`,
      );
    }

    // Email lives in enrichmentResult (authoritative) with fallback to prospect.email
    const enrichmentResult = await this.prisma.enrichmentResult.findFirst({
      where: { prospectId, tenantId },
    });
    const recipientEmail = enrichmentResult?.email ?? prospect.email;

    if (!recipientEmail) {
      throw new BadRequestException(
        'El prospecto no tiene email registrado (ni en el perfil ni en el resultado de enriquecimiento)',
      );
    }

    // Load outreachMessage from approved OUTREACH proposal
    const proposal = proposalId
      ? await this.prisma.proposal.findFirst({ where: { id: proposalId, tenantId } })
      : await this.prisma.proposal.findFirst({
          where: { tenantId, prospectId, status: 'APPROVED', proposalType: 'OUTREACH' },
          orderBy: { version: 'desc' },
        });

    if (!proposal) throw new BadRequestException('No hay propuesta de outreach aprobada para este prospecto');

    const outreachMessage: string | undefined = (proposal.proposalData as any)?.outreachMessage;
    if (!outreachMessage) throw new BadRequestException('La propuesta no contiene outreachMessage');

    const htmlBody = outreachMessage
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => `<p style="margin:0 0 12px">${line}</p>`)
      .join('');

    // Send via MAIL-001 API — only transition to CONTACTADO on confirmed delivery (messageId present)
    const mailClient = createMailApiClient();
    const mailResult = await mailClient.send({
      to: recipientEmail,
      subject,
      html: `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:600px">${htmlBody}</div>`,
      externalReference: prospectId,
      externalType: 'PROSPECT_OUTREACH',
    });

    const now = new Date();
    const [updated] = await this.prisma.$transaction([
      this.prisma.prospect.update({
        where: { id: prospectId },
        data: { estado: 'CONTACTADO', contactedAt: now, contactChannel: 'EMAIL', ultimoContacto: now },
      }),
      this.prisma.outreachActivity.create({
        data: {
          tenantId, prospectId, type: 'CONTACTADO', channel: 'EMAIL',
          note: note ?? null, createdById: userId,
          mensajeUtilizado: outreachMessage,
          proposalId: proposal.id,
          provider: 'MAIL_001',
          messageId: mailResult.messageId,
          providerMessageId: mailResult.sesMessageId ?? null,
          fechaEnvio: now,
        },
      }),
    ]);
    return updated;
  }

  // ── Send Free Email (no prospectId — Inspyra Mail libre) ─────────────────────

  async sendFreeEmail(
    to: string,
    subject: string,
    body: string,
    from?: string,
    bodyHtml?: string,
  ): Promise<{ messageId: string }> {
    const htmlBody = bodyHtml ?? body
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => `<p style="margin:0 0 12px">${line}</p>`)
      .join('');

    const mailClient = createMailApiClient(from);
    const result = await mailClient.send({
      to,
      subject,
      html: `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:600px">${htmlBody}</div>`,
    });
    return { messageId: result.messageId };
  }

  // ── Sent Emails — ERP-native view ────────────────────────────────────────────

  async getSentEmails(tenantId: string) {
    const activities = await this.prisma.outreachActivity.findMany({
      where: {
        tenantId,
        channel: 'EMAIL',
        type: { in: ['CONTACTADO', 'FOLLOWUP_1', 'FOLLOWUP_2', 'FOLLOWUP_3'] as any },
      },
      include: {
        prospect: { select: { nombreEmpresa: true, nombreContacto: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      items: activities.map(a => ({
        id: a.id,
        prospectId: a.prospectId,
        to: (a.prospect as any)?.email ?? '',
        toName: (a.prospect as any)?.nombreContacto ?? (a.prospect as any)?.nombreEmpresa ?? '',
        empresa: (a.prospect as any)?.nombreEmpresa ?? '',
        subject: `Outreach — ${(a.prospect as any)?.nombreEmpresa ?? a.prospectId}`,
        preview: a.mensajeUtilizado ? a.mensajeUtilizado.substring(0, 100) : (a.note ?? ''),
        mensajeUtilizado: a.mensajeUtilizado ?? null,
        sentAt: (a.fechaEnvio ?? a.createdAt).toISOString(),
        type: a.type,
        messageId: a.messageId ?? null,
      })),
    };
  }

  // ── Mail Draft CRUD (ERP-044A) ────────────────────────────────────────────────

  async createMailDraft(body: {
    to: string;
    subject: string;
    html: string;
    externalRef?: string;
  }): Promise<any> {
    return this.mailFetch('/v1/public/mail/drafts', {}, 'POST', body);
  }

  async getMailDrafts(): Promise<any> {
    return this.mailFetch('/v1/public/mail/drafts');
  }

  async sendMailDraft(
    draftId: string,
    tenantId: string,
    userId: string,
    prospectId?: string,
  ): Promise<any> {
    const result = await this.mailFetch(`/v1/public/mail/drafts/${draftId}/send`, {}, 'POST', {});

    if (prospectId) {
      const prospect = await this.prisma.prospect.findFirst({
        where: { id: prospectId, tenantId, deletedAt: null },
      });
      if (prospect) {
        const existingFollowUps = await this.prisma.outreachActivity.count({
          where: { tenantId, prospectId, type: { in: ['FOLLOWUP_1', 'FOLLOWUP_2', 'FOLLOWUP_3'] } },
        });
        const followUpType =
          existingFollowUps === 0 ? 'FOLLOWUP_1' :
          existingFollowUps === 1 ? 'FOLLOWUP_2' : 'FOLLOWUP_3';

        await this.prisma.outreachActivity.create({
          data: {
            tenantId,
            prospectId,
            type: followUpType as any,
            channel: 'EMAIL',
            note: `Follow-up enviado (draft ${draftId})`,
            createdById: userId,
            provider: 'MAIL_DRAFT',
            messageId: result?.sesMessageId ?? draftId,
            fechaEnvio: new Date(),
          },
        });
      }
    }

    return result;
  }

  async deleteMailDraft(draftId: string): Promise<void> {
    await this.mailFetch(`/v1/public/mail/drafts/${draftId}`, {}, 'DELETE');
  }

  // ── Mailbox Management ────────────────────────────────────────────────────────

  async getMailboxes(): Promise<any> {
    return this.mailFetch('/v1/public/mail/mailboxes');
  }

  async createMailbox(body: { localPart: string; quotaMB?: number }): Promise<any> {
    return this.mailFetch('/v1/public/mail/mailboxes', {}, 'POST', body);
  }

  async deleteMailbox(email: string): Promise<void> {
    await this.mailFetch(`/v1/public/mail/mailboxes/${encodeURIComponent(email)}`, {}, 'DELETE');
  }

  async resetMailboxPassword(email: string): Promise<any> {
    return this.mailFetch(`/v1/public/mail/mailboxes/${encodeURIComponent(email)}/reset-password`, {}, 'POST');
  }

  // ── Mail Read Proxy ───────────────────────────────────────────────────────────

  private readonly logger = new Logger(OutreachService.name);

  async getMailFolders(email: string): Promise<any> {
    return this.mailFetch(`/v1/public/mail/folders?email=${encodeURIComponent(email)}`);
  }

  async getMailMessages(email: string, folder: string, limit: number, offset = 0): Promise<any> {
    return this.mailFetch(
      `/v1/public/mail/messages?email=${encodeURIComponent(email)}&folder=${encodeURIComponent(folder)}&limit=${limit}&offset=${offset}`,
    );
  }

  async getMailMessage(uid: number, email: string, folder: string): Promise<any> {
    return this.mailFetch(
      `/v1/public/mail/messages/${uid}?email=${encodeURIComponent(email)}&folder=${encodeURIComponent(folder)}`,
    );
  }

  private async mailFetch(
    path: string,
    extraHeaders: Record<string, string> = {},
    method = 'GET',
    body?: unknown,
  ): Promise<any> {
    const base = this.getMailApiBase();
    const apiKey = process.env.MAIL_API_KEY;
    if (!apiKey) throw new BadRequestException('MAIL_API_KEY no está configurado');

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    };
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    let response: Response;
    try {
      response = await fetch(`${base}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      throw new BadRequestException('Error de red al contactar INSPYRA Mail: ' + (err as Error).message);
    }

    if (response.status === 204) return null;

    const text = await response.text().catch(() => '');
    if (!response.ok) {
      this.logger.warn(`[Mail proxy] ${method} ${response.status} ${path} — ${text.substring(0, 200)}`);
      throw new BadRequestException(`INSPYRA Mail ${response.status}: ${text.substring(0, 120)}`);
    }

    if (!text) return null;
    try { return JSON.parse(text); } catch { return { raw: text }; }
  }

  private getMailApiBase(): string {
    const url = process.env.MAIL_API_URL ?? 'https://api.inspyra.cloud/v1/public/mail/send';
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      return 'https://api.inspyra.cloud';
    }
  }

  // ── Mail Webhook — MAIL-002 (full autonomous conversation flow) ──────────────

  async handleMailWebhook(event: string, data: any): Promise<void> {
    if (event !== 'mail.reply_received') return;

    const prospectId: string | undefined = data?.externalReference ?? data?.correlationId;
    if (!prospectId) {
      this.logger.warn('[MAIL-002] mail.reply_received: no externalReference/correlationId');
      return;
    }

    const prospect = await this.prisma.prospect.findFirst({
      where: { id: prospectId, deletedAt: null },
    });
    if (!prospect) {
      this.logger.warn(`[MAIL-002] prospect ${prospectId} not found`);
      return;
    }

    const processableStates: ProspectEstado[] = ['CONTACTADO', 'RESPONDIO', 'INTERESADO'];
    if (!processableStates.includes(prospect.estado)) {
      this.logger.log(`[MAIL-002] prospect ${prospectId} in ${prospect.estado} — skip`);
      return;
    }

    const replyText: string = data?.text ?? data?.body ?? data?.bodyText ?? '';
    const fromEmail: string = data?.from ?? '';
    const subject: string = data?.subject ?? '';
    const messageId: string | null = data?.messageId ?? null;
    const now = new Date();

    // Step 1: Record incoming reply + transition CONTACTADO → RESPONDIO
    const nextEstado: ProspectEstado = prospect.estado === 'CONTACTADO' ? 'RESPONDIO' : prospect.estado;
    await this.prisma.$transaction([
      this.prisma.prospect.update({
        where: { id: prospect.id },
        data: { estado: nextEstado, ultimoContacto: now },
      }),
      this.prisma.outreachActivity.create({
        data: {
          tenantId: prospect.tenantId,
          prospectId: prospect.id,
          type: 'RESPUESTA_RECIBIDA',
          channel: 'EMAIL',
          note: replyText
            ? `Respuesta de ${fromEmail}:\n\n${replyText.slice(0, 1000)}`
            : `Respuesta de ${fromEmail} (sin cuerpo de texto)`,
          provider: 'MAIL_WEBHOOK',
          messageId,
          fechaEnvio: now,
        },
      }),
    ]);
    this.logger.log(`[MAIL-002] ${prospectId} → ${nextEstado}`);

    // Step 2: Escalation check — human review required for negotiation/legal/complaints
    if (this.requiresEscalation(replyText)) {
      await this.prisma.outreachActivity.create({
        data: {
          tenantId: prospect.tenantId,
          prospectId: prospect.id,
          type: 'NOTA',
          note: '⚠️ Escalación requerida — respuesta contiene negociación de precios, temas legales o reclamos. Revisión humana antes de responder.',
          fechaEnvio: now,
        },
      });
      this.logger.warn(`[MAIL-002] ${prospectId} → escalation required`);
      return;
    }

    if (!replyText) {
      this.logger.log(`[MAIL-002] ${prospectId} — empty reply body, no auto-reply`);
      return;
    }

    // Step 3: Run Reply Agent
    let replyResult: ReplyAgentResult;
    try {
      replyResult = await this.proposalsService.runReplyAgent(
        prospect.id,
        prospect.tenantId,
        replyText,
      );
    } catch (err) {
      this.logger.error(`[MAIL-002] Reply Agent failed for ${prospectId}: ${(err as Error).message}`);
      await this.prisma.outreachActivity.create({
        data: {
          tenantId: prospect.tenantId,
          prospectId: prospect.id,
          type: 'NOTA',
          note: `Reply Agent falló — respuesta recibida de ${fromEmail} pendiente de respuesta manual.`,
          fechaEnvio: now,
        },
      });
      return;
    }

    const { intentAnalysis, followUpMessage, recommendedAction, prospectIntel } = replyResult;
    this.logger.log(`[MAIL-002] ${prospectId} — intent: ${intentAnalysis} | action: ${recommendedAction}`);

    // Step 4: Store prospect intel extracted from the reply
    if (prospectIntel) {
      await this.storeProspectIntel(prospect.tenantId, prospect.id, prospectIntel, now);
    }

    // Step 5: Auto-send or escalate to human draft
    const AUTO_SEND_INTENTS: ReplyAgentResult['intentAnalysis'][] = ['POSITIVE', 'NEUTRAL', 'NOT_NOW'];

    if (AUTO_SEND_INTENTS.includes(intentAnalysis) && followUpMessage) {
      await this.autoSendReply(prospect, fromEmail, subject, followUpMessage, intentAnalysis, recommendedAction, now);
    } else {
      // OBJECTION / NEGATIVE / agent unsure → draft for human review
      await this.prisma.outreachActivity.create({
        data: {
          tenantId: prospect.tenantId,
          prospectId: prospect.id,
          type: 'NOTA',
          note: `Reply Agent [${intentAnalysis}] — draft para revisión humana:\n\n${followUpMessage}`,
          fechaEnvio: now,
        },
      });
      this.logger.log(`[MAIL-002] ${prospectId} → ${intentAnalysis} — draft created, awaiting human review`);
    }
  }

  // ── MAIL-002 Helpers ──────────────────────────────────────────────────────────

  private requiresEscalation(text: string): boolean {
    if (!text) return false;
    return /precio|presupuesto|cotizaci[oó]n|descuento|contrato|cl[aá]usula|legal|reclamo|demanda|factura|cobro|pago\s+a\s+cuenta|comisi[oó]n|penalidad|reembolso|price|quote|discount|contract|legal|dispute|complaint|invoice|billing|refund|lawsuit/i.test(text);
  }

  private async autoSendReply(
    prospect: { id: string; tenantId: string; estado: ProspectEstado },
    toEmail: string,
    originalSubject: string,
    followUpMessage: string,
    intent: string,
    recommendedAction: string,
    now: Date,
  ) {
    const subject = originalSubject.toLowerCase().startsWith('re:')
      ? originalSubject
      : `Re: ${originalSubject}`;

    const html = followUpMessage
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)
      .map(l => `<p style="margin:0 0 12px">${l}</p>`)
      .join('');

    let messageId: string | null = null;
    try {
      const mailClient = createMailApiClient();
      const result = await mailClient.send({
        to: toEmail,
        subject,
        html: `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:600px">${html}</div>`,
        externalReference: prospect.id,
        externalType: 'PROSPECT_REPLY',
      });
      messageId = result.messageId;
      this.logger.log(`[MAIL-002] auto-reply sent to ${toEmail} (${intent}) — msgId: ${messageId}`);
    } catch (err) {
      this.logger.error(`[MAIL-002] auto-send failed for ${prospect.id}: ${(err as Error).message}`);
      // Store as draft note on send failure
      await this.prisma.outreachActivity.create({
        data: {
          tenantId: prospect.tenantId,
          prospectId: prospect.id,
          type: 'NOTA',
          note: `Auto-send falló [${intent}] — envío manual pendiente:\n\n${followUpMessage}`,
          fechaEnvio: now,
        },
      });
      return;
    }

    // Transition to INTERESADO only when prospect explicitly showed buying intent
    // (asked for quote, proposal, or to meet) — NOT just because of POSITIVE sentiment
    const shouldMarkInterested =
      recommendedAction === 'MARK_INTERESTED' || recommendedAction === 'SUGGEST_MEETING';
    const nextEstado: ProspectEstado | null = shouldMarkInterested && prospect.estado !== 'INTERESADO'
      ? 'INTERESADO'
      : null;

    await this.prisma.$transaction([
      ...(nextEstado ? [
        this.prisma.prospect.update({
          where: { id: prospect.id },
          data: { estado: nextEstado, ultimoContacto: now },
        }),
      ] : []),
      this.prisma.outreachActivity.create({
        data: {
          tenantId: prospect.tenantId,
          prospectId: prospect.id,
          type: 'SEGUIMIENTO',
          channel: 'EMAIL',
          note: `Auto-reply [${intent}]${nextEstado ? ` → ${nextEstado}` : ''}: ${followUpMessage.slice(0, 300)}`,
          mensajeUtilizado: followUpMessage,
          messageId,
          fechaEnvio: now,
        },
      }),
    ]);

    if (nextEstado) {
      this.logger.log(`[MAIL-002] ${prospect.id} → ${nextEstado}`);
    }
  }

  private async storeProspectIntel(
    tenantId: string,
    prospectId: string,
    intel: NonNullable<ReplyAgentResult['prospectIntel']>,
    now: Date,
  ) {
    const parts: string[] = [];
    if (intel.budgetTiming)          parts.push(`Timing presupuesto: ${intel.budgetTiming}`);
    if (intel.competitorPresent)     parts.push(`Proveedor actual: ${intel.competitorName ?? 'sí'}`);
    if (intel.painPoint)             parts.push(`Pain point detectado: ${intel.painPoint}`);
    if (intel.contactPreference)     parts.push(`Preferencia de contacto: ${intel.contactPreference}`);
    if (intel.decisionMakerEngaged)  parts.push('Decisor involucrado en la conversación');

    if (parts.length === 0) return;

    await this.prisma.outreachActivity.create({
      data: {
        tenantId,
        prospectId,
        type: 'NOTA',
        note: `Intel extraído por Reply Agent:\n${parts.join('\n')}`,
        fechaEnvio: now,
      },
    });
  }

  // ── Private ───────────────────────────────────────────────────────────────────

  private async findProspect(id: string, tenantId: string) {
    const p = await this.prisma.prospect.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!p) throw new NotFoundException(`Prospecto ${id} no encontrado`);
    return p;
  }
}
