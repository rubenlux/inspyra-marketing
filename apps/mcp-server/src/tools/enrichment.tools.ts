import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { InspyraClient } from '../client.js';

export function registerEnrichmentTools(server: McpServer, client: InspyraClient): void {

  server.registerTool(
    'inspyra_enrich_prospect',
    {
      title: 'Enrich Prospect',
      description: `Trigger the Enrichment Agent for a prospect.
IMPORTANT: Only works for prospects classified APROBADO_IA (Opportunity Score ≥ 75) or PRIORIDAD_MAXIMA (≥ 90).
The Opportunity Agent must have processed the prospect first — Research Score alone is NOT sufficient.
Prospects without a ProspectValidation (PENDIENTE_OPPORTUNITY) will be rejected.
The agent will find: email, phone, WhatsApp, contact form, Google Business, LinkedIn, decision maker.
Results are stored in enrichment_results (separate from prospect record for trazability).
Returns the enrichment job with its ID for polling.`,
      inputSchema: z.object({
        prospectId: z.string().uuid().describe('UUID of the prospect to enrich'),
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ prospectId }) => {
      const data = await client.post('/enrichment/jobs', { prospectId });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data };
    },
  );

  server.registerTool(
    'inspyra_get_enrichment_job',
    {
      title: 'Get Enrichment Job',
      description: `Poll the status of an enrichment job.
Status: PENDING → RUNNING → COMPLETED | FAILED.
When COMPLETED, the result field contains all enriched data including contactable flag.`,
      inputSchema: z.object({
        jobId: z.string().uuid().describe('UUID of the enrichment job'),
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ jobId }) => {
      const data = await client.get(`/enrichment/jobs/${jobId}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data };
    },
  );

  server.registerTool(
    'inspyra_get_enrichment_queue',
    {
      title: 'Get Enrichment Queue',
      description: `Get enrichment queue stats: pending, running, completed, failed jobs and total contactable prospects.
Use before triggering enrichment to understand current queue depth.`,
      inputSchema: z.object({}).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      const data = await client.get('/enrichment/queue');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data };
    },
  );

  server.registerTool(
    'inspyra_get_enrichment_result',
    {
      title: 'Get Enrichment Result',
      description: `Get the enrichment result for a specific prospect.
Returns all contact data, digital presence, company info and decision maker found by the Enrichment Agent.
Also returns contactabilityScore (0-100), confianza (ALTA/MEDIA/BAJA) and reviewStatus (PENDING/APPROVED/REJECTED).
Returns null if the prospect has not been enriched yet.`,
      inputSchema: z.object({
        prospectId: z.string().uuid().describe('UUID of the prospect'),
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ prospectId }) => {
      const data = await client.get(`/enrichment/prospects/${prospectId}/result`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data };
    },
  );

  server.registerTool(
    'inspyra_suggest_enrichment',
    {
      title: 'Suggest Enrichment Review',
      description: `Agents use this to SUGGEST an approval or rejection of an enrichment result.
This does NOT approve or reject — it sets a recommendation that a human will review.
The human sees your suggestion in the UI before making the final decision.

Use SUGGEST_APPROVE when:
- contactabilityScore >= 50
- At least email OR telefono is present
- confianza is ALTA or MEDIA
- The decision maker was identified

Use SUGGEST_REJECT when:
- contactabilityScore < 30
- No real contact channels found
- confianza is BAJA and data looks inferred, not verified

IMPORTANT: Only humans can call /review to actually APPROVE or REJECT.
You can only call /suggest to set a recommendation.`,
      inputSchema: z.object({
        resultId: z.string().uuid().describe('UUID of the EnrichmentResult'),
        recommendedStatus: z.enum(['SUGGEST_APPROVE', 'SUGGEST_REJECT']).describe('Your recommendation'),
        notes: z.string().optional().describe('Reasoning for your suggestion'),
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ resultId, recommendedStatus, notes }) => {
      const data = await client.patch(`/enrichment/results/${resultId}/suggest`, { recommendedStatus, notes });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data };
    },
  );

  server.registerTool(
    'inspyra_get_outreach_queue',
    {
      title: 'Get Outreach Queue',
      description: `Returns the LISTO_OUTREACH queue ordered by Commercial Score DESC.
Commercial Score = floor((opportunityScore + contactabilityScore) / 2).
This is the ranked priority list for outreach — high commercial score = strong opportunity + verified contact data.`,
      inputSchema: z.object({}).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      const data = await client.get('/enrichment/outreach-queue');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data };
    },
  );
}
