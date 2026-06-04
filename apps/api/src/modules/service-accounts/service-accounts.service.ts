import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import * as crypto from 'crypto';

export interface ServiceTokenPayload {
  sub: string;
  agentId: string;
  tenantId: string;
  scopes: string[];
  type: 'service';
}

@Injectable()
export class ServiceAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async generateToken(tenantId: string, agentName: string): Promise<{ accessToken: string; scopes: string[] }> {
    const account = await this.prisma.serviceAccount.findUnique({
      where: { tenantId_agentName: { tenantId, agentName } },
    });

    if (!account) throw new NotFoundException(`Service account "${agentName}" not found`);
    if (!account.isActive) throw new ForbiddenException(`Service account "${agentName}" is disabled`);

    const payload: ServiceTokenPayload = {
      sub: account.id,
      agentId: account.agentName,
      tenantId: account.tenantId,
      scopes: account.scopes,
      type: 'service',
    };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('jwt.secret'),
      expiresIn: '365d',
    });
    const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');

    // Revoke previous tokens for this account
    await this.prisma.serviceToken.updateMany({
      where: { serviceAccountId: account.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.prisma.serviceToken.create({
      data: {
        serviceAccountId: account.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, scopes: account.scopes };
  }

  async validateToken(token: string): Promise<ServiceTokenPayload | null> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const record = await this.prisma.serviceToken.findUnique({
      where: { tokenHash },
      include: { serviceAccount: true },
    });

    if (!record || record.revokedAt || !record.serviceAccount.isActive) return null;
    if (record.expiresAt && record.expiresAt < new Date()) return null;

    await this.prisma.serviceAccount.update({
      where: { id: record.serviceAccountId },
      data: { lastUsedAt: new Date() },
    });

    return {
      sub: record.serviceAccount.id,
      agentId: record.serviceAccount.agentName,
      tenantId: record.serviceAccount.tenantId,
      scopes: record.serviceAccount.scopes,
      type: 'service',
    };
  }

  async listAccounts(tenantId: string) {
    return this.prisma.serviceAccount.findMany({
      where: { tenantId },
      select: { id: true, name: true, agentName: true, scopes: true, isActive: true, createdAt: true, lastUsedAt: true },
    });
  }
}
