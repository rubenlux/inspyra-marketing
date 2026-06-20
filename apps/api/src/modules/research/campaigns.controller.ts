import {
  Body, Controller, Get, Param, Patch, Post, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Controller('research/campaigns')
@UseGuards(JwtAuthGuard)
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  // Static routes first — must come before :id to avoid route conflicts

  @Get('templates')
  getTemplates() {
    return this.campaigns.getTemplates();
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.campaigns.findAll(user.tenantId);
  }

  @Post()
  create(@Body() dto: CreateCampaignDto, @CurrentUser() user: JwtPayload) {
    return this.campaigns.create(user.tenantId, user.sub, dto);
  }

  // Parameterized routes after static ones

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.campaigns.findOne(id, user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.campaigns.update(id, user.tenantId, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.campaigns.updateStatus(id, user.tenantId, status);
  }

  @Post(':id/run')
  run(
    @Param('id') id: string,
    @Body('limit') limit: number | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.campaigns.run(id, user.tenantId, user.sub, limit);
  }
}
