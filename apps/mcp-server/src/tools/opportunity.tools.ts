import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { InspyraClient } from '../client.js';

interface IntelResult {
  problema: string;
  prioridad: string;
  serviciosRecomendados: string[];
  ticketEstimadoUsd: number;
  bundleSugerido: string | null;
}

interface CatalogItem {
  id: string;
  nombre: string;
  precioBaseUsd: string;
  billingModelDefault: string;
}

const PRIORITY_WEIGHT: Record<string, number> = { CRITICA: 4, ALTA: 3, MEDIA: 2, BAJA: 1 };

function calcScore(problems: string[], analysis: IntelResult[], estimatedTicket: number, serviceFit: number): number {
  // Component 1: Problem count (max 25)
  const problemScore = problems.length >= 5 ? 25 : problems.length >= 3 ? 15 : 10;

  // Component 2: Priority level (max 25)
  const maxPriority = Math.max(...analysis.map((r) => PRIORITY_WEIGHT[r.prioridad] ?? 0), 0);
  const priorityScore = Math.round((maxPriority / 4) * 25);

  // Component 3: Service fit — how many problems Inspyra can solve (max 25)
  const fitScore = serviceFit > 0.75 ? 25 : serviceFit > 0.5 ? 15 : serviceFit > 0.25 ? 8 : 0;

  // Component 4: Ticket potential (max 25)
  const ticketScore = estimatedTicket > 3000 ? 25 : estimatedTicket > 2000 ? 20 : estimatedTicket > 1000 ? 12 : estimatedTicket > 500 ? 5 : 0;

  return Math.min(problemScore + priorityScore + fitScore + ticketScore, 100);
}

