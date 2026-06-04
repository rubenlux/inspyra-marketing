import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ServiceAccountsService } from './service-accounts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';

class GenerateTokenDto {
  @ApiProperty({ example: 'research-agent' })
  @IsString()
  serviceAccount: string;
}

@ApiTags('Service Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('auth/service-token')
export class ServiceAccountsController {
  constructor(private readonly service: ServiceAccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Generate token for a service account (ADMIN only)' })
  async generate(@Body() dto: GenerateTokenDto, @CurrentUser() user: JwtPayload) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only ADMIN or SUPER_ADMIN can generate service tokens');
    }
    return this.service.generateToken(user.tenantId, dto.serviceAccount);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'List service accounts (ADMIN only)' })
  async list(@CurrentUser() user: JwtPayload) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only ADMIN or SUPER_ADMIN can list service accounts');
    }
    return this.service.listAccounts(user.tenantId);
  }
}
