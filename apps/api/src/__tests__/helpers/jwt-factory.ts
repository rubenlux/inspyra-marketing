import { JwtService } from '@nestjs/jwt';

// Must match the JWT_SECRET in apps/api/.env
export const TEST_JWT_SECRET = 'change_me_in_production_must_be_32_chars_min';
export const TEST_TENANT_ID = '483e19af-46e0-480e-a4ea-5e8513216ef9';
export const TEST_USER_ID = 'a0d2f8bf-e4ff-458e-baa5-90fb0450b6aa';

const jwt = new JwtService({ secret: TEST_JWT_SECRET });

// Token for a human admin user
export function humanToken(overrides: Record<string, unknown> = {}): string {
  return jwt.sign(
    { sub: TEST_USER_ID, email: 'admin@inspyra.io', tenantId: TEST_TENANT_ID, role: 'ADMIN', ...overrides },
    { expiresIn: '1h' },
  );
}

// Token for the Research Agent service account
export function serviceToken(overrides: Record<string, unknown> = {}): string {
  return jwt.sign(
    {
      sub: 'sa-research',
      agentId: 'research-agent',
      tenantId: TEST_TENANT_ID,
      scopes: ['prospects.read', 'prospects.create', 'prospects.update', 'intel.read'],
      type: 'service',
      ...overrides,
    },
    { expiresIn: '1h' },
  );
}
