import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ServiceEstado, DeliverableEstado, ServicioCategoria } from '@prisma/client';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreateDeliverableDto } from './dto/create-deliverable.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class ServiceFiltersDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() clientId?: string;
  @ApiPropertyOptional({ enum: ServicioCategoria }) @IsOptional() @IsEnum(ServicioCategoria) categoria?: ServicioCategoria;
  @ApiPropertyOptional({ enum: ServiceEstado }) @IsOptional() @IsEnum(ServiceEstado) estado?: ServiceEstado;
  @ApiPropertyOptional() @IsOptional() @IsUUID() ownerId?: string;
}

@ApiTags('Services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly service: ServicesService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'Services KPIs — MRR, margins, renewals' })
  getKpis(@CurrentUser() user: JwtPayload) {
    return this.service.getKpis(user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'List all services with filters' })
  findAll(@CurrentUser() user: JwtPayload, @Query() q: ServiceFiltersDto) {
    const { clientId, categoria, estado, ownerId, ...pagination } = q;
    return this.service.findAll(user.tenantId, pagination, { clientId, categoria, estado, ownerId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service with deliverables and deal origin' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new service (usually auto-created from deal.won)' })
  create(@Body() dto: CreateServiceDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(user.tenantId, user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update service fields' })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateServiceDto>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(id, user.tenantId, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change service status (CANCELADO requires motivo)' })
  changeStatus(
    @Param('id') id: string,
    @Body('estado') estado: ServiceEstado,
    @Body('motivo') motivo: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.changeStatus(id, user.tenantId, estado, motivo);
  }

  @Post(':id/deliverables')
  @ApiOperation({ summary: 'Add a deliverable to a service' })
  addDeliverable(
    @Param('id') id: string,
    @Body() dto: CreateDeliverableDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.addDeliverable(id, user.tenantId, dto);
  }

  @Patch(':id/deliverables/:deliverableId')
  @ApiOperation({ summary: 'Update deliverable status' })
  updateDeliverable(
    @Param('id') id: string,
    @Param('deliverableId') deliverableId: string,
    @Body('estado') estado: DeliverableEstado,
    @Body('urlArchivo') urlArchivo: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.updateDeliverable(id, deliverableId, user.tenantId, estado, urlArchivo);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete service' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.softDelete(id, user.tenantId);
  }
}
