import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { InspyraClient } from '../client.js';

const CategoriaEnum = z.enum([
  'WEB', 'SEO', 'ADS', 'BRANDING', 'HOSTING',
  'CLOUD', 'SOFTWARE', 'EMAIL_MKT', 'SOPORTE', 'CONSULTORIA',
]);

export function registerCatalogTools(server: McpServer, client: InspyraClient): void {

  server.registerTool(
    'inspyra_get_service_catalog',
    {
      title: 'Get Service Catalog',
      description: `Get all active services from Inspyra's price catalog with real base prices.
ALWAYS call this before generating any proposal. Never invent prices or services outside this catalog.
Returns list of items with: id, nombre, categoria, precioBaseUsd, billingModelDefault.`,
      inputSchema: z.object({
        categoria: CategoriaEnum.optional().describe('Filter by category: WEB, SEO, ADS, BRANDING, HOSTING, CLOUD, SOFTWARE, EMAIL_MKT, SOPORTE, CONSULTORIA'),
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ categoria }) => {
      const params: Record<string, string> = {};
      if (categoria) params['categoria'] = categoria;
      const data = await client.get('/service-catalog', params);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data };
    },
  );

  server.registerTool(
    'inspyra_get_catalog_item',
    {
      title: 'Get Catalog Item',
      description: `Get a single catalog item by UUID with full pricing details and default billing model.`,
      inputSchema: z.object({
        id: z.string().uuid().describe('Catalog item UUID'),
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ id }) => {
      const data = await client.get(`/service-catalog/${id}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data };
    },
  );
}
