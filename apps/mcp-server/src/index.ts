#!/usr/bin/env node
/**
 * Inspyra MCP Server
 *
 * Security gateway between OpenClaw agents and the Inspyra REST API.
 * Agents never touch PostgreSQL directly — all operations go through this server → API → DB.
 *
 * Usage: AGENT_ID=research node dist/index.js
 *
 * Supported agents: research | opportunity | proposal | meeting | followup
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { InspyraClient } from './client.js';
import { registerProspectTools } from './tools/prospects.tools.js';
import { registerCatalogTools } from './tools/catalog.tools.js';
import { registerIntelTools } from './tools/intel.tools.js';
import { registerPricingTools } from './tools/pricing.tools.js';
import { registerDealTools } from './tools/deals.tools.js';
import { registerOpportunityTools } from './tools/opportunity.tools.js';
import { registerEnrichmentTools } from './tools/enrichment.tools.js';

// ── Agent configuration ───────────────────────────────────────────────────────

type AgentId = 'research' | 'opportunity' | 'enrichment' | 'proposal' | 'meeting' | 'followup';

interface AgentConfig {
  tokenEnvVar: string;
  tools: AgentId[];
  description: string;
}

const AGENT_CONFIGS: Record<AgentId, AgentConfig> = {
  research: {
    tokenEnvVar: 'RESEARCH_AGENT_TOKEN',
    tools: ['research'],
    description: 'Research Agent — searches companies, detects problems, creates prospects',
  },
  opportunity: {
    tokenEnvVar: 'OPPORTUNITY_AGENT_TOKEN',
    tools: ['opportunity'],
    description: 'Opportunity Agent — analyzes prospects, scores them, recommends services',
  },
  enrichment: {
    tokenEnvVar: 'ENRICHMENT_AGENT_TOKEN',
    tools: ['enrichment'],
    description: 'Enrichment Agent — finds contact data, digital presence and decision makers for APROBADO_IA/PRIORIDAD_MAXIMA prospects',
  },
  proposal: {
    tokenEnvVar: 'PROPOSAL_AGENT_TOKEN',
    tools: ['proposal'],
    description: 'Proposal Agent — builds proposals using catalog prices only (read-only)',
  },
  meeting: {
    tokenEnvVar: 'MEETING_AGENT_TOKEN',
    tools: ['meeting'],
    description: 'Meeting Agent — prepares briefs and saves meeting notes to deals',
  },
  followup: {
    tokenEnvVar: 'FOLLOWUP_AGENT_TOKEN',
    tools: ['followup'],
    description: 'Follow-up Agent — detects stalled deals and recommends next actions',
  },
};

// ── Tool registration per agent ───────────────────────────────────────────────

function registerToolsForAgent(agentId: AgentId, server: McpServer, client: InspyraClient): void {
  switch (agentId) {
    case 'research':
      // Research: investigate, detect problems, create prospects + intel analysis
      // Pricing deliberately excluded — belongs to Proposal Agent
      registerProspectTools(server, client);
      registerIntelTools(server, client);
      break;

    case 'opportunity':
      // Opportunity: score prospects, submit validations, list pending work
      registerProspectTools(server, client);
      registerCatalogTools(server, client);
      registerIntelTools(server, client);
      registerOpportunityTools(server, client);
      break;

    case 'enrichment':
      // Enrichment: find contact data + digital presence for score >= 75 prospects
      registerProspectTools(server, client);
      registerEnrichmentTools(server, client);
      break;

    case 'proposal':
      // Proposal: read-only — prospects + catalog + pricing
      registerProspectTools(server, client);
      registerCatalogTools(server, client);
      registerPricingTools(server, client);
      break;

    case 'meeting':
      // Meeting: read deals + prospects, write notes only
      registerDealTools(server, client);
      registerProspectTools(server, client);
      break;

    case 'followup':
      // Follow-up: read stalled deals + prospects, write next action only
      registerDealTools(server, client);
      registerProspectTools(server, client);
      break;
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const agentId = (process.env['AGENT_ID'] ?? 'research') as AgentId;

  if (!(agentId in AGENT_CONFIGS)) {
    console.error(`ERROR: Unknown AGENT_ID="${agentId}". Valid: ${Object.keys(AGENT_CONFIGS).join(', ')}`);
    process.exit(1);
  }

  const config = AGENT_CONFIGS[agentId];
  const token = process.env[config.tokenEnvVar];

  if (!token) {
    console.error(`ERROR: ${config.tokenEnvVar} env variable is required for agent "${agentId}"`);
    console.error(`Set it in .env or export ${config.tokenEnvVar}=<your-service-token>`);
    process.exit(1);
  }

  const apiUrl = process.env['INSPYRA_API_URL'] ?? 'http://localhost:3001/api/v1';

  const client = new InspyraClient(token, agentId);

  const server = new McpServer({
    name: `inspyra-${agentId}-agent`,
    version: '0.1.0',
  });

  registerToolsForAgent(agentId, server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`[Inspyra MCP] ${config.description}`);
  console.error(`[Inspyra MCP] API: ${apiUrl}`);
  console.error(`[Inspyra MCP] Agent: ${agentId} | Transport: stdio`);
}

main().catch((error: unknown) => {
  console.error('[Inspyra MCP] Fatal error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
