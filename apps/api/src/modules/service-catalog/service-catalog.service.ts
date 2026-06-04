import { Injectable, NotFoundException } from '@nestjs/common';
import { ServicioCategoria } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';

@Injectable()
export class ServiceCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, soloActivos = true, categoria?: ServicioCategoria) {
    return this.prisma.serviceCatalogItem.findMany({
      where: {
        tenantId,
        ...(soloActivos ? { activo: true } : {}),
        ...(categoria ? { categoria } : {}),
      },
      orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
    });
  }

  async findOne(id: string, tenantId: string) {
    const item = await this.prisma.serviceCatalogItem.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException('Catalog item not found');
    return item;
  }

  async create(tenantId: string, dto: CreateCatalogItemDto) {
    return this.prisma.serviceCatalogItem.create({
      data: {
        tenantId,
        nombre: dto.nombre,
        categoria: dto.categoria,
        descripcionDefault: dto.descripcionDefault,
        precioBaseUsd: dto.precioBaseUsd,
        billingModelDefault: dto.billingModelDefault,
        activo: dto.activo ?? true,
      },
    });
  }

  async update(id: string, tenantId: string, dto: Partial<CreateCatalogItemDto>) {
    await this.findOne(id, tenantId);
    return this.prisma.serviceCatalogItem.update({ where: { id }, data: dto });
  }

  async toggle(id: string, tenantId: string) {
    const item = await this.findOne(id, tenantId);
    return this.prisma.serviceCatalogItem.update({
      where: { id },
      data: { activo: !item.activo },
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.serviceCatalogItem.delete({ where: { id } });
  }
}
