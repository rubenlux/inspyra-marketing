import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DealEtapa, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { MoveStageDto } from './dto/move-stage.dto';
import { FilterDealsDto } from './dto/filter-deals.dto';
import { paginate, buildMeta } from '../../common/dto/pagination.dto';

// Stall thresholds in days per stage (ERP-004)
const STALL_DAYS: Record<DealEtapa, number> = {
  NUEVO_INGRESO: 3,
  CONTACTADO: 5,
  DESCUBRIMIENTO: 7,
  REUNION_AGENDADA: 5,
  REUNION_REALIZADA: 5,
  PROPUESTA_PREPARACION: 5,
  PROPUESTA_ENVIADA: 7,
  NEGOCIACION: 10,
  CIERRE_PENDIENTE: 5,
  GANADO: 999,
  PERDIDO: 999,
  PAUSADO: 30,
};

const ACTIVE_STAGES: DealEtapa[] = [
  'NUEVO_INGRESO',
  'CONTACTADO',
  'DESCUBRIMIENTO',
  'REUNION_AGENDADA',
  'REUNION_REALIZADA',
  'PROPUESTA_PREPARACION',
  'PROPUESTA_ENVIADA',
  'NEGOCIACION',
  'CIERRE_PENDIENTE',
  'PAUSADO',
];

@Injectable()
export class DealsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, filters: FilterDealsDto) {
    const { page = 1, limit = 20 } = filters;
    const { skip, take } = paginate(page, limit);

    const where: Prisma.DealWhereInput = { tenantId, deletedAt: null };
    if (filters.etapa) where.etapa = filters.etapa;
    if (filters.servicioInteres) where.servicioInteres = filters.servicioInteres;
    if (filters.temperatura) where.temperatura = filters.temperatura;
    if (filters.ownerId) where.ownerId = filters.ownerId;
    if (filters.estancada !== undefined) where.estancada = Boolean(filters.estancada);

