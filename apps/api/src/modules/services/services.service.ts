import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ServiceEstado, DeliverableEstado, ServicioCategoria, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreateDeliverableDto } from './dto/create-deliverable.dto';
import { PaginationDto, paginate, buildMeta } from '../../common/dto/pagination.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    pagination: PaginationDto,
    filters: {
      clientId?: string;
      categoria?: ServicioCategoria;
      estado?: ServiceEstado;
      ownerId?: string;
    },
  ) {
    const { page = 1, limit = 20 } = pagination;
    const { skip, take } = paginate(page, limit);

    const where: Prisma.ServiceWhereInput = { tenantId, deletedAt: null };
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.categoria) where.categoria = filters.categoria;
    if (filters.estado) where.estado = filters.estado;
    if (filters.ownerId) where.ownerId = filters.ownerId;

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, nombreComercial: true } },
          owner: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { deliverables: true } },
        },
      }),
      this.prisma.service.count({ where }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  }

  async getKpis(tenantId: string) {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      activos,
      nuevosEsteMes,
      renovacionesProximas,
      pausados,
      mrrData,
      porCategoria,
    ] = await Promise.all([
      this.prisma.service.count({
        where: { tenantId, deletedAt: null, estado: { in: ['ACTIVO', 'EN_EJECUCION'] } },
      }),
      this.prisma.service.count({
        where: { tenantId, deletedAt: null, fechaInicio: { gte: startOfMonth } },
      }),
      this.prisma.service.count({
        where: {
          tenantId,
          deletedAt: null,
          proximaRenovacionAt: { lte: thirtyDaysFromNow, gte: new Date() },
        },
      }),
      this.prisma.service.count({ where: { tenantId, deletedAt: null, estado: 'PAUSADO' } }),
      this.prisma.service.aggregate({
        where: { tenantId, deletedAt: null, estado: { in: ['ACTIVO', 'EN_EJECUCION'] } },
        _sum: { mrrUsd: true, precioVendidoUsd: true, costeInternoUsd: true },
        _avg: { margenEstimadoPct: true },
      }),
      this.prisma.service.groupBy({
        by: ['categoria'],
        where: { tenantId, deletedAt: null },
        _sum: { precioVendidoUsd: true },
        _count: true,
      }),
    ]);

    return {
      activos,
      nuevosEsteMes,
      renovacionesProximas,
      pausados,
      mrrServicios: Number(mrrData._sum.mrrUsd || 0),
      revenueTotal: Number(mrrData._sum.precioVendidoUsd || 0),
      margenPromedio: Number(mrrData._avg.margenEstimadoPct || 0),
      porCategoria,
    };
  }

  async findOne(id: string, tenantId: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        client: { select: { id: true, nombreComercial: true, razonSocial: true } },
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        dealOrigen: { select: { id: true, empresa: true, valorEstimadoUsd: true } },
        deliverables: { orderBy: { fechaEsperada: 'asc' } },
      },
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async create(tenantId: string, userId: string, dto: CreateServiceDto) {
    const precioActual = dto.precioActualUsd ?? dto.precioVendidoUsd;
    const coste = dto.costeInternoUsd ?? 0;
    const margen = precioActual > 0
      ? ((precioActual - coste) / precioActual) * 100
      : 0;

    const mrr = this.calcMrr(dto.billingModel, precioActual);

    return this.prisma.service.create({
      data: {
        tenantId,
        createdById: userId,
        clientId: dto.clientId,
        nombre: dto.nombre,
        categoria: dto.categoria,
        descripcionAlcance: dto.descripcionAlcance,
        fechaInicio: dto.fechaInicio,
        fechaFin: dto.fechaFin,
        duracionEstimadaDias: dto.duracionEstimadaDias,
        billingModel: dto.billingModel,
        precioVendidoUsd: dto.precioVendidoUsd,
        precioActualUsd: precioActual,
        costeInternoUsd: coste,
        margenEstimadoPct: parseFloat(margen.toFixed(2)),
        mrrUsd: mrr,
        ownerId: dto.ownerId,
        equipoIds: dto.equipoIds || [],
        entregables: dto.entregables || [],
        sla: dto.sla,
        renovacionAutomatica: dto.renovacionAutomatica ?? false,
        proximaRenovacionAt: dto.proximaRenovacionAt,
        dealOrigenId: dto.dealOrigenId,
        observaciones: dto.observaciones,
      },
    });
  }

  async changeStatus(id: string, tenantId: string, estado: ServiceEstado, motivo?: string) {
    await this.findOne(id, tenantId);

    if (estado === 'CANCELADO' && !motivo) {
      throw new BadRequestException('motivoCancelacion is required when cancelling a service');
    }

    return this.prisma.service.update({
      where: { id },
      data: { estado, motivoCancelacion: estado === 'CANCELADO' ? motivo : undefined },
    });
  }

  async update(id: string, tenantId: string, data: Partial<CreateServiceDto>) {
    await this.findOne(id, tenantId);
    return this.prisma.service.update({ where: { id }, data });
  }

  // Deliverables
  async addDeliverable(serviceId: string, tenantId: string, dto: CreateDeliverableDto) {
    await this.findOne(serviceId, tenantId);
    return this.prisma.serviceDeliverable.create({ data: { serviceId, ...dto } });
  }

  async updateDeliverable(
    serviceId: string,
    deliverableId: string,
    tenantId: string,
    estado: DeliverableEstado,
    urlArchivo?: string,
  ) {
    await this.findOne(serviceId, tenantId);
    return this.prisma.serviceDeliverable.update({
      where: { id: deliverableId },
      data: {
        estado,
        urlArchivo,
        fechaEntregado: ['COMPLETADO', 'APROBADO'].includes(estado) ? new Date() : undefined,
      },
    });
  }

  async softDelete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.service.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private calcMrr(model: string, precio: number): number {
    switch (model) {
      case 'MENSUAL':
      case 'SUSCRIPCION':
        return precio;
      case 'TRIMESTRAL':
        return precio / 3;
      case 'ANUAL':
        return precio / 12;
      case 'UNICO':
      case 'POR_PROYECTO':
        return 0;
      default:
        return 0;
    }
  }
}
