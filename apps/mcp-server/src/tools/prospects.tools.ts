import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { InspyraClient } from '../client.js';

const ProspectEstadoEnum = z.enum([
  'NUEVO', 'INVESTIGADO', 'ENRIQUECIDO', 'LISTO_OUTREACH',
  'CONTACTADO', 'RESPONDIO', 'REUNION_AGENDADA', 'PASO_A_PIPELINE',
  'DESCARTADO', 'ARCHIVADO',
]);

export function registerProspectTools(server: McpServer, client: InspyraClient): void {

  server.registerTool(
    'inspyra_get_prospect_kpis',
    {
      title: 'Get Prospect KPIs',
      description: `Get dashboard KPIs for all prospects: totals, score average, conversion rates.
Returns: { total, nuevosEstaSemana, sinWeb, oportunidadAlta, listosOutreach, enPipeline, scorePromedio }`,
      inputSchema: z.object({}).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      const data = await client.get('/prospects/kpis');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data };
    },
  );

  server.registerTool(
    'inspyra_list_prospects',
    {
      title: 'List Prospects',
      description: `List prospects with optional filters. Use to find prospects for analysis or follow-up.
Filters: estado, ownerId, scoreMin, scoreMax, search (company/contact name), page, limit (max 50).
Returns paginated list with meta: { total, page, totalPages }.`,
      inputSchema: z.object({
        estado: ProspectEstadoEnum.optional().describe('Filter by prospect state'),
        ownerId: z.string().uuid().optional().describe('Filter by assigned owner UUID'),
        scoreMin: z.number().int().min(0).max(100).optional().describe('Minimum score (0-100)'),
        scoreMax: z.number().int().min(0).max(100).optional().describe('Maximum score (0-100)'),
        search: z.string().optional().describe('Search by company name, contact or city'),
        page: z.number().int().min(1).default(1).describe('Page number'),
        limit: z.number().int().min(1).max(50).default(20).describe('Results per page'),
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (params) => {
      const raw = await client.get('/prospects', params as Record<string, string | number | boolean>);
      const wrapped = Array.isArray(raw) ? { items: raw } : raw;
      return { content: [{ type: 'text', text: JSON.stringify(raw, null, 2) }], structuredContent: wrapped };
    },
  );

  server.registerTool(
    'inspyra_get_prospect',
    {
      title: 'Get Prospect',
      description: `Get a single prospect by UUID. Returns full record including owner, creator, and associated deals.`,
      inputSchema: z.object({
        id: z.string().uuid().describe('Prospect UUID'),
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ id }) => {
      const data = await client.get(`/prospects/${id}`);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data };
    },
  );

  server.registerTool(
    'inspyra_create_prospect',
    {
      title: 'Create Prospect',
      description: `Create a new prospect in Inspyra. Only use real data found during research — never invent fields.
The agent is automatically recorded as the creator (detectadoPor: IA).
Do NOT set estado — defaults to NUEVO.`,
      inputSchema: z.object({
        nombreEmpresa: z.string().min(2).describe('Company name (required)'),
        nombreContacto: z.string().optional().describe('Contact person full name'),
        cargo: z.string().optional().describe('Contact job title'),
        telefono: z.string().optional().describe('Phone number'),
        email: z.string().email().optional().describe('Contact email'),
        pais: z.string().optional().describe('Country'),
        ciudad: z.string().optional().describe('City'),
        rubro: z.string().optional().describe('Industry / sector'),
        website: z.string().url().optional().describe('Company website URL'),
        instagram: z.string().optional().describe('Instagram handle'),
        linkedin: z.string().optional().describe('LinkedIn profile URL'),
        problemasEncontrados: z.array(z.string()).default([]).describe('List of detected digital problems'),
        oportunidadDetectada: z.string().optional().describe('Main commercial opportunity description'),
        fuente: z.enum([
          'GOOGLE_MAPS', 'INSTAGRAM', 'LINKEDIN', 'META_ADS_LEAD',
          'GOOGLE_ADS_LEAD', 'FORMULARIO_WEB', 'WHATSAPP', 'CSV_IMPORT', 'REFERRAL', 'MANUAL',
        ]).default('MANUAL').describe('Lead source'),
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async (body) => {
      const data = await client.post('/prospects', { ...body, detectadoPor: 'IA' });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data };
    },
  );

  server.registerTool(
    'inspyra_update_prospect',
    {
      title: 'Update Prospect (limited fields)',
      description: `Update a prospect. ONLY these fields are allowed: score, prioridad, nivelOportunidad,
servicioSugerido, oportunidadDetectada, problemasEncontrados, estado.
Cannot change billing, ownership history, or delete. Estado transitions must be valid.`,
      inputSchema: z.object({
        id: z.string().uuid().describe('Prospect UUID to update'),
        score: z.number().int().min(0).max(100).optional().describe('Commercial priority score (0-100)'),
        prioridad: z.enum(['BAJA', 'MEDIA', 'ALTA']).optional(),
        nivelOportunidad: z.enum(['BAJA', 'MEDIA', 'ALTA', 'CRITICA']).optional(),
        servicioSugerido: z.string().optional().describe('Recommended service from catalog'),
        oportunidadDetectada: z.string().optional().describe('Updated opportunity description'),
        problemasEncontrados: z.array(z.string()).optional().describe('Updated list of detected problems'),
        estado: ProspectEstadoEnum.optional().describe('New state (must follow valid transition)'),
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ id, ...body }) => {
      const data = await client.patch(`/prospects/${id}`, body);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data };
    },
  );
}