export function registerOpportunityTools(server: McpServer, client: InspyraClient): void {

  // ── 1. Score Opportunity ────────────────────────────────────────────────────
  server.registerTool(
    'inspyra_score_opportunity',
    {
      title: 'Score Opportunity',
      description: `Analyze a prospect and compute a commercial opportunity score (0–100).

Uses the Service Intelligence Engine and Pricing Engine:
1. Reads the prospect's detected problems
2. Maps them to Inspyra services (analyze_problems)
3. Calculates the estimated ticket (Pricing Engine)
4. Produces a transparent 4-component score:
   - Problem count (max 25)
   - Severity level (max 25)
   - Service fit: how many problems Inspyra can solve (max 25)
   - Ticket potential (max 25)

Call this BEFORE inspyra_submit_validation.
Never invent services or prices — they come from the catalog.`,
      inputSchema: z.object({
        prospectId: z.string().uuid().describe('Prospect UUID to score'),
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ prospectId }) => {
      // Step 1: Get prospect
      const prospect = await client.get(`/prospects/${prospectId}`);
      const problems = (prospect['problemasEncontrados'] as string[]) ?? [];

      if (problems.length === 0) {
        const result = {
          prospectId,
          score: 0,
          message: 'No problems detected — Research Agent must run first',
          components: null,
        };
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }], structuredContent: result };
      }

      // Step 2: Service Intelligence
      const rawIntel = await client.get('/service-intelligence/analyze', { problems: problems.join(',') });
      const analysis = (Array.isArray(rawIntel) ? rawIntel : [rawIntel]) as IntelResult[];

      // Step 3: Find catalog matches for recommended services
      const rawCatalog = await client.get('/service-catalog', { soloActivos: 'true' });
      const catalog = (Array.isArray(rawCatalog) ? rawCatalog : []) as CatalogItem[];
      const recommendedNames = [...new Set(analysis.flatMap((r) => r.serviciosRecomendados))];
      const matchedItems = catalog.filter((i) => recommendedNames.includes(i['nombre'] as string));

      // Step 4: Pricing
      let estimatedTicketUsd = 0;
      let mrrPotencial = 0;

      if (matchedItems.length > 0) {
        const pricingResult = await client.post('/pricing/calculate', {
          items: matchedItems.map((i) => ({ catalogItemId: i.id, cantidad: 1 })),
        }) as Record<string, number>;
        estimatedTicketUsd = pricingResult['total'] ?? 0;
        mrrPotencial = pricingResult['mrrNuevo'] ?? 0;
      }

      // Step 5: Score
      const serviceFit = problems.length > 0 ? matchedItems.length / Math.max(recommendedNames.length, 1) : 0;
      const score = calcScore(problems, analysis, estimatedTicketUsd, serviceFit);

      const topPrioridad = analysis.reduce((best, r) => {
        return (PRIORITY_WEIGHT[r.prioridad] ?? 0) > (PRIORITY_WEIGHT[best] ?? 0) ? r.prioridad : best;
      }, 'BAJA');

      const result = {
        prospectId,
        score,
        topPrioridad,
        servicesRecommended: recommendedNames,
        estimatedTicketUsd,
        mrrPotencial,
        components: {
          problemCount: problems.length,
          problemScore: problems.length >= 5 ? 25 : problems.length >= 3 ? 15 : 10,
          priorityScore: Math.round((Math.max(...analysis.map((r) => PRIORITY_WEIGHT[r.prioridad] ?? 0), 0) / 4) * 25),
          fitScore: serviceFit > 0.75 ? 25 : serviceFit > 0.5 ? 15 : serviceFit > 0.25 ? 8 : 0,
          ticketScore: estimatedTicketUsd > 3000 ? 25 : estimatedTicketUsd > 2000 ? 20 : estimatedTicketUsd > 1000 ? 12 : estimatedTicketUsd > 500 ? 5 : 0,
        },
        analysis,
      };

      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }], structuredContent: result };
    },
  );

  // ── 2. Submit Validation ───────────────────────────────────────────────────
  server.registerTool(
    'inspyra_submit_validation',
    {
      title: 'Submit Opportunity Validation',
      description: `Submit the Opportunity Agent's scoring assessment for human review.

Creates a prospect_validation record. A human will compare their score vs the agent score.
That delta is the training signal that improves the scoring algorithm over time.

Always call inspyra_score_opportunity first.
Never invent the score — use the value returned by inspyra_score_opportunity.`,
      inputSchema: z.object({
        prospectId: z.string().uuid().describe('Prospect UUID'),
        agentScore: z.number().int().min(0).max(100).describe('Score from inspyra_score_opportunity'),
        servicesRecommended: z.array(z.string()).describe('Service names from catalog'),
        estimatedTicketUsd: z.number().min(0).describe('Estimated ticket from pricing engine'),
        prioridad: z.enum(['BAJA', 'MEDIA', 'ALTA']).describe('Commercial priority'),
        reasoning: z.string().optional().describe('Brief explanation of the score'),
        decisionFactors: z.object({
          problemScore: z.number(),
          priorityScore: z.number(),
          fitScore: z.number(),
          ticketScore: z.number(),
        }).optional().describe('Score component breakdown from inspyra_score_opportunity'),
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async (body) => {
      const data = await client.post('/prospect-validations', body);
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }], structuredContent: data };
    },
  );

  // ── 3. List Pending Validations ────────────────────────────────────────────
  server.registerTool(
    'inspyra_list_pending_validations',
    {
      title: 'List Prospects Needing Opportunity Scoring',
      description: `List prospects that have been investigated by the Research Agent but not yet scored.

Returns prospects with estado=INVESTIGADO or ENRIQUECIDO that have no validation record.
Use this to find your next work queue.`,
      inputSchema: z.object({
        limit: z.number().int().min(1).max(20).default(10),
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ limit }) => {
      // Get prospects in INVESTIGADO/ENRIQUECIDO state
      const prospects = await client.get('/prospects', {
        estado: 'INVESTIGADO',
        limit,
        page: 1,
      });

      // Get existing validations
      const validations = await client.get('/prospect-validations', {});

      const validatedIds = new Set(
        (Array.isArray(validations) ? validations : [])
          .map((v: Record<string, unknown>) => v['prospectId'] as string)
      );

      const prospectList = (
        ((prospects as Record<string, unknown>)['data'] as unknown[]) ?? []
      ) as Record<string, unknown>[];

      const pending = prospectList.filter((p) => !validatedIds.has(p['id'] as string));

      const result = {
        pendingCount: pending.length,
        prospects: pending.map((p) => ({
          id: p['id'],
          nombreEmpresa: p['nombreEmpresa'],
          ciudad: p['ciudad'],
          problemasEncontrados: p['problemasEncontrados'],
          score: p['score'],
        })),
      };

      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }], structuredContent: result };
    },
  );
}
