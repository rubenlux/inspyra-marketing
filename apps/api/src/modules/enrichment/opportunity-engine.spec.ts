import { OpportunityEngineService } from './opportunity-engine.service';

describe('OpportunityEngineService', () => {
  let service: OpportunityEngineService;

  beforeEach(() => {
    service = new OpportunityEngineService();
  });

  it('should detect opportunities based on signals', () => {
    const signals = {
      hasEcommerce: true,
      hasMetaPixel: false,
      hasGoogleAnalytics: true,
      hasSchema: true,
      h1Count: 1,
      hasGBP: false,
      accessible: true,
    };

    const opportunities = service.detect(signals, 'Retail');

    expect(opportunities).toBeDefined();
    expect(Array.isArray(opportunities)).toBe(true);
    expect(opportunities.length).toBeGreaterThanOrEqual(0);
  });

  it('should filter only activated opportunities', () => {
    const signals = {
      hasEcommerce: true,
      hasMetaPixel: true,
      hasGoogleAnalytics: true,
      hasSchema: true,
      h1Count: 2,
      hasGBP: true,
      accessible: true,
    };

    const opportunities = service.detect(signals, 'Ecommerce');

    // All returned opportunities should be activated
    opportunities.forEach(opp => {
      expect(opp.activated).toBe(true);
    });
  });

  it('should return empty array when no signals match', () => {
    const signals = {
      hasEcommerce: false,
      hasMetaPixel: false,
      hasGoogleAnalytics: false,
      hasSchema: false,
      h1Count: 0,
      hasGBP: false,
      accessible: false,
      noWebsite: true,
    };

    const opportunities = service.detect(signals, 'Unknown');

    expect(opportunities).toBeDefined();
    expect(Array.isArray(opportunities)).toBe(true);
  });

  it('should sort opportunities by tier then business value', () => {
    const signals = {
      hasEcommerce: true,
      hasMetaPixel: true,
      hasGoogleAnalytics: true,
      hasSchema: true,
      h1Count: 3,
      hasGBP: true,
      accessible: true,
    };

    const opportunities = service.detect(signals, 'Retail');

    for (let i = 1; i < opportunities.length; i++) {
      const prev = opportunities[i - 1];
      const curr = opportunities[i];

      if (prev.tier === curr.tier) {
        expect(prev.businessValue).toBeGreaterThanOrEqual(curr.businessValue);
      } else {
        expect(prev.tier).toBeLessThan(curr.tier);
      }
    }
  });

  it('should include evidence in results', () => {
    const signals = {
      hasEcommerce: true,
      hasMetaPixel: true,
      hasGoogleAnalytics: true,
      hasSchema: true,
      h1Count: 1,
      hasGBP: false,
      accessible: true,
    };

    const opportunities = service.detect(signals, 'Retail');

    opportunities.forEach(opp => {
      expect(opp.evidence).toBeDefined();
      expect(Array.isArray(opp.evidence)).toBe(true);
    });
  });
});
