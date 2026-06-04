import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { AgentAuditInterceptor } from '../../common/interceptors/agent-audit.interceptor';
import { createMockPrisma, MockPrisma } from '../helpers/mock-prisma';

function makeContext(overrides: {
  method?: string;
  headers?: Record<string, string>;
  user?: { tenantId?: string };
} = {}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        method: overrides.method ?? 'POST',
        path: '/api/v1/prospects',
        headers: overrides.headers ?? { 'x-agent-id': 'research' },
        body: { nombreEmpresa: 'Test' },
        ip: '127.0.0.1',
        user: overrides.user ?? { tenantId: 'tenant-1' },
      }),
    }),
  } as unknown as ExecutionContext;
}

const makeHandler = (): CallHandler => ({ handle: () => of({ id: 'new-1' }) });

describe('AgentAuditInterceptor', () => {
  let interceptor: AgentAuditInterceptor;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.auditLog.create.mockResolvedValue({} as never);
    interceptor = new AgentAuditInterceptor(prisma as never);
  });

  it('writes audit log for POST request with X-Agent-Id', (done) => {
    const ctx = makeContext();

    interceptor.intercept(ctx, makeHandler()).subscribe(() => {
      // setImmediate fires after subscribe resolves
      setImmediate(() => {
        expect(prisma.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              tenantId: 'tenant-1',
              action: 'POST /api/v1/prospects',
              resource: 'api',
            }),
          }),
        );
        done();
      });
    });
  });

  it('does NOT write audit log for GET requests', (done) => {
    const ctx = makeContext({ method: 'GET' });

    interceptor.intercept(ctx, makeHandler()).subscribe(() => {
      setImmediate(() => {
        expect(prisma.auditLog.create).not.toHaveBeenCalled();
        done();
      });
    });
  });

  it('does NOT write audit log when X-Agent-Id header is missing', (done) => {
    const ctx = makeContext({ headers: {} });

    interceptor.intercept(ctx, makeHandler()).subscribe(() => {
      setImmediate(() => {
        expect(prisma.auditLog.create).not.toHaveBeenCalled();
        done();
      });
    });
  });

  it('does NOT write audit log when tenantId is absent from user', (done) => {
    const ctx = makeContext({ user: {} });

    interceptor.intercept(ctx, makeHandler()).subscribe(() => {
      setImmediate(() => {
        expect(prisma.auditLog.create).not.toHaveBeenCalled();
        done();
      });
    });
  });

  it('includes agentId and source in audit log changes', (done) => {
    const ctx = makeContext({ headers: { 'x-agent-id': 'research' } });

    interceptor.intercept(ctx, makeHandler()).subscribe(() => {
      setImmediate(() => {
        const call = prisma.auditLog.create.mock.calls[0][0];
        expect(call.data.changes.agentId).toBe('research');
        expect(call.data.changes.source).toBe('openclaw');
        done();
      });
    });
  });
});
