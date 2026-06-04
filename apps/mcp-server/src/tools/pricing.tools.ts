import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { InspyraClient } from '../client.js';

export function registerPricingTools(server: McpServer, client: InspyraClient): void {

  server.registerTool(
    'inspyra_calculate_pricing',
    {
      title: 'Calculate Pricing',
      description: `Calculate exact USD prices for a set of services from Inspyra's catalog.
ALWAYS call this before presenting any prices in a proposal. Never calculate or estimate prices yourself.

Input: list of catalog item IDs with quantities, optional bundle name.
Returns: per-item breakdown (precioBase, descuento, precioFinal, billing), subtotal, total, mrrNuevo, pagoInicialUsd.

Use the returned values verbatim in proposals — do not round, adjust, or modify them.`,
      inputSchema: z.object({
        items: z.array(z.object({
          catalogItemId: z.string().uuid().describe('Catalog item UUID (from inspyra_get_service_catalog)'),
          cantidad: z.number().int().min(1).default(1).describe('Quantity'),
        })).min(1).max(20).describe('Services to price'),
        bundle: z.string().optional().describe('Bundle name if applicable (e.g. "SEO + Web") for potential discounts'),
        descuentoManual: z.number().min(0).max(50).default(0).describe('Manual discount percentage (0-50). Requires commercial approval.'),
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (body) => {
      const data = await client.post('/pricing/calculate', body);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data };
    },
  );
}
