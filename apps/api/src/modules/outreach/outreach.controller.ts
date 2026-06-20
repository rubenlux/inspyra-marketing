import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { OutreachService } from './outreach.service';
import { ContactChannel, ResponseType } from '@prisma/client';

@Controller('outreach')
@UseGuards(JwtAuthGuard)
export class OutreachController {
  constructor(private readonly service: OutreachService) {}

  @Get('funnel')
  getFunnel(@CurrentUser() user: JwtPayload) {
    return this.service.getFunnel(user.tenantId);
  }

  @Get('mail/folders')
  getMailFolders(@Query('email') email: string) {
    return this.service.getMailFolders(email);
  }

  @Get('mail/sent')
  getSentEmails(@CurrentUser() user: JwtPayload) {
    return this.service.getSentEmails(user.tenantId);
  }

  @Get('mail/messages')
  getMailMessages(
    @Query('email') email: string,
    @Query('folder') folder: string = 'inbox',
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
  ) {
    return this.service.getMailMessages(email, folder, parseInt(limit, 10) || 50, parseInt(offset, 10) || 0);
  }

  @Get('mail/messages/:uid')
  getMailMessage(
    @Param('uid') uid: string,
    @Query('email') email: string,
    @Query('folder') folder: string = 'inbox',
  ) {
    return this.service.getMailMessage(parseInt(uid, 10), email, folder);
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
    @Body() body: { note?: string; responseType?: ResponseType; mensajeUtilizado?: string; proposalId?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.respond(
      prospectId, user.tenantId, user.sub,
      body.note, body.responseType, body.mensajeUtilizado, body.proposalId,
    );
  }

  @Post(':prospectId/interested')
  markInterested(
    @Param('prospectId') prospectId: string,
    @Body() body: { note?: string; mensajeUtilizado?: string; proposalId?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.markInterested(
      prospectId, user.tenantId, user.sub,
      body.note, body.mensajeUtilizado, body.proposalId,
    );
  }

  @Post(':prospectId/lost')
  markLost(
    @Param('prospectId') prospectId: string,
    @Body() body: { responseType: ResponseType; note?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.markLost(prospectId, user.tenantId, user.sub, body.responseType, body.note);
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
    @Body() body: { note?: string; proposalId?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.scheduleMeeting(prospectId, user.tenantId, user.sub, body.note, body.proposalId);
  }

  @Post(':prospectId/send-email')
  sendEmail(
    @Param('prospectId') prospectId: string,
    @Body() body: { subject: string; proposalId?: string; note?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.sendEmail(prospectId, user.tenantId, user.sub, body.subject, body.proposalId, body.note);
  }

  @Post('mail/send')
  sendFreeEmail(
    @Body() body: { from?: string; to: string; subject: string; body?: string; bodyHtml?: string },
  ) {
    return this.service.sendFreeEmail(body.to, body.subject, body.body ?? '', body.from, body.bodyHtml);
  }

  @Get('mail/mailboxes')
  getMailboxes() {
    return this.service.getMailboxes();
  }

  @Post('mail/mailboxes')
  createMailbox(@Body() body: { localPart: string; quotaMB?: number }) {
    return this.service.createMailbox(body);
  }

  @Delete('mail/mailboxes/:mbEmail')
  @HttpCode(204)
  deleteMailbox(@Param('mbEmail') mbEmail: string) {
    return this.service.deleteMailbox(mbEmail);
  }

  @Post('mail/mailboxes/:mbEmail/reset-password')
  resetMailboxPassword(@Param('mbEmail') mbEmail: string) {
    return this.service.resetMailboxPassword(mbEmail);
  }

  @Get('mail/drafts')
  getMailDrafts() {
    return this.service.getMailDrafts();
  }

  @Post('mail/drafts')
  createMailDraft(
    @Body() body: { to: string; subject: string; html: string; externalRef?: string },
  ) {
    return this.service.createMailDraft(body);
  }

  @Post('mail/drafts/:draftId/send')
  sendMailDraft(
    @Param('draftId') draftId: string,
    @Body() body: { prospectId?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.sendMailDraft(draftId, user.tenantId, user.sub, body.prospectId);
  }

  @Delete('mail/drafts/:draftId')
  @HttpCode(204)
  deleteMailDraft(@Param('draftId') draftId: string) {
    return this.service.deleteMailDraft(draftId);
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
