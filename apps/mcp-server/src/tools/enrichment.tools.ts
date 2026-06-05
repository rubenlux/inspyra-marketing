import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { InspyraClient } from '../client.js';

export function registerEnrichmentTools(server: McpServer, client: InspyraClient): void {

  server.registerTool(
    'inspyra_enrich_prospect',
    {
      title: 'Enrich Prospect',
      description: `Trigger the Enrichment Agent for a prospect.
IMPORTANT: Only works for prospects with score >= 75 (APROBADO_IA or PRIORIDAD_MAXIMA).
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
}
