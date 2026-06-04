import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EstadoCuenta, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { PaginationDto, paginate, buildMeta } from '../../common/dto/pagination.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    pagination: PaginationDto,
    filters: { estado?: EstadoCuenta; ownerId?: string; riesgoChurn?: string },
  ) {
    const { page = 1, limit = 20 } = pagination;
    const { skip, take } = paginate(page, limit);

    const where: Prisma.ClientWhereInput = { tenantId, deletedAt: null };
    if (filters.estado) where.estadoCuenta = filters.estado;
    if (filters.ownerId) where.accountOwnerId = filters.ownerId;
    if (filters.riesgoChurn) where.riesgoChurn = filters.riesgoChurn as any;

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          accountOwner: { select: { id: true, firstName: true, lastName: true } },
          contactos: { where: { esPrincipal: true }, take: 1 },
          _count: { select: { services: true } },
        },
      }),
      this.prisma.client.count({ where }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  }

  async getKpis(tenantId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalActivos,
      nuevosEsteMes,
      enOnboarding,
      conDeuda,
      enRiesgo,
      conUpsell,
      mrrData,
    ] = await Promise.all([
      this.prisma.client.count({
        where: { tenantId, deletedAt: null, estadoCuenta: { in: ['ACTIVO', 'ONBOARDING'] } },
      }),
      this.prisma.client.count({
        where: { tenantId, deletedAt: null, fechaAlta: { gte: startOfMonth } },
      }),
      this.prisma.client.count({ where: { tenantId, deletedAt: null, estadoCuenta: 'ONBOARDING' } }),
      this.prisma.client.count({
        where: { tenantId, deletedAt: null, deudaPendienteUsd: { gt: 0 } },
      }),
      this.prisma.client.count({
        where: { tenantId, deletedAt: null, riesgoChurn: { in: ['ALTO', 'CRITICO'] } },
      }),
      this.prisma.client.count({ where: { tenantId, deletedAt: null, oportunidadUpsell: true } }),
      this.prisma.client.aggregate({
        where: { tenantId, deletedAt: null, estadoCuenta: { in: ['ACTIVO', 'ONBOARDING'] } },
        _sum: { mrrUsd: true, revenueLifetimeUsd: true },
        _avg: { mrrUsd: true },
      }),
    ]);

    return {
      totalActivos,
      nuevosEsteMes,
      enOnboarding,
      conDeuda,
      enRiesgo,
      conUpsell,
      mrrTotal: Number(mrrData._sum.mrrUsd || 0),
      revenueAcumulado: Number(mrrData._sum.revenueLifetimeUsd || 0),
      ticketPromedio: Number(mrrData._avg.mrrUsd || 0),
    };
  }

  async findOne(id: string, tenantId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        accountOwner: { select: { id: true, firstName: true, lastName: true, email: true } },
        contactos: { orderBy: [{ esPrincipal: 'desc' }, { createdAt: 'asc' }] },
        services: {
          where: { deletedAt: null },
          include: { owner: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
        },
        dealOrigen: { select: { id: true, empresa: true, valorEstimadoUsd: true, etapa: true } },
        comercialCierre: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async create(tenantId: string, dto: CreateClientDto) {
    return this.prisma.client.create({
      data: {
        tenantId,
        razonSocial: dto.razonSocial,
        nombreComercial: dto.nombreComercial,
        cuitIdentificacion: dto.cuitIdentificacion,
        pais: dto.pais,
        ciudad: dto.ciudad,
        direccion: dto.direccion,
        accountOwnerId: dto.accountOwnerId,
        estadoCuenta: dto.estadoCuenta || 'ONBOARDING',
        dealOrigenId: dto.dealOrigenId,
        comercialCierreId: dto.comercialCierreId,
        ticketInicialUsd: dto.ticketInicialUsd,
        billingCycle: dto.billingCycle || 'MENSUAL',
        feeMensualUsd: dto.feeMensualUsd || 0,
        mrrUsd: dto.feeMensualUsd || 0,
        dominio: dto.dominio,
        sslExpiraAt: dto.sslExpiraAt,
      },
    });
  }

  async update(id: string, tenantId: string, dto: Partial<CreateClientDto>) {
    await this.findOne(id, tenantId);
    return this.prisma.client.update({ where: { id }, data: dto });
  }

  async changeStatus(id: string, tenantId: string, estado: EstadoCuenta) {
    await this.findOne(id, tenantId);
    return this.prisma.client.update({ where: { id }, data: { estadoCuenta: estado } });
  }

  // Contacts
  async addContact(clientId: string, tenantId: string, dto: CreateContactDto) {
    await this.findOne(clientId, tenantId);

    if (dto.esPrincipal) {
      await this.prisma.clientContact.updateMany({
        where: { clientId },
        data: { esPrincipal: false },
      });
    }

    return this.prisma.clientContact.create({ data: { clientId, ...dto } });
  }

  async removeContact(clientId: string, contactId: string, tenantId: string) {
    await this.findOne(clientId, tenantId);
    const contact = await this.prisma.clientContact.findFirst({ where: { id: contactId, clientId } });
    if (!contact) throw new NotFoundException('Contact not found');

    if (contact.esPrincipal) {
      throw new BadRequestException('Cannot remove the principal contact');
    }

    return this.prisma.clientContact.delete({ where: { id: contactId } });
  }

  async softDelete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.client.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
