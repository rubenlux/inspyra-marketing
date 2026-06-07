import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ContactChannel, OutreachActivityType, ProspectEstado, ResponseType } from '@prisma/client';

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
  constructor(private readonly prisma: PrismaService) {}

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
    const recipientEmail = prospect.email ?? enrichmentResult?.email;

    if (!recipientEmail) {
      throw new BadRequestException(
        'El prospecto no tiene email registrado (ni en el perfil ni en el resultado de enriquecimiento)',
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new BadRequestException('Email no configurado: RESEND_API_KEY no está definido en el servidor');
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

    const mailFrom = process.env.MAIL_FROM || 'outreach@inspyra.agency';

    const { Resend } = await import('resend');
    const resend = new Resend(resendApiKey);

    const htmlBody = outreachMessage
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => `<p style="margin:0 0 12px">${line}</p>`)
      .join('');

    const { error } = await resend.emails.send({
      from: mailFrom,
      to: recipientEmail,
      subject,
      text: outreachMessage,
      html: `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:600px">${htmlBody}</div>`,
    });

    if (error) {
      throw new BadRequestException(`Error al enviar email: ${(error as any).message ?? JSON.stringify(error)}`);
    }

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
        },
      }),
    ]);
    return updated;
  }

  // ── Private ───────────────────────────────────────────────────────────────────

  private async findProspect(id: string, tenantId: string) {
    const p = await this.prisma.prospect.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!p) throw new NotFoundException(`Prospecto ${id} no encontrado`);
    return p;
  }
}
