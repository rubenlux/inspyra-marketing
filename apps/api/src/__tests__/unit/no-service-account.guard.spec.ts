import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { NoServiceAccountGuard } from '../../common/guards/no-service-account.guard';

function makeContext(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('NoServiceAccountGuard', () => {
  const guard = new NoServiceAccountGuard();

  it('throws ForbiddenException when user is a service account', () => {
    const ctx = makeContext({ sub: 'sa-1', type: 'service', tenantId: 't1' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('allows human user (no type field)', () => {
    const ctx = makeContext({ sub: 'user-1', email: 'admin@test.com', tenantId: 't1' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows when user is undefined (other guards handle 401)', () => {
    const ctx = makeContext(undefined);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows when user is null', () => {
    const ctx = makeContext(null);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows when type is not service (e.g. type is some other string)', () => {
    const ctx = makeContext({ sub: 'u1', tenantId: 't1', type: 'admin' });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
