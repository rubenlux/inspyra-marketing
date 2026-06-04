import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AgentAuditMiddleware implements NestMiddleware {
  private readonly logger = new Logger('AgentAudit');

  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const agentId = req.headers['x-agent-id'] as string | undefined;

    if (agentId && req.method !== 'GET') {
      const tenantId = (req as Request & { user?: { tenantId: string; sub: string } }).user?.tenantId;

      if (tenantId) {
        setImmediate(async () => {
          try {
            await this.prisma.auditLog.create({
              data: {
                tenantId,
                userId: null,
                action: `${req.method} ${req.path}`,
                resource: req.path.split('/')[1] ?? 'unknown',
                changes: { body: req.body, agentId, source: 'openclaw' },
                ipAddress: req.ip,
              },
            });
          } catch (e) {
            this.logger.warn(`Agent audit log failed: ${(e as Error).message}`);
          }
        });
      }
    }

    next();
  }
}
