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
import { EstadoCuenta } from '@prisma/client';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class ClientFiltersDto extends PaginationDto {
  @ApiPropertyOptional({ enum: EstadoCuenta })
  @IsOptional()
  @IsEnum(EstadoCuenta)
  estado?: EstadoCuenta;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  riesgoChurn?: string;
}

@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'Dashboard KPIs — MRR, churn risk, upsell opportunities' })
  getKpis(@CurrentUser() user: JwtPayload) {
    return this.service.getKpis(user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'List all clients with filters' })
  findAll(@CurrentUser() user: JwtPayload, @Query() q: ClientFiltersDto) {
    const { estado, ownerId, riesgoChurn, ...pagination } = q;
    return this.service.findAll(user.tenantId, pagination, { estado, ownerId, riesgoChurn });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full client record with contacts, services, deal origin' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a client (usually auto-created from deal.won)' })
  create(@Body() dto: CreateClientDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(user.tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update client record' })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateClientDto>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(id, user.tenantId, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change account status' })
  changeStatus(
    @Param('id') id: string,
    @Body('estado') estado: EstadoCuenta,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.changeStatus(id, user.tenantId, estado);
  }

  @Post(':id/contacts')
  @ApiOperation({ summary: 'Add a contact to the client' })
  addContact(
    @Param('id') id: string,
    @Body() dto: CreateContactDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.addContact(id, user.tenantId, dto);
  }

  @Delete(':id/contacts/:contactId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a contact (principal contact cannot be removed)' })
  removeContact(
    @Param('id') id: string,
    @Param('contactId') contactId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.removeContact(id, contactId, user.tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete client' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.softDelete(id, user.tenantId);
  }
}
