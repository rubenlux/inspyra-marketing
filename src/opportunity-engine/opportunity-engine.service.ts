/**
 * OPPORTUNITY ENGINE — Deterministic service opportunity detection
 *
 * Consumes: SERVICES_CATALOG_MACHINE.json + signals + industry
 * Output: List of activated opportunities with full traceability
 *
 * NO Claude, NO scoring, NO inference.
 * Pure deterministic rule evaluation.
 */

export interface Signal {
  [key: string]: any;
}

export interface RequiredSignal {
  signal: string;
  operator: 'equals' | 'in' | 'includes_any' | 'greater_than' | 'less_than' | 'not_empty';
  value: any;
}

export interface OptionalGroup {
  [index: number]: RequiredSignal[];
}

export interface Service {
  serviceId: string;
  tier: number;
  name: string;
  businessValue: number;
  requiredSignals: RequiredSignal[];
  optionalGroups: OptionalGroup;
  minOptionalMatches: number;
  forbiddenSignals: RequiredSignal[];
}

export interface MatchedSignal {
  signal: string;
  operator: string;
  expected: any;
  actual: any;
  matched: boolean;
}

export interface Opportunity {
  serviceId: string;
  name: string;
  tier: number;
  businessValue: number;
  matchedRequiredSignals: MatchedSignal[];
  matchedOptionalGroups: {
    groupIndex: number;
    signals: MatchedSignal[];
    matched: boolean;
  }[];
  rejectedForbiddenSignals: MatchedSignal[];
  evidence: string[];
  activated: boolean;
}

export class OpportunityEngine {
  private catalog: Service[];

  constructor(catalog: Service[]) {
    this.catalog = catalog;
  }

