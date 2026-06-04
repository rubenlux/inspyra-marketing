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
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { MoveStageDto } from './dto/move-stage.dto';
import { FilterDealsDto } from './dto/filter-deals.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Pipeline / Deals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('deals')
export class DealsController {
  constructor(private readonly service: DealsService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'Pipeline KPIs and forecast' })
  getKpis(@CurrentUser() user: JwtPayload) {
    return this.service.getKpis(user.tenantId);
  }

  @Get('kanban')
  @ApiOperation({ summary: 'Kanban view — deals grouped by stage' })
  getKanban(@CurrentUser() user: JwtPayload) {
    return this.service.getKanban(user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'List all deals with filters' })
  findAll(@CurrentUser() user: JwtPayload, @Query() filters: FilterDealsDto) {
    return this.service.findAll(user.tenantId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deal by ID with stage history' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new deal' })
  create(@Body() dto: CreateDealDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(user.tenantId, user.sub, dto);
  }

  @Patch(':id/move')
  @ApiOperation({ summary: 'Move deal to a different stage (audited)' })
  moveStage(
    @Param('id') id: string,
    @Body() dto: MoveStageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.moveStage(id, user.tenantId, user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update deal fields' })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateDealDto>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(id, user.tenantId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete deal' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.softDelete(id, user.tenantId);
  }
}
