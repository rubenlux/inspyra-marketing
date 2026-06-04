import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../database/prisma.service';
import { JwtPayload } from '../decorators/current-user.decorator';

@Injectable()
export class AgentAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AgentAudit');

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{ method: string; path: string; headers: Record<string, string>; body: unknown; ip: string; user?: JwtPayload }>();
    const agentId = req.headers['x-agent-id'];

    if (!agentId || req.method === 'GET') {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return;

        setImmediate(async () => {
          try {
            await this.prisma.auditLog.create({
              data: {
                tenantId,
                userId: null,
                action: `${req.method} ${req.path}`,
                resource: req.path.split('/')[1] ?? 'unknown',
                changes: JSON.parse(JSON.stringify({ body: req.body, agentId, source: 'openclaw' })),
                ipAddress: req.ip,
              },
            });
          } catch (e) {
            this.logger.warn(`Agent audit log failed: ${(e as Error).message}`);
          }
        });
      }),
    );
  }
}
