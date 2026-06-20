import type { DiscoveryProvider, DiscoveryResult, RawCompany } from './discovery-provider.interface';
import { DiscoveryInfrastructureError } from './discovery-provider.interface';

type SpawnAgenticFn = (prompt: string, model: string, idleMs: number, totalMs: number) => Promise<string>;
type SpawnTextFn = (prompt: string, model: string, timeoutMs: number) => Promise<string>;
type LoggerLike = { log(msg: string): void; warn(msg: string): void };

export class AgenticDiscoveryProvider implements DiscoveryProvider {
  constructor(
    private readonly spawnAgentic: SpawnAgenticFn,
    private readonly spawnText: SpawnTextFn,
    private readonly logger: LoggerLike,
  ) {}

  async discover(query: string, limit: number): Promise<DiscoveryResult> {
    const queries = await this.generateSubQueries(query, 3);
    this.logger.log(`[AgenticDiscovery] Queries (${queries.length}): ${queries.join(' | ')}`);

    const perQueryLimit = Math.min(15, Math.ceil(limit / queries.length) * 2);
    const results: RawCompany[] = [];
    let sinEvidencia = 0;

    for (const q of queries) {
      try {
        const { companies, sinEvidencia: qSinEv } = await this.searchCompanies(q, perQueryLimit);
        results.push(...companies);
        sinEvidencia += qSinEv;
        this.logger.log(`[AgenticDiscovery] "${q}" → ${companies.length} con evidencia, ${qSinEv} sin evidencia`);
      } catch (err) {
        this.logger.warn(`[AgenticDiscovery] Query "${q}" failed: ${(err as Error).message}`);
      }
    }

    // Intra-batch dedup by name + domain
    const seenDomains = new Set<string>();
    const seenNames = new Set<string>();
    const unique = results.filter(c => {
      const nameKey = c.nombreEmpresa.toLowerCase().trim();
      if (seenNames.has(nameKey)) return false;
      seenNames.add(nameKey);
      if (c.website) {
        const domain = this.normalizeDomain(c.website);
        if (domain && seenDomains.has(domain)) return false;
        if (domain) seenDomains.add(domain);
      }
      return true;
    });

    this.logger.log(`[AgenticDiscovery] Total: ${results.length} raw → ${unique.length} unique (${results.length - unique.length} intra-batch dupes)`);

    return {
      companies: unique.slice(0, limit * 2).map(c => ({ ...c, source: 'agentic_web_search' as const })),
      sinEvidencia,
    };
  }

  private async generateSubQueries(query: string, count: number): Promise<string[]> {
    const prompt = `Genera exactamente ${count} queries de búsqueda web DIVERSIFICADAS para encontrar empresas reales que coincidan con: "${query}"

Reglas ESTRICTAS:
- Las queries deben encontrar EMPRESAS, no filtrar por sus características digitales
- CORRECTO: "restaurantes mendoza", "bodegas premium argentina"
- INCORRECTO: "restaurantes sin web", "bodegas con SEO malo"
- Variar geografía y ángulos entre queries
- Objetivo: MAXIMIZAR diversidad de empresas reales encontradas

Devuelve SOLO un JSON array de strings, sin markdown:
["query 1", "query 2", "query 3"]`;

    try {
      const output = await this.spawnText(prompt, 'claude-sonnet-4-6', 60_000);
      const match = output.match(/\[[\s\S]*?\]/);
      if (!match) {
        const lower = output.toLowerCase();
        const code: DiscoveryInfrastructureError['code'] = /limit|exceeded|budget|quota/i.test(lower)
          ? 'API_BUDGET_EXCEEDED'
          : 'INVALID_JSON';
        throw new DiscoveryInfrastructureError(code, 'Fallo al generar subqueries', output);
      }
      const parsed = JSON.parse(match[0]) as string[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed.slice(0, count) : [query];
    } catch (err) {
      if (err instanceof DiscoveryInfrastructureError) throw err;
      return [query];
    }
  }

  private async searchCompanies(query: string, limit: number): Promise<{ companies: RawCompany[]; sinEvidencia: number }> {
    const prompt = `Usa web_search para buscar: "${query}"

Extraé de los resultados de búsqueda hasta ${limit} empresas REALES que hayan aparecido.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠ CONTRATO ANTI-ALUCINACIÓN — OBLIGATORIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. NO inventes empresas. SOLO las que aparecieron explícitamente en los resultados.
2. Cada empresa DEBE tener al menos UNO de: website, instagram, linkedin.
3. Si no hay ningún canal verificable → NO incluirla.
4. NO incluyas directorios, listados, artículos, marketplaces — solo empresas individuales.

Responde SOLO un JSON array válido, sin markdown:
[{
  "nombreEmpresa": "Nombre exacto",
  "website": "https://... o null",
  "instagram": "https://instagram.com/... o null",
  "linkedin": "https://linkedin.com/... o null",
  "ciudad": "Ciudad",
  "pais": "País",
  "provincia": "Provincia o null",
  "rubro": "Sector/industria",
  "descripcion": "Qué hace la empresa (máx 1 oración)",
  "empleadosEstimado": null,
  "añosFundacion": null,
  "presenciaDigital": { "tieneWeb": true, "tieneSeo": false, "tieneRedes": false, "tieneEcommerce": false, "tieneAgendaOnline": false },
  "facturacionEstimada": null
}]`;

    const output = await this.spawnAgentic(prompt, 'claude-sonnet-4-6', 60_000, 180_000);

    let parsed: RawCompany[] = [];
    try {
      parsed = JSON.parse(output.trim()) as RawCompany[];
    } catch {
      const match = output.match(/\[[\s\S]*\]/);
      if (match) {
        try { parsed = JSON.parse(match[0]) as RawCompany[]; } catch { /* irreparable */ }
      }
    }

    if (!Array.isArray(parsed)) {
      const lower = output.toLowerCase();
      let code: DiscoveryInfrastructureError['code'] = 'UNKNOWN';
      if (/limit|exceeded|budget|quota/i.test(lower)) code = 'API_BUDGET_EXCEEDED';
      else if (/timeout/i.test(lower)) code = 'WEBSEARCH_TIMEOUT';
      else if (/mcp|tool/i.test(lower)) code = 'MCP_UNAVAILABLE';
      else code = 'INVALID_JSON';
      throw new DiscoveryInfrastructureError(code, 'El agente falló en devolver entidades válidas', output);
    }

    const withEvidence = parsed.filter(c => c.nombreEmpresa && (c.website || c.instagram || c.linkedin));

    for (const c of withEvidence) {
      const pdType = c.presenciaDigital == null ? 'null' : typeof c.presenciaDigital;
      const empType = c.empleadosEstimado == null ? 'null' : typeof c.empleadosEstimado;
      this.logger.log(`[AgenticDiscovery] ${c.nombreEmpresa} | web:${c.website ?? 'null'} | ig:${c.instagram ?? 'null'} | presenciaDigital(${pdType}) | empleados(${empType}):${c.empleadosEstimado ?? 'null'}`);
    }

    return { companies: withEvidence, sinEvidencia: parsed.length - withEvidence.length };
  }

  private normalizeDomain(urlOrDomain: string): string | null {
    try {
      const withScheme = urlOrDomain.startsWith('http') ? urlOrDomain : `https://${urlOrDomain}`;
      return new URL(withScheme).hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      return null;
    }
  }
}
