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
import { ProspectsService } from './prospects.service';
import { CreateProspectDto } from './dto/create-prospect.dto';
import { UpdateProspectDto } from './dto/update-prospect.dto';
import { FilterProspectsDto } from './dto/filter-prospects.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NoServiceAccountGuard } from '../../common/guards/no-service-account.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Prospects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('prospects')
export class ProspectsController {
  constructor(private readonly service: ProspectsService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'Dashboard KPIs for prospects' })
  getKpis(@CurrentUser() user: JwtPayload) {
    return this.service.getKpis(user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'List all prospects with filters' })
  findAll(@CurrentUser() user: JwtPayload, @Query() filters: FilterProspectsDto) {
    return this.service.findAll(user.tenantId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get prospect by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new prospect' })
  create(@Body() dto: CreateProspectDto, @CurrentUser() user: JwtPayload) {
    const userId = user.type === 'service' ? null : user.sub;
    return this.service.create(user.tenantId, userId, dto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk create prospects from CSV import' })
  bulkCreate(@Body() dto: { prospects: CreateProspectDto[] }, @CurrentUser() user: JwtPayload) {
    const userId = user.type === 'service' ? null : user.sub;
    return this.service.bulkCreate(user.tenantId, userId, dto.prospects);
  }

  @Post('from-url')
  @ApiOperation({ summary: 'Detect source type and extract prospect data from URL (preview only)' })
  extractFromUrl(@Body() dto: { url: string }, @CurrentUser() user: JwtPayload) {
    return this.service.extractFromUrl(dto.url);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update prospect (including state transitions)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProspectDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(id, user.tenantId, dto);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive prospect' })
  archive(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.archive(id, user.tenantId);
  }

  @Patch(':id/discard')
  @ApiOperation({ summary: 'Discard prospect (requires reason)' })
  discard(
    @Param('id') id: string,
    @Body('motivo') motivo: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.discard(id, user.tenantId, motivo);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(NoServiceAccountGuard)
  @ApiOperation({ summary: 'Soft delete prospect' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.softDelete(id, user.tenantId);
  }
}
