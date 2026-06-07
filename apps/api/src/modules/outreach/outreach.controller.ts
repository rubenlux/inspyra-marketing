import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { OutreachService } from './outreach.service';
import { ContactChannel } from '@prisma/client';

@Controller('outreach')
@UseGuards(JwtAuthGuard)
export class OutreachController {
  constructor(private readonly service: OutreachService) {}

  @Get('funnel')
  getFunnel(@CurrentUser() user: JwtPayload) {
    return this.service.getFunnel(user.tenantId);
  }

  @Get(':prospectId/activities')
  getActivities(@Param('prospectId') prospectId: string, @CurrentUser() user: JwtPayload) {
    return this.service.getActivities(prospectId, user.tenantId);
  }

  @Post(':prospectId/contact')
  contact(
    @Param('prospectId') prospectId: string,
    @Body() body: { channel: ContactChannel; note?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.contact(prospectId, user.tenantId, user.sub, body.channel, body.note);
  }

  @Post(':prospectId/respond')
  respond(
    @Param('prospectId') prospectId: string,
    @Body() body: { note?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.respond(prospectId, user.tenantId, user.sub, body.note);
  }

  @Post(':prospectId/no-response')
  noResponse(
    @Param('prospectId') prospectId: string,
    @Body() body: { note?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.noResponse(prospectId, user.tenantId, user.sub, body.note);
  }

  @Post(':prospectId/schedule-meeting')
  scheduleMeeting(
    @Param('prospectId') prospectId: string,
    @Body() body: { note?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.scheduleMeeting(prospectId, user.tenantId, user.sub, body.note);
  }

  @Post(':prospectId/note')
  addNote(
    @Param('prospectId') prospectId: string,
    @Body() body: { note: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.addNote(prospectId, user.tenantId, user.sub, body.note);
  }
}
