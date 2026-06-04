import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateValidationDto } from './dto/create-validation.dto';
import { ReviewValidationDto } from './dto/review-validation.dto';

@Injectable()
export class ProspectValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateValidationDto) {
    const prospect = await this.prisma.prospect.findFirst({
      where: { id: dto.prospectId, tenantId, deletedAt: null },
    });
    if (!prospect) throw new NotFoundException('Prospect not found');

    const existing = await this.prisma.prospectValidation.findUnique({
      where: { prospectId: dto.prospectId },
    });
    if (existing) throw new ConflictException('Validation already exists for this prospect');

    return this.prisma.prospectValidation.create({
      data: {
        tenantId,
        prospectId: dto.prospectId,
        agentScore: dto.agentScore,
        servicesRecommended: dto.servicesRecommended,
        estimatedTicketUsd: dto.estimatedTicketUsd,
        prioridad: dto.prioridad,
        reasoning: dto.reasoning,
      },
    });
  }

  async findAll(tenantId: string, status?: string) {
    return this.prisma.prospectValidation.findMany({
      where: { tenantId, ...(status ? { status: status as never } : {}) },
      include: {
        prospect: {
          select: {
            id: true, nombreEmpresa: true, ciudad: true, pais: true,
            problemasEncontrados: true, score: true, estado: true,
          },
        },
        validator: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const v = await this.prisma.prospectValidation.findFirst({
      where: { id, tenantId },
      include: {
        prospect: { select: { id: true, nombreEmpresa: true, problemasEncontrados: true, score: true } },
        validator: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!v) throw new NotFoundException('Validation not found');
    return v;
  }

  async review(id: string, tenantId: string, reviewerId: string, dto: ReviewValidationDto) {
    const v = await this.findOne(id, tenantId);

    // When human validates, sync the score back to the prospect for pipeline accuracy
    if (dto.status === 'VALIDATED') {
      await this.prisma.prospect.update({
        where: { id: v.prospectId },
        data: { score: dto.humanScore },
      });
    }

    return this.prisma.prospectValidation.update({
      where: { id },
      data: {
        humanScore: dto.humanScore,
        status: dto.status,
        notes: dto.notes,
        validatedBy: reviewerId,
        validatedAt: new Date(),
      },
    });
  }

  async getScoreDrift(tenantId: string) {
    const validated = await this.prisma.prospectValidation.findMany({
      where: { tenantId, status: 'VALIDATED', humanScore: { not: null } },
      select: { agentScore: true, humanScore: true, prioridad: true },
    });

    if (validated.length === 0) return { count: 0, avgDrift: 0, overestimated: 0, underestimated: 0 };

    const drifts = validated.map((v) => v.agentScore - (v.humanScore ?? 0));
    const avgDrift = drifts.reduce((a, b) => a + b, 0) / drifts.length;
    const overestimated = drifts.filter((d) => d > 10).length;
    const underestimated = drifts.filter((d) => d < -10).length;

    return {
      count: validated.length,
      avgDrift: Math.round(avgDrift * 10) / 10,
      overestimated,
      underestimated,
      accurateCount: validated.length - overestimated - underestimated,
    };
  }
}