  /**
   * Main evaluation method
   *
   * Returns: List of activated opportunities, ordered by TIER + businessValue
   */
  evaluate(signals: Signal, industry: string): Opportunity[] {
    const results: Opportunity[] = [];

    for (const service of this.catalog) {
      const opportunity = this.evaluateService(service, signals, industry);
      results.push(opportunity);
    }

    // Filter activated + sort by TIER asc, businessValue desc
    return results
      .filter(opp => opp.activated)
      .sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        return b.businessValue - a.businessValue;
      });
  }

  /**
   * Evaluate a single service against signals
   */
  private evaluateService(service: Service, signals: Signal, industry: string): Opportunity {
    const opportunity: Opportunity = {
      serviceId: service.serviceId,
      name: service.name,
      tier: service.tier,
      businessValue: service.businessValue,
      matchedRequiredSignals: [],
      matchedOptionalGroups: [],
      rejectedForbiddenSignals: [],
      evidence: [],
      activated: false,
    };

    // ====================================================================
    // STEP 1: Evaluate required signals (ALL must match)
    // ====================================================================
    const requiredMatch = this.evaluateRequiredSignals(
      service.requiredSignals,
      signals,
      industry
    );

    opportunity.matchedRequiredSignals = requiredMatch.matches;

    if (!requiredMatch.allMatch) {
      opportunity.evidence.push(
        `Required signals not met: ${requiredMatch.matches
          .filter(m => !m.matched)
          .map(m => `${m.signal}=${m.expected}`)
          .join(', ')}`
      );
      return opportunity;
    }

    opportunity.evidence.push(
      `✓ All required signals matched: ${requiredMatch.matches
        .map(m => `${m.signal}=${m.actual}`)
        .join(', ')}`
    );

    // ====================================================================
    // STEP 2: Evaluate optional groups (at least N must match)
    // ====================================================================
    const optionalMatch = this.evaluateOptionalGroups(
      service.optionalGroups,
      service.minOptionalMatches,
      signals,
      industry
    );

    opportunity.matchedOptionalGroups = optionalMatch.groupResults;

    const matchedGroupCount = optionalMatch.groupResults.filter(g => g.matched).length;
    if (matchedGroupCount < service.minOptionalMatches) {
      opportunity.evidence.push(
        `Optional signals insufficient: ${matchedGroupCount}/${service.minOptionalMatches} groups matched`
      );
      return opportunity;
    }

    opportunity.evidence.push(
      `✓ Optional signals satisfied: ${matchedGroupCount}/${service.minOptionalMatches} groups matched`
    );

    // ====================================================================
    // STEP 3: Evaluate forbidden signals (NONE must match)
    // ====================================================================
    const forbiddenMatch = this.evaluateForbiddenSignals(
      service.forbiddenSignals,
      signals,
      industry
    );

    opportunity.rejectedForbiddenSignals = forbiddenMatch.matches;

    const anyForbidden = forbiddenMatch.matches.some(m => m.matched);
    if (anyForbidden) {
      opportunity.evidence.push(
        `Forbidden signals present: ${forbiddenMatch.matches
          .filter(m => m.matched)
          .map(m => `${m.signal}=${m.actual}`)
          .join(', ')}`
      );
      return opportunity;
    }

    if (forbiddenMatch.matches.length > 0) {
      opportunity.evidence.push(
        `✓ No forbidden signals present`
      );
    }

    // ====================================================================
    // ACTIVATION
    // ====================================================================
    opportunity.activated = true;
    opportunity.evidence.unshift(`✅ ACTIVATED: ${service.name}`);

    return opportunity;
  }

  /**
   * Evaluate required signals
   * ALL must match for pass
   */
  private evaluateRequiredSignals(
    requiredSignals: RequiredSignal[],
    signals: Signal,
    industry: string
  ): {
    matches: MatchedSignal[];
    allMatch: boolean;
  } {
    const matches: MatchedSignal[] = [];

    for (const req of requiredSignals) {
      const match = this.evaluateSignal(req, signals, industry);
      matches.push(match);
    }

    return {
      matches,
      allMatch: matches.every(m => m.matched),
    };
  }

  /**
   * Evaluate optional groups
   * At least N groups must have ALL their signals match
   */
  private evaluateOptionalGroups(
    optionalGroups: OptionalGroup,
    minGroupMatches: number,
    signals: Signal,
    industry: string
  ): {
    groupResults: {
      groupIndex: number;
      signals: MatchedSignal[];
      matched: boolean;
    }[];
  } {
    const groupResults = [];

    // Convert optionalGroups object to array
    const groupArray = Object.values(optionalGroups);

    for (let i = 0; i < groupArray.length; i++) {
      const group = groupArray[i];
      const groupMatches: MatchedSignal[] = [];

      for (const signal of group) {
        const match = this.evaluateSignal(signal, signals, industry);
        groupMatches.push(match);
      }

      const groupMatched = groupMatches.every(m => m.matched);

      groupResults.push({
        groupIndex: i,
        signals: groupMatches,
        matched: groupMatched,
      });
    }

    return { groupResults };
  }

  /**
   * Evaluate forbidden signals
   * NONE must match for pass
   */
  private evaluateForbiddenSignals(
    forbiddenSignals: RequiredSignal[],
    signals: Signal,
    industry: string
  ): {
    matches: MatchedSignal[];
  } {
    const matches: MatchedSignal[] = [];

    for (const forbidden of forbiddenSignals) {
      const match = this.evaluateSignal(forbidden, signals, industry);
      matches.push(match);
    }

    return { matches };
  }

  /**
   * Evaluate a single signal
   * Returns: MatchedSignal with actual value and result
   */
  private evaluateSignal(
    signalDef: RequiredSignal,
    signals: Signal,
    industry: string
  ): MatchedSignal {
    const signalName = signalDef.signal;
    const actual = signals[signalName];
    const expected = signalDef.value;
    const operator = signalDef.operator;

    let matched = false;

    switch (operator) {
      case 'equals':
        matched = actual === expected;
        break;

      case 'in':
        // expected is array, actual must be in it
        matched = Array.isArray(expected) && expected.includes(actual);
        break;

      case 'includes_any':
        // expected is array, actual must include any
        if (Array.isArray(actual) && Array.isArray(expected)) {
          matched = actual.some(a => expected.includes(a));
        } else if (typeof actual === 'string' && Array.isArray(expected)) {
          matched = expected.some(e => actual.toLowerCase().includes(e.toLowerCase()));
        }
        break;

      case 'greater_than':
        matched = actual !== undefined && actual > expected;
        break;

      case 'less_than':
        matched = actual !== undefined && actual < expected;
        break;

      case 'not_empty':
        matched = actual !== null && actual !== undefined && actual !== '';
        break;
    }

    return {
      signal: signalName,
      operator,
      expected,
      actual,
      matched,
    };
  }
}
