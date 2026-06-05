import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProspectValidationService } from './prospect-validation.service';
import { CreateValidationDto } from './dto/create-validation.dto';
import { ReviewValidationDto } from './dto/review-validation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NoServiceAccountGuard } from '../../common/guards/no-service-account.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Prospect Validation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('prospect-validations')
export class ProspectValidationController {
  constructor(private readonly service: ProspectValidationService) {}

  @Post()
  @ApiOperation({ summary: 'Opportunity Agent submits scoring assessment' })
  create(@Body() dto: CreateValidationDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(user.tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all validations (filter by status)' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'VALIDATED', 'REJECTED'] })
  findAll(@CurrentUser() user: JwtPayload, @Query('status') status?: string) {
    return this.service.findAll(user.tenantId, status);
  }

  @Get('kpis')
  @ApiOperation({ summary: 'Full KPI dashboard: avgDrift, medianDrift, approvalRate, topRejectionReason, topService' })
  getKpis(@CurrentUser() user: JwtPayload) {
    return this.service.getKpis(user.tenantId);
  }

  @Get('drift')
  @ApiOperation({ summary: 'Score drift: IA vs human — learning signal' })
  getScoreDrift(@CurrentUser() user: JwtPayload) {
    return this.service.getScoreDrift(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single validation' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.tenantId);
  }

  @Patch(':id/review')
  @UseGuards(NoServiceAccountGuard)
  @ApiOperation({ summary: 'Human reviews and adjusts score (no agents allowed)' })
  review(
    @Param('id') id: string,
    @Body() dto: ReviewValidationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.review(id, user.tenantId, user.sub, dto);
  }

  @Post('run/:prospectId')
  @ApiOperation({ summary: 'Run scoring engine — scores prospect using Service Intelligence + Pricing Engine' })
  runAgent(@Param('prospectId') prospectId: string, @CurrentUser() user: JwtPayload) {
    return this.service.runAgent(prospectId, user.tenantId);
  }

  @Post('recalculate/:prospectId')
  @ApiOperation({ summary: 'Recalculate existing validation — re-runs scoring engine, bumps validationVersion' })
  recalculate(@Param('prospectId') prospectId: string, @CurrentUser() user: JwtPayload) {
    return this.service.recalculate(prospectId, user.tenantId);
  }
}
