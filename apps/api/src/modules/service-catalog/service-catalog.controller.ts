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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ServicioCategoria } from '@prisma/client';
import { ServiceCatalogService } from './service-catalog.service';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Service Catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('service-catalog')
export class ServiceCatalogController {
  constructor(private readonly service: ServiceCatalogService) {}

  @Get()
  @ApiOperation({ summary: 'List catalog items (price list)' })
  @ApiQuery({ name: 'soloActivos', required: false, type: Boolean })
  @ApiQuery({ name: 'categoria', required: false, enum: ServicioCategoria })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('soloActivos') soloActivos?: string,
    @Query('categoria') categoria?: ServicioCategoria,
  ) {
    return this.service.findAll(user.tenantId, soloActivos !== 'false', categoria);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get catalog item by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Add item to service catalog' })
  create(@Body() dto: CreateCatalogItemDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(user.tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update catalog item' })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCatalogItemDto>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(id, user.tenantId, dto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle active/inactive status of catalog item' })
  toggle(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.toggle(id, user.tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete catalog item' })
  delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.delete(id, user.tenantId);
  }
}
