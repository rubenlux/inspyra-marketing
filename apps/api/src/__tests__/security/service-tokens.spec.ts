import { Test } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ServiceAccountsService } from '../../modules/service-accounts/service-accounts.service';
import { PrismaService } from '../../database/prisma.service';
import { createMockPrisma, MockPrisma } from '../helpers/mock-prisma';

const TENANT = 'tenant-1';
const AGENT_NAME = 'research';

function makeAccount(isActive = true) {
  return {
    id: 'sa-1',
    tenantId: TENANT,
    agentName: AGENT_NAME,
    name: 'Research Agent',
    scopes: ['prospects.read', 'prospects.create'],
    isActive,
  };
}

describe('ServiceAccountsService — token security', () => {
  let service: ServiceAccountsService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createMockPrisma();
    const module = await Test.createTestingModule({
      providers: [
        ServiceAccountsService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('signed.jwt.token') },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-secret-32-chars-min-length!!') },
        },
      ],
    }).compile();
    service = module.get(ServiceAccountsService);
  });

  describe('generateToken', () => {
    it('returns token and scopes for active account', async () => {
      prisma.serviceAccount.findUnique.mockResolvedValue(makeAccount());
      prisma.serviceToken.updateMany.mockResolvedValue({ count: 0 });
      prisma.serviceToken.create.mockResolvedValue({});

      const result = await service.generateToken(TENANT, AGENT_NAME);

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.scopes).toEqual(['prospects.read', 'prospects.create']);
    });

    it('token payload contains type: service', async () => {
      prisma.serviceAccount.findUnique.mockResolvedValue(makeAccount());
      prisma.serviceToken.updateMany.mockResolvedValue({ count: 0 });
      prisma.serviceToken.create.mockResolvedValue({});

      const jwtSign = (service as unknown as { jwt: { sign: jest.Mock } }).jwt.sign;
      await service.generateToken(TENANT, AGENT_NAME);

      const payload = jwtSign.mock.calls[0][0];
      expect(payload.type).toBe('service');
      expect(payload.tenantId).toBe(TENANT);
      expect(payload.agentId).toBe(AGENT_NAME);
    });

    it('revokes previous tokens before issuing new one', async () => {
      prisma.serviceAccount.findUnique.mockResolvedValue(makeAccount());
      prisma.serviceToken.updateMany.mockResolvedValue({ count: 1 });
      prisma.serviceToken.create.mockResolvedValue({});

      await service.generateToken(TENANT, AGENT_NAME);

      expect(prisma.serviceToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ revokedAt: expect.any(Date) }) }),
      );
    });

    it('throws NotFoundException for non-existent account', async () => {
      prisma.serviceAccount.findUnique.mockResolvedValue(null);

      await expect(service.generateToken(TENANT, 'ghost-agent')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException for disabled account', async () => {
      prisma.serviceAccount.findUnique.mockResolvedValue(makeAccount(false));

      await expect(service.generateToken(TENANT, AGENT_NAME)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('validateToken', () => {
    const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    it('returns payload for valid token', async () => {
      prisma.serviceToken.findUnique.mockResolvedValue({
        tokenHash: 'hash',
        revokedAt: null,
        expiresAt: futureDate,
        serviceAccount: makeAccount(),
      });
      prisma.serviceAccount.update.mockResolvedValue({});

      const result = await service.validateToken('any-token');

      expect(result).not.toBeNull();
      expect(result!.type).toBe('service');
      expect(result!.tenantId).toBe(TENANT);
    });

    it('returns null for revoked token', async () => {
      prisma.serviceToken.findUnique.mockResolvedValue({
        revokedAt: new Date(),
        expiresAt: futureDate,
        serviceAccount: makeAccount(),
      });

      const result = await service.validateToken('revoked-token');
      expect(result).toBeNull();
    });

    it('returns null for expired token', async () => {
      prisma.serviceToken.findUnique.mockResolvedValue({
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000), // past
        serviceAccount: makeAccount(),
      });

      const result = await service.validateToken('expired-token');
      expect(result).toBeNull();
    });

    it('returns null when token not found in DB', async () => {
      prisma.serviceToken.findUnique.mockResolvedValue(null);

      const result = await service.validateToken('unknown-token');
      expect(result).toBeNull();
    });

    it('returns null for disabled account', async () => {
      prisma.serviceToken.findUnique.mockResolvedValue({
        revokedAt: null,
        expiresAt: futureDate,
        serviceAccount: makeAccount(false),
      });

      const result = await service.validateToken('token-for-disabled');
      expect(result).toBeNull();
    });
  });
});
