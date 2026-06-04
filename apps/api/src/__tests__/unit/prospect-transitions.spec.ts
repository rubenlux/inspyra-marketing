import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProspectsService } from '../../modules/prospects/prospects.service';
import { PrismaService } from '../../database/prisma.service';
import { createMockPrisma, MockPrisma } from '../helpers/mock-prisma';

const TENANT = 'tenant-1';

function makeProspect(estado: string) {
  return {
    id: 'prospect-1',
    tenantId: TENANT,
    nombreEmpresa: 'Test Co',
    estado,
    deletedAt: null,
    owner: null,
    creadoPor: null,
  };
}

describe('ProspectsService — state transitions', () => {
  let service: ProspectsService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createMockPrisma();
    const module = await Test.createTestingModule({
      providers: [ProspectsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(ProspectsService);
  });

  describe('valid transitions', () => {
    const validCases: [string, string][] = [
      ['NUEVO', 'INVESTIGADO'],
      ['NUEVO', 'DESCARTADO'],
      ['NUEVO', 'ARCHIVADO'],
      ['INVESTIGADO', 'ENRIQUECIDO'],
      ['LISTO_OUTREACH', 'CONTACTADO'],
      ['CONTACTADO', 'RESPONDIO'],
      ['RESPONDIO', 'REUNION_AGENDADA'],
      ['RESPONDIO', 'PASO_A_PIPELINE'],
      ['PASO_A_PIPELINE', 'CONVERTIDO'],
      ['DESCARTADO', 'ARCHIVADO'],
      ['ARCHIVADO', 'NUEVO'],
    ];

    test.each(validCases)('%s → %s is allowed', async (from, to) => {
      prisma.prospect.findFirst.mockResolvedValue(makeProspect(from));
      prisma.prospect.update.mockResolvedValue({ ...makeProspect(to) });

      await expect(service.update('prospect-1', TENANT, { estado: to as never })).resolves.toBeDefined();
    });
  });

  describe('invalid transitions', () => {
    const invalidCases: [string, string][] = [
      ['NUEVO', 'CONVERTIDO'],
      ['NUEVO', 'RESPONDIO'],
      ['CONVERTIDO', 'NUEVO'],
      ['CONVERTIDO', 'INVESTIGADO'],
      ['PASO_A_PIPELINE', 'NUEVO'],
    ];

    test.each(invalidCases)('%s → %s throws BadRequestException', async (from, to) => {
      prisma.prospect.findFirst.mockResolvedValue(makeProspect(from));

      await expect(service.update('prospect-1', TENANT, { estado: to as never })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  it('throws NotFoundException when prospect does not exist', async () => {
    prisma.prospect.findFirst.mockResolvedValue(null);

    await expect(service.update('missing', TENANT, { score: 50 })).rejects.toThrow(NotFoundException);
  });

  describe('create', () => {
    it('sets problemasEncontrados to [] when not provided', async () => {
      const created = { id: 'new-1', tenantId: TENANT, problemasEncontrados: [] };
      prisma.prospect.create.mockResolvedValue(created as never);

      await service.create(TENANT, null, { nombreEmpresa: 'Test Co' });

      expect(prisma.prospect.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ problemasEncontrados: [] }) }),
      );
    });

    it('preserves provided problemasEncontrados', async () => {
      const problems = ['Sin SEO', 'Web vieja'];
      const created = { id: 'new-1', tenantId: TENANT, problemasEncontrados: problems };
      prisma.prospect.create.mockResolvedValue(created as never);

      await service.create(TENANT, null, { nombreEmpresa: 'Test Co', problemasEncontrados: problems });

      expect(prisma.prospect.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ problemasEncontrados: problems }) }),
      );
    });

    it('sets creadoPorId to null for service account calls (userId = null)', async () => {
      prisma.prospect.create.mockResolvedValue({ id: 'new-1' } as never);

      await service.create(TENANT, null, { nombreEmpresa: 'Agent Prospect' });

      expect(prisma.prospect.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ creadoPorId: null }) }),
      );
    });
  });
});
