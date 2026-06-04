import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtPayload {
  sub: string;
  email?: string;
  tenantId: string;
  role?: string;
  // Service account fields (present when type === 'service')
  agentId?: string;
  scopes?: string[];
  type?: 'service';
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