    const [data, total] = await Promise.all([
      this.prisma.deal.findMany({
        where,
        skip,
        take,
        orderBy: [{ valorEstimadoUsd: 'desc' }, { createdAt: 'desc' }],
        include: {
          owner: { select: { id: true, firstName: true, lastName: true } },
          prospect: { select: { id: true, nombreEmpresa: true } },
        },
      }),
      this.prisma.deal.count({ where }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  }

  async getKanban(tenantId: string) {
    const deals = await this.prisma.deal.findMany({
      where: { tenantId, deletedAt: null, etapa: { in: ACTIVE_STAGES } },
      include: { owner: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { valorEstimadoUsd: 'desc' },
    });

    const kanban = Object.fromEntries(ACTIVE_STAGES.map((s) => [s, [] as typeof deals]));
    for (const deal of deals) {
      kanban[deal.etapa].push(deal);
    }
    return kanban;
  }

  async getKpis(tenantId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

    const [
      activeDeals,
      stalled,
      hot,
      wonThisMonth,
      lostThisMonth,
      pipelineValue,
      ratioData,
      avgTime,
    ] = await Promise.all([
      this.prisma.deal.count({ where: { tenantId, etapa: { in: ACTIVE_STAGES }, deletedAt: null } }),
      this.prisma.deal.count({ where: { tenantId, estancada: true, deletedAt: null } }),
      this.prisma.deal.count({
        where: { tenantId, temperatura: 'CALIENTE', etapa: { in: ACTIVE_STAGES }, deletedAt: null },
      }),
      this.prisma.deal.findMany({
        where: { tenantId, etapa: 'GANADO', fechaCierreReal: { gte: startOfMonth }, deletedAt: null },
        select: { valorEstimadoUsd: true },
      }),
      this.prisma.deal.groupBy({
        by: ['motivoPerdida'],
        where: { tenantId, etapa: 'PERDIDO', fechaCierreReal: { gte: startOfMonth }, deletedAt: null },
        _count: true,
      }),
      this.prisma.deal.aggregate({
        where: { tenantId, etapa: { in: ACTIVE_STAGES }, deletedAt: null },
        _sum: { valorEstimadoUsd: true },
        _avg: { valorEstimadoUsd: true },
      }),
      this.prisma.deal.groupBy({
        by: ['etapa'],
        where: { tenantId, etapa: { in: ['GANADO', 'PERDIDO'] }, deletedAt: null },
        _count: true,
      }),
      this.prisma.deal.aggregate({
        where: { tenantId, etapa: 'GANADO', deletedAt: null },
        _avg: { valorEstimadoUsd: true },
      }),
    ]);

    const ganadas = ratioData.find((r) => r.etapa === 'GANADO')?._count || 0;
    const perdidas = ratioData.find((r) => r.etapa === 'PERDIDO')?._count || 0;
    const ratio = ganadas + perdidas > 0 ? Math.round((ganadas / (ganadas + perdidas)) * 100) : 0;

    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const forecastDeals = await this.prisma.deal.findMany({
      where: {
        tenantId,
        deletedAt: null,
        etapa: { notIn: ['GANADO', 'PERDIDO', 'PAUSADO'] },
        fechaEstimadaCierre: { gte: startOfMonth, lt: endOfMonth },
      },
      select: { valorEstimadoUsd: true, probabilidadCierre: true },
    });
    const forecastMensual = [{ forecast: forecastDeals.reduce(
      (sum, d) => sum + Number(d.valorEstimadoUsd) * (d.probabilidadCierre / 100), 0
    )}];

    return {
      totalActivas: activeDeals,
      valorTotalPipeline: Number(pipelineValue._sum.valorEstimadoUsd || 0),
      ticketPromedio: Number(pipelineValue._avg.valorEstimadoUsd || 0),
      forecastMensual: Number(forecastMensual[0]?.forecast || 0),
      estancadas: stalled,
      calientes: hot,
      ganadasEsteMes: wonThisMonth.length,
      valorGanadoEsteMes: wonThisMonth.reduce((s, d) => s + Number(d.valorEstimadoUsd), 0),
      perdidasEsteMes: lostThisMonth.reduce((s, r) => s + r._count, 0),
      motivosPerdida: lostThisMonth,
      ratioCierre: ratio,
    };
  }

  async findOne(id: string, tenantId: string) {
    const deal = await this.prisma.deal.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        prospect: { select: { id: true, nombreEmpresa: true } },
        cliente: { select: { id: true, nombreComercial: true } },
        stageHistory: {
          orderBy: { createdAt: 'desc' },
          include: { movidoPor: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });
    if (!deal) throw new NotFoundException('Deal not found');
    return deal;
  }

  async create(tenantId: string, userId: string, dto: CreateDealDto) {
    return this.prisma.deal.create({
      data: {
        tenantId,
        ownerId: dto.ownerId,
        empresa: dto.empresa,
        contactoNombre: dto.contactoNombre,
        contactoEmail: dto.contactoEmail,
        contactoTelefono: dto.contactoTelefono,
        servicioInteres: dto.servicioInteres,
        valorEstimadoUsd: dto.valorEstimadoUsd || 0,
        probabilidadCierre: dto.probabilidadCierre || 0,
        fechaEstimadaCierre: dto.fechaEstimadaCierre,
        fuenteOrigen: dto.fuenteOrigen || 'PROSPECTS',
        temperatura: dto.temperatura || 'TIBIA',
        urgencia: dto.urgencia || 'MEDIA',
        proximaAccion: dto.proximaAccion,
        proximaAccionAt: dto.proximaAccionAt,
        prospectId: dto.prospectId,
        notasInternas: dto.notasInternas,
      },
    });
  }

  async moveStage(id: string, tenantId: string, userId: string, dto: MoveStageDto) {
    const deal = await this.findOne(id, tenantId);

    if (dto.etapa === 'PERDIDO' && !dto.motivoPerdida) {
      throw new BadRequestException('motivo_perdida is required when closing as PERDIDO');
    }

    if (dto.etapa === 'PERDIDO' && dto.motivoPerdida === 'OTRO' && !dto.notaCierre) {
      throw new BadRequestException('nota_cierre is required when motivo is OTRO');
    }

    const stallThreshold = STALL_DAYS[dto.etapa];
    const diasEnEtapa = Math.floor(
      (Date.now() - deal.ultimoMovimientoAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.dealStageHistory.create({
        data: {
          dealId: id,
          etapaAnterior: deal.etapa,
          etapaNueva: dto.etapa,
          movidoPorId: userId,
          movidoPorTipo: 'HUMAN',
          nota: dto.nota,
        },
      });

      return tx.deal.update({
        where: { id },
        data: {
          etapa: dto.etapa,
          ultimoMovimientoAt: new Date(),
          estancada: false,
          motivoPerdida: dto.motivoPerdida,
          notaCierre: dto.notaCierre,
          fechaCierreReal: ['GANADO', 'PERDIDO'].includes(dto.etapa) ? new Date() : undefined,
        },
      });
    });
  }

  async update(id: string, tenantId: string, data: Partial<CreateDealDto>) {
    await this.findOne(id, tenantId);
    return this.prisma.deal.update({ where: { id }, data });
  }

  async softDelete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.deal.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
