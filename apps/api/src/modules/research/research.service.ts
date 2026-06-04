import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateResearchJobDto } from './dto/create-research-job.dto';
import { spawn } from 'child_process';
import * as path from 'path';

@Injectable()
export class ResearchService {
  private readonly logger = new Logger(ResearchService.name);

  // Resolved at construction time — 4 levels up from dist/modules/research/ → project root
  private readonly projectRoot = path.resolve(__dirname, '../../../../');

  constructor(private readonly prisma: PrismaService) {}

  async createJob(dto: CreateResearchJobDto, tenantId: string, userId: string) {
    const job = await this.prisma.researchJob.create({
      data: {
        tenantId,
        query: dto.query,
        limit: dto.limit ?? 10,
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
    return `Eres el Research Agent de Inspyra. Tu trabajo es encontrar empresas reales que coincidan con la consulta comercial que te dan y guardarlas como prospectos en el CRM usando las herramientas MCP disponibles.

Consulta: "${query}"

Instrucciones:
1. Interpretá la consulta: ¿qué tipo de empresas buscar? ¿en qué ciudad/país? ¿qué problema tienen?
2. Buscá en la web empresas REALES que coincidan (usá WebSearch, WebFetch)
3. Para cada empresa, investigá su presencia digital: sitio web, redes sociales, Google Maps
4. Identificá problemas específicos: SSL vencido, web desactualizada, sin Google Maps, sin redes, sin agenda online
5. Asigná un score (0-100): más problemas digitales = mayor score = mejor oportunidad
6. Usá inspyra_create_prospect para guardar cada prospecto en la base de datos

Reglas:
- Solo creá empresas REALES que podés verificar que existen
- Sé específico en problemasEncontrados (ej: "Web con SSL vencido", "Sin ficha en Google Maps", "Sin Instagram activo")
- Apuntá a encontrar ${limit} prospectos de calidad, pero no inventes si no encontrás suficientes
- No dupliques prospectos que ya existen

Empezá la investigación ahora.`;
  }

  private spawnClaude(jobId: string, query: string, limit: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const TIMEOUT_MS = 6 * 60 * 1000; // 6 minutes
      const mcpConfigPath = path.join(this.projectRoot, 'openclaw.json');
      const prompt = this.buildPrompt(query, limit);

      const args = [
        '-p', prompt,
        '--mcp-config', mcpConfigPath,
        '--output-format', 'text',
        '--dangerously-skip-permissions',
        '--allowedTools', 'mcp__inspyra__*,WebSearch,WebFetch',
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
