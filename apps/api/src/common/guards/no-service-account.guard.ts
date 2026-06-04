import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

// Blocks service accounts (agents) from calling this endpoint.
// Use on DELETE, role changes, billing, and any irreversible operation.
@Injectable()
export class NoServiceAccountGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const user = ctx.switchToHttp().getRequest().user;
    if (user?.type === 'service') {
      throw new ForbiddenException('Service accounts cannot perform this operation');
    }
    return true;
  }
}
