import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ContactChannel, OutreachActivityType, ProspectEstado } from '@prisma/client';

const CONTACTABLE_FROM: ProspectEstado[] = ['LISTO_OUTREACH'];
const RESPOND_FROM: ProspectEstado[] = ['CONTACTADO'];
const SCHEDULE_FROM: ProspectEstado[] = ['CONTACTADO', 'RESPONDIO'];
const ACTIVITY_STATES: ProspectEstado[] = [
  'LISTO_OUTREACH', 'CONTACTADO', 'RESPONDIO', 'REUNION_AGENDADA', 'PASO_A_PIPELINE', 'CONVERTIDO',
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

  async respond(prospectId: string, tenantId: string, userId: string, note?: string) {
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
        data: { tenantId, prospectId, type: 'RESPONDIO', note: note ?? null, createdById: userId },
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

  async scheduleMeeting(prospectId: string, tenantId: string, userId: string, note?: string) {
    const prospect = await this.findProspect(prospectId, tenantId);
    if (!SCHEDULE_FROM.includes(prospect.estado)) {
      throw new BadRequestException(
        `El prospecto debe estar en CONTACTADO o RESPONDIO para agendar reunión (actual: ${prospect.estado})`,
      );
    }

    const now = new Date();
    const [updated] = await this.prisma.$transaction([
      this.prisma.prospect.update({
        where: { id: prospectId },
        data: { estado: 'REUNION_AGENDADA', ultimoContacto: now },
      }),
      this.prisma.outreachActivity.create({
        data: { tenantId, prospectId, type: 'REUNION_AGENDADA', note: note ?? null, createdById: userId },
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
    const [listoOutreach, contactado, respondio, reunionAgendada, convertido] = await Promise.all([
      this.prisma.prospect.count({ where: { tenantId, deletedAt: null, estado: 'LISTO_OUTREACH' } }),
      this.prisma.prospect.count({ where: { tenantId, deletedAt: null, estado: 'CONTACTADO' } }),
      this.prisma.prospect.count({ where: { tenantId, deletedAt: null, estado: 'RESPONDIO' } }),
      this.prisma.prospect.count({ where: { tenantId, deletedAt: null, estado: 'REUNION_AGENDADA' } }),
      this.prisma.prospect.count({ where: { tenantId, deletedAt: null, estado: 'CONVERTIDO' } }),
    ]);
    return { listoOutreach, contactado, respondio, reunionAgendada, convertido };
  }

  // ── Private ───────────────────────────────────────────────────────────────────

  private async findProspect(id: string, tenantId: string) {
    const p = await this.prisma.prospect.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!p) throw new NotFoundException(`Prospecto ${id} no encontrado`);
    return p;
  }
}
