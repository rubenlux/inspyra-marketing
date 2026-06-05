import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateResearchJobDto } from './dto/create-research-job.dto';
import { spawn } from 'child_process';
import * as path from 'path';

@Injectable()
export class ResearchService {
  private readonly logger = new Logger(ResearchService.name);

  // Resolved at construction time — 4 levels up from dist/modules/research/ → project root
  private readonly projectRoot = path.resolve(__dirname, '../../../../../');

  constructor(private readonly prisma: PrismaService) {}

  async createJob(dto: CreateResearchJobDto, tenantId: string, userId: string) {
    const job = await this.prisma.researchJob.create({
      data: {
        tenantId,
        query: dto.query,
        limit: dto.limit ?? 5,
        createdBy: userId,
        status: 'PENDING',
      },
    });

    // Start agent asynchronously — do not await
    setImmediate(() => {
      this.runAgent(job.id, tenantId, dto.query, dto.limit ?? 10).catch(err =>
        this.logger.error(`Job ${job.id} unhandled error: ${err.message}`),
      );
    });

    return job;
  }

  async getJob(jobId: string, tenantId: string) {
    const job = await this.prisma.researchJob.findFirst({
      where: { id: jobId, tenantId },
    });
    if (!job) throw new NotFoundException(`Research job ${jobId} not found`);
    return job;
  }

  async listJobs(tenantId: string) {
    return this.prisma.researchJob.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        query: true,
        status: true,
        prospectsFound: true,
        errorMessage: true,
        createdAt: true,
        startedAt: true,
        completedAt: true,
        limit: true,
      },
    });
  }

  // ── Agent runner ────────────────────────────────────────────────────────────

  private async runAgent(
    jobId: string,
    tenantId: string,
    query: string,
    limit: number,
  ): Promise<void> {
    const beforeCount = await this.prisma.prospect.count({ where: { tenantId } });

    await this.prisma.researchJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING', startedAt: new Date() },
    });

    this.logger.log(`[Job ${jobId}] Starting — query: "${query}" | limit: ${limit}`);

    try {
      const output = await this.spawnClaude(jobId, query, limit);

      const afterCount = await this.prisma.prospect.count({ where: { tenantId } });
      const prospectsFound = Math.max(0, afterCount - beforeCount);

      this.logger.log(`[Job ${jobId}] Done — ${prospectsFound} new prospects`);

      await this.prisma.researchJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          prospectsFound,
          agentOutput: output.slice(-4000),
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`[Job ${jobId}] Failed: ${errorMessage}`);

      await this.prisma.researchJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: errorMessage.slice(0, 1000),
        },
      });
    }
  }

  private buildPrompt(query: string, limit: number): string {
    return `Sos el Research Agent de Inspyra. Creá exactamente ${limit} prospectos comerciales que coincidan con esta consulta: "${query}"

Usá tu conocimiento del mercado para generar empresas verosímiles (nombres reales o muy plausibles para el rubro y ciudad especificados).

Para cada prospecto hacé esto EN ORDEN:
1. Pensá en el nombre, ciudad, rubro
2. Identificá 2-3 problemas digitales típicos de ese tipo de negocio (ej: "Sin ficha en Google Maps", "Web desactualizada sin HTTPS", "Sin agenda online", "Sin redes sociales activas", "Página de Facebook sin actualizar hace +1 año")
3. Asigná score 55-90 según cantidad de problemas (más problemas = mayor score)
4. Llamá a inspyra_create_prospect inmediatamente

Hacé esto ${limit} veces seguidas. Sin preguntas. Sin explicaciones previas. Empezá AHORA con el primer inspyra_create_prospect.`;
  }

  private spawnClaude(jobId: string, query: string, limit: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const TIMEOUT_MS = 4 * 60 * 1000; // 4 minutes — haiku + no web = debería terminar en <2min
      const mcpConfigPath = path.join(this.projectRoot, 'openclaw.json');
      const prompt = this.buildPrompt(query, limit);

      const args = [
        '-p', prompt,
        '--mcp-config', mcpConfigPath,
        '--output-format', 'text',
        '--dangerously-skip-permissions',
        '--allowedTools', 'mcp__inspyra__*',
        '--model', 'claude-haiku-4-5-20251001',
      ];

      this.logger.log(`[Job ${jobId}] Spawning claude from cwd: ${this.projectRoot}`);

      const child = spawn('claude', args, {
        cwd: this.projectRoot,
        env: { ...process.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      let settled = false;

      const done = (err?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (err) reject(err);
        else resolve(stdout);
      };

      const timer = setTimeout(() => {
        child.kill('SIGTERM');
        done(new Error('Research agent timeout after 6 minutes'));
      }, TIMEOUT_MS);

      child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
      child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

      child.on('close', (code) => {
        if (code === 0) {
          done();
        } else {
          done(new Error(
            `claude exited with code ${code}.\nstderr: ${stderr.slice(-800)}`
          ));
        }
      });

      child.on('error', (err) => done(err));
    });
  }
}
