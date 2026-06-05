import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ProspectEstado, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateProspectDto } from './dto/create-prospect.dto';
import { UpdateProspectDto } from './dto/update-prospect.dto';
import { FilterProspectsDto } from './dto/filter-prospects.dto';
import { paginate, buildMeta } from '../../common/dto/pagination.dto';

// Valid state transitions — a prospect can never be orphaned
const VALID_TRANSITIONS: Record<ProspectEstado, ProspectEstado[]> = {
  NUEVO: ['INVESTIGADO', 'DESCARTADO', 'ARCHIVADO'],
  INVESTIGADO: ['ENRIQUECIDO', 'DESCARTADO', 'ARCHIVADO'],
  ENRIQUECIDO: ['LISTO_OUTREACH', 'DESCARTADO', 'ARCHIVADO'],
  LISTO_OUTREACH: ['CONTACTADO', 'DESCARTADO', 'ARCHIVADO'],
  CONTACTADO: ['RESPONDIO', 'DESCARTADO', 'ARCHIVADO'],
  RESPONDIO: ['REUNION_AGENDADA', 'PASO_A_PIPELINE', 'DESCARTADO', 'ARCHIVADO'],
  REUNION_AGENDADA: ['PASO_A_PIPELINE', 'DESCARTADO', 'ARCHIVADO'],
  PASO_A_PIPELINE: ['CONVERTIDO', 'DESCARTADO', 'ARCHIVADO'],
  CONVERTIDO: [],
  DESCARTADO: ['ARCHIVADO'],
  ARCHIVADO: ['NUEVO'],
};

@Injectable()
export class ProspectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, filters: FilterProspectsDto) {
    const { page = 1, limit = 20, search, scoreMin, scoreMax, sortBy, ...rest } = filters;
    const { skip, take } = paginate(page, limit);

    const where: Prisma.ProspectWhereInput = {
      tenantId,
      deletedAt: null,
      ...this.buildFilters(rest),
    };

    if (search) {
      where.OR = [
        { nombreEmpresa: { contains: search, mode: 'insensitive' } },
        { nombreContacto: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { ciudad: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (scoreMin !== undefined || scoreMax !== undefined) {
      where.score = {};
      if (scoreMin !== undefined) where.score.gte = scoreMin;
      if (scoreMax !== undefined) where.score.lte = scoreMax;
    }

    const [data, total] = await Promise.all([
      this.prisma.prospect.findMany({
        where,
        skip,
        take,
        orderBy: sortBy === 'createdAt'
          ? [{ createdAt: 'desc' }]
          : [{ score: 'desc' }, { createdAt: 'desc' }],
        include: { owner: { select: { id: true, firstName: true, lastName: true, email: true } } },
      }),
      this.prisma.prospect.count({ where }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  }

  async getKpis(tenantId: string) {
    const [
      total,
      nuevosEstaSemana,
      sinWeb,
      oportunidadAlta,
      listosOutreach,
      enPipeline,
      scores,
    ] = await Promise.all([
      this.prisma.prospect.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.prospect.count({
        where: {
          tenantId,
          deletedAt: null,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.prospect.count({ where: { tenantId, deletedAt: null, website: null } }),
      this.prisma.prospect.count({ where: { tenantId, deletedAt: null, score: { gte: 80 } } }),
      this.prisma.prospect.count({
        where: { tenantId, deletedAt: null, estado: 'LISTO_OUTREACH' },
      }),
      this.prisma.prospect.count({
        where: { tenantId, deletedAt: null, estado: { in: ['PASO_A_PIPELINE', 'CONVERTIDO'] } },
      }),
      this.prisma.prospect.aggregate({
        where: { tenantId, deletedAt: null },
        _avg: { score: true },
      }),
    ]);

    return {
      total,
      nuevosEstaSemana,
      sinWeb,
      oportunidadAlta,
      listosOutreach,
      enPipeline,
      scorePromedio: Math.round(scores._avg.score || 0),
    };
  }

  async findOne(id: string, tenantId: string) {
    const prospect = await this.prisma.prospect.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        creadoPor: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!prospect) throw new NotFoundException('Prospect not found');
    return prospect;
  }

  async create(tenantId: string, userId: string | null, dto: CreateProspectDto) {
    return this.prisma.prospect.create({
      data: {
        tenantId,
        creadoPorId: userId ?? null,
        ...dto,
        problemasEncontrados: dto.problemasEncontrados || [],
      },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateProspectDto) {
    const prospect = await this.findOne(id, tenantId);

    if (dto.estado && dto.estado !== prospect.estado) {
      const allowed = VALID_TRANSITIONS[prospect.estado];
      if (!allowed.includes(dto.estado)) {
        throw new BadRequestException(
          `Cannot transition from ${prospect.estado} to ${dto.estado}`,
        );
      }
    }

    return this.prisma.prospect.update({
      where: { id },
      data: dto,
    });
  }

  async archive(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.prospect.update({
      where: { id },
      data: { estado: 'ARCHIVADO' },
    });
  }

  async discard(id: string, tenantId: string, motivo: string) {
    await this.findOne(id, tenantId);
    return this.prisma.prospect.update({
      where: { id },
      data: { estado: 'DESCARTADO', oportunidadDetectada: motivo },
    });
  }

  async softDelete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.prospect.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private buildFilters(filters: Partial<FilterProspectsDto>) {
    const where: Prisma.ProspectWhereInput = {};
    if (filters.rubro) where.rubro = { contains: filters.rubro, mode: 'insensitive' };
    if (filters.pais) where.pais = filters.pais;
    if (filters.ciudad) where.ciudad = { contains: filters.ciudad, mode: 'insensitive' };
    if (filters.estado) where.estado = filters.estado;
    if (filters.ownerId) where.ownerId = filters.ownerId;
    if (filters.fuente) where.fuente = filters.fuente;
    if (filters.nivelOportunidad) where.nivelOportunidad = filters.nivelOportunidad;
    if (filters.detectadoPor) where.detectadoPor = filters.detectadoPor;
    return where;
  }
}
