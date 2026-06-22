import { Injectable, Logger } from '@nestjs/common';
import { ClaudeRunnerService } from '../../ia-core/services/claude-runner.service';
import { EVALUATE_OPPORTUNITY_PROMPT } from '../prompts/evaluate-opportunity.prompt';
import type { RawCompany } from '../providers/discovery-provider.interface';
import { DiscoveryInfrastructureError } from '../providers/discovery-provider.interface';

export interface SonnetEvaluation {
  index: number;
  nombreEmpresa: string;
  action: 'PROMOTE' | 'DISCARD';
  score: number;
  scoreBreakdown?: Record<string, number>;
  reasoning?: string;
  discardReason?: string;
  problemasDetectados?: string[];
  oportunidadDetectada?: string;
  servicioSugerido?: string;
  estimatedTicketUsd?: number;
  evidence?: {
    website?: string | null;
    googleBusiness?: string | null;
    linkedin?: string | null;
    facebook?: string | null;
    instagram?: string | null;
  };
}

@Injectable()
export class SonnetEvaluator {
  private readonly logger = new Logger(SonnetEvaluator.name);

  constructor(private readonly claude: ClaudeRunnerService) {}

  async evaluateBatch(companies: RawCompany[], originalIndices: number[]): Promise<SonnetEvaluation[]> {
    const companiesForPrompt = companies.map((c, i) => {
      // qualificationSignals (HTTP scraping) > presenciaDigital (provider flags)
      // true = verificado presente | false = verificado ausente | null = no verificado
      const qs = c.qualificationSignals;
      const pd = c.presenciaDigital;

      const hasInstagram =
        c.instagram ? true
        : qs ? qs.hasInstagram
        : (pd?.tieneRedes === false ? false : null);

      const hasLinkedin =
        c.linkedin ? true
        : qs ? qs.hasLinkedIn
        : (pd?.tieneRedes === false ? false : null);

      return {
        _originalIndex: originalIndices[i],
        nombreEmpresa: c.nombreEmpresa,
        ciudad: c.ciudad,
        pais: c.pais,
        rubro: c.rubro,
        descripcion: c.descripcion,
        empleadosEstimado: c.empleadosEstimado,
        facturacionEstimada: c.facturacionEstimada,
        hasWebsite:     qs?.hasWebsite     ?? !!c.website,
        hasInstagram,
        hasLinkedin,
        hasFacebook:    qs?.hasFacebook    ?? null,
        hasWhatsapp:    qs?.hasWhatsapp    ?? null,
        hasEcommerce:   qs?.hasEcommerce   ?? (pd?.tieneEcommerce   ?? null),
        hasOnlineAgenda: qs?.hasAgenda     ?? (pd?.tieneAgendaOnline ?? null),
        hasSeo:         pd?.tieneSeo       ?? null, // solo el proveedor agéntico lo detecta
        evidence: {
          website:  c.website ?? c.googleMaps ?? null,
          linkedin: c.linkedin  ?? null,
          instagram: c.instagram ?? null,
        },
      };
    });

    const prompt = EVALUATE_OPPORTUNITY_PROMPT(JSON.stringify(companiesForPrompt, null, 2), companies.length);

    try {
      const output = await this.claude.runText(prompt, {
        model: 'claude-sonnet-4-6',
        timeoutMs: 5 * 60 * 1000,
        allowedTools: 'none',
      });

      const match = output.match(/\[[\s\S]*\]/);
      if (!match) {
        const lower = output.toLowerCase();
        let code: DiscoveryInfrastructureError['code'] = 'INVALID_JSON';
        if (/limit|exceeded|budget|quota/i.test(lower)) code = 'API_BUDGET_EXCEEDED';
        else if (/timeout/i.test(lower)) code = 'WEBSEARCH_TIMEOUT';
        
        throw new DiscoveryInfrastructureError(code, 'Sonnet no devolvió output válido', output);
      }

      const parsed = JSON.parse(match[0]) as SonnetEvaluation[];
      if (!Array.isArray(parsed)) throw new Error('Sonnet devolvió JSON no-array');
      return parsed;

    } catch (err) {
      if (err instanceof DiscoveryInfrastructureError) throw err;
      throw new Error(`Error en evaluación Sonnet: ${(err as Error).message}`);
    }
  }
}
