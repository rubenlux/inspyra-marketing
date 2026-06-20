import { detectSector, detectBusinessModel } from './sectors';
import type { ProspectContext, ServiceOpportunity, ServiceDefinition } from './types';

const SEVERITY_SCORE: Record<string, number> = {
  critical: 90,
  high: 75,
  medium: 55,
  low: 35,
};

export function scoreFromContext(
  ctx: ProspectContext,
  catalog: ServiceDefinition[],
): ServiceOpportunity[] {
  const results: ServiceOpportunity[] = [];

  for (const service of catalog) {
    if (service.sectorFit.length > 0 && !service.sectorFit.includes(ctx.sector)) continue;
    if (service.businessModelFit.length > 0 && !service.businessModelFit.includes(ctx.businessModel)) continue;

    const triggeredDefs = service.signalDefs.filter((sig) => {
      try { return sig.condition(ctx); } catch { return false; }
    });

    if (triggeredDefs.length === 0) continue;

    const maxSeverityScore = Math.max(...triggeredDefs.map((s) => SEVERITY_SCORE[s.severity] ?? 50));
    const multiBonus = Math.min((triggeredDefs.length - 1) * 5, 10);
    const opportunityScore = Math.min(maxSeverityScore + multiBonus, 100);

    results.push({
      serviceId: service.id,
      serviceName: service.name,
      category: service.category,
      opportunityScore,
      signals: triggeredDefs.map((s) => s.label),
      pitchLine: service.pitch,
      estimatedTicketUsd: service.avgTicketUsd,
    });
  }

  return results.sort((a, b) => b.opportunityScore - a.opportunityScore);
}

export function buildProspectContext(prospect: {
  rubro?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  website?: string | null;
  empleadosEstimado?: number | null;
  pais?: string | null;
  ciudad?: string | null;
  problemasEncontrados?: string[] | null;
}): ProspectContext {
  const sector = detectSector(prospect.rubro ?? undefined);
  return {
    rubro: prospect.rubro ?? undefined,
    sector,
    businessModel: detectBusinessModel(sector),
    hasInstagram: Boolean(prospect.instagram),
    hasLinkedIn: Boolean(prospect.linkedin),
    hasWebsite: Boolean(prospect.website),
    empleadosEstimado: prospect.empleadosEstimado ?? undefined,
    pais: prospect.pais ?? undefined,
    ciudad: prospect.ciudad ?? undefined,
    problemasEncontrados: prospect.problemasEncontrados ?? [],
  };
}
