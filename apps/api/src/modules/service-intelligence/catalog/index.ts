export * from './types';
export * from './sectors';
export { SIR_CATALOG, INSPYRA_SERVICE_IDS } from './catalog';
export { scoreFromContext, buildProspectContext } from './scoring';
export {
  findAllServiceMatches,
  findBestServiceMatch,
  calcContactability,
  MATCH_TYPE_SCORE,
  IMPACT_SCORE,
  PROBLEM_MATCH_CATALOG,
} from './problem-match';
export type { MatchType, ImpactLevel, ServiceMatchResult, ProblemMatchRule } from './problem-match';
