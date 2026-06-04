import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { InspyraClient } from '../client.js';

export function registerDealTools(server: McpServer, client: InspyraClient): void {

  server.registerTool(
    'inspyra_get_deal',
    {
      title: 'Get Deal',
      description: `Get a deal from the sales pipeline by UUID. Returns full record including:
stage history, owner, linked prospect, linked client, and internal notes.
Use before preparing meeting briefs or follow-up messages.`,
      inputSchema: z.object({
        id: z.string().uuid().describe('Deal UUID'),
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ id }) => {
      const data = await client.get(`/deals/${id}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data };
    },
  );

  server.registerTool(
    'inspyra_list_stalled_deals',
    {
      title: 'List Stalled Deals',
      description: `Get all deals that are stalled (no movement beyond their stage threshold).
Returns deals where estancada=true, ordered by value descending.
Use to identify follow-up opportunities and generate outreach messages.`,
      inputSchema: z.object({
        ownerId: z.string().uuid().optional().describe('Filter by owner UUID'),
        limit: z.number().int().min(1).max(50).default(20).describe('Max results'),
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (params) => {
      const queryParams: Record<string, string | number | boolean> = {
        estancada: true,
        limit: params.limit,
      };
      if (params.ownerId) queryParams['ownerId'] = params.ownerId;
      const data = await client.get('/deals', queryParams);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data };
    },
  );

  server.registerTool(
    'inspyra_update_deal_notes',
    {
      title: 'Update Deal Internal Notes',
      description: `Update the internal notes field of a deal. Use to save meeting briefs, summaries, or analysis.
ONLY updates the notasInternas field — cannot change stage, value, owner, or any other field.`,
      inputSchema: z.object({
        id: z.string().uuid().describe('Deal UUID'),
        notasInternas: z.string().min(1).max(5000).describe('Internal notes to save (meeting brief, analysis, etc.)'),
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ id, notasInternas }) => {
      const data = await client.patch(`/deals/${id}`, { notasInternas });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data };
    },
  );

  server.registerTool(
    'inspyra_update_deal_next_action',
    {
      title: 'Update Deal Next Action',
      description: `Set the next recommended action and date for a deal.
ONLY updates proximaAccion and proximaAccionAt fields — cannot change stage, value, or owner.
Use after analyzing a stalled deal to recommend the commercial team's next step.`,
      inputSchema: z.object({
        id: z.string().uuid().describe('Deal UUID'),
        proximaAccion: z.string().min(5).max(500).describe('Description of the next recommended action'),
        proximaAccionAt: z.string().regex(/^\d{4}-\d{2}-\d{2}/).describe('Suggested date in YYYY-MM-DD format'),
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ id, proximaAccion, proximaAccionAt }) => {
      const data = await client.patch(`/deals/${id}`, { proximaAccion, proximaAccionAt });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data };
    },
  );
}
