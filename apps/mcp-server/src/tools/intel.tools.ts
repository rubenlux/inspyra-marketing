import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { InspyraClient } from '../client.js';

export function registerIntelTools(server: McpServer, client: InspyraClient): void {

  server.registerTool(
    'inspyra_analyze_problems',
    {
      title: 'Analyze Digital Problems',
      description: `Map a list of detected digital problems to Inspyra's commercial service recommendations.
This is Inspyra's Service Intelligence Engine — it contains the agency's commercial knowledge.
Use this BEFORE scoring a prospect or building a proposal.

Input: array of problem strings (e.g. ["Sin SEO local", "Web de 2015", "Sin Instagram"])
Returns: for each problem — recommended services, business impact, priority, estimated ticket USD, and bundle suggestion.

IMPORTANT: Use the returned serviciosRecomendados and ticketEstimadoUsd in your scoring and proposal.
Never invent service recommendations outside of this analysis.`,
      inputSchema: z.object({
        problemas: z.array(z.string().min(1))
          .min(1)
          .max(20)
          .describe('List of detected digital problems from research (e.g. ["Sin SEO", "Web desactualizada"])'),
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ problemas }) => {
      const params = { problems: problemas.join(',') };
      const raw = await client.get('/service-intelligence/analyze', params);
      // API returns array — wrap so structuredContent satisfies Record<string, unknown>
      const wrapped = { resultados: Array.isArray(raw) ? raw : [raw] };
      return { content: [{ type: 'text', text: JSON.stringify(wrapped.resultados, null, 2) }], structuredContent: wrapped };
    },
  );
}
