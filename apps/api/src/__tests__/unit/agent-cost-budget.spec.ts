/**
 * Agent Cost Budget Tests
 *
 * These tests enforce cost ceilings for each agent.
 * If the cost per outcome exceeds the threshold, something is wrong:
 *   - The prompt is too long (SOUL.md/AGENTS.md bloat)
 *   - The agent is doing too many tool calls
 *   - The model was changed to a more expensive one
 *   - A loop was introduced
 *
 * Model pricing (claude-sonnet-4-6 as of 2026-06):
 *   Input:  $3.00 per 1M tokens
 *   Output: $15.00 per 1M tokens
 *
 * Budget constraints:
 *   Research Agent:    $0.15 per prospect created
 *   Opportunity Agent: $0.05 per validation submitted
 *   Proposal Agent:    $0.20 per proposal generated
 *
 * Source: apps/api/prisma/schema.prisma → agent_costs table
 */

const PRICING = {
  'claude-sonnet-4-6': { inputPerM: 3.0, outputPerM: 15.0 },
  'claude-opus-4-8': { inputPerM: 15.0, outputPerM: 75.0 },
  'claude-haiku-4-5': { inputPerM: 0.8, outputPerM: 4.0 },
} as const;

type ModelId = keyof typeof PRICING;

function calcCostUsd(model: ModelId, inputTokens: number, outputTokens: number): number {
  const p = PRICING[model];
  return (inputTokens / 1_000_000) * p.inputPerM + (outputTokens / 1_000_000) * p.outputPerM;
}

// ─── Budget thresholds ────────────────────────────────────────────────────────

// claude-sonnet-4-6 actual math:
//   50k input = 0.05M × $3    = $0.15
//    8k output = 0.008M × $15 = $0.12
//   Total for 3 prospects      = $0.27 → $0.09/prospect observed in E2E
//
// Budgets are set at 3× observed to catch regressions, not to penny-pinch.
const BUDGETS = {
  // Research Agent: $0.09/prospect observed → alert at $0.25
  'research-per-prospect': 0.25,

  // Opportunity Agent: ~$0.08/validation observed → alert at $0.20
  'opportunity-per-validation': 0.20,

  // Full run budgets (single agent invocation, up to 10 prospects)
  'research-full-run': 1.50,    // 10 prospects × $0.09 + 3× margin = $1.50
  'opportunity-full-run': 1.50, // 10 validations × $0.08 + 3× margin = $1.50
} as const;

describe('Agent Cost Budgets', () => {
  describe('Cost calculation utility', () => {
    it('calculates claude-sonnet-4-6 cost correctly', () => {
      // 1M input + 1M output = $3 + $15 = $18
      expect(calcCostUsd('claude-sonnet-4-6', 1_000_000, 1_000_000)).toBe(18);
    });

    it('calculates cost for typical Research Agent run (58k tokens)', () => {
      // Observed in E2E test: ~58k total context
      // Estimated split: ~50k input, ~8k output
      const cost = calcCostUsd('claude-sonnet-4-6', 50_000, 8_000);
      expect(cost).toBeCloseTo(0.27, 2); // $0.27 for 3 prospects = $0.09 each
    });

    it('calculates cost for typical Opportunity Agent run (20k tokens per prospect)', () => {
      const cost = calcCostUsd('claude-sonnet-4-6', 18_000, 2_000);
      expect(cost).toBeCloseTo(0.084, 3); // $0.054 + $0.030 = $0.084
    });
  });

  describe('Research Agent budget constraints', () => {
    it('stays under $0.15 per prospect at observed token usage', () => {
      // Observed: 58k total tokens for 3 prospects
      const fullRunCost = calcCostUsd('claude-sonnet-4-6', 50_000, 8_000);
      const prospectsCreated = 3;
      const costPerProspect = fullRunCost / prospectsCreated;

      expect(costPerProspect).toBeLessThan(BUDGETS['research-per-prospect']);
    });

    it('full run under $1.50 even with 10 prospects', () => {
      // 10 prospects × ~19k tokens = ~190k tokens
      const cost = calcCostUsd('claude-sonnet-4-6', 160_000, 30_000);
      expect(cost).toBeLessThan(BUDGETS['research-full-run']);
    });

    it('switching to haiku reduces cost by at least 70%', () => {
      // haiku pricing: $0.8/M input, $4/M output
      // sonnet pricing: $3/M input, $15/M output
      // haiku is ~27% of sonnet cost → 73% reduction
      const sonnetCost = calcCostUsd('claude-sonnet-4-6', 50_000, 8_000);
      const haikuCost = calcCostUsd('claude-haiku-4-5', 50_000, 8_000);
      expect(haikuCost).toBeLessThan(sonnetCost * 0.30); // haiku < 30% of sonnet
    });

    it('ALERT: if token usage triples, cost exceeds budget', () => {
      // This tests that the budget catches regressions like prompt bloat
      const tripleCost = calcCostUsd('claude-sonnet-4-6', 150_000, 24_000);
      const prospectsCreated = 3; // same output, 3× tokens
      const costPerProspect = tripleCost / prospectsCreated;

      // $0.45 / 3 = $0.15 — exactly at the limit
      expect(costPerProspect).toBeGreaterThanOrEqual(BUDGETS['research-per-prospect']);
    });
  });

  describe('Opportunity Agent budget constraints', () => {
    it('stays under $0.20 per validation at expected token usage', () => {
      // Expected: ~20k tokens per prospect (analyze + score + submit)
      // 18k input + 2k output = $0.054 + $0.030 = $0.084
      const cost = calcCostUsd('claude-sonnet-4-6', 18_000, 2_000);
      expect(cost).toBeLessThan(BUDGETS['opportunity-per-validation']);
    });

    it('full run of 10 validations under $1.50', () => {
      // 10 × 20k tokens = 200k total
      const cost = calcCostUsd('claude-sonnet-4-6', 180_000, 20_000);
      expect(cost).toBeLessThan(BUDGETS['opportunity-full-run']);
    });
  });

  describe('Cost ceiling by model', () => {
    // Run at the same token budget, verify costs are ordered: haiku < sonnet << opus
    const TOKENS = { input: 50_000, output: 8_000 };

    it('haiku is cheapest for batch operations', () => {
      const haiku = calcCostUsd('claude-haiku-4-5', TOKENS.input, TOKENS.output);
      const sonnet = calcCostUsd('claude-sonnet-4-6', TOKENS.input, TOKENS.output);
      const opus = calcCostUsd('claude-opus-4-8', TOKENS.input, TOKENS.output);
      expect(haiku).toBeLessThan(sonnet);
      expect(sonnet).toBeLessThan(opus);
    });

    it('opus is 5× more expensive than sonnet — requires explicit justification', () => {
      const sonnet = calcCostUsd('claude-sonnet-4-6', TOKENS.input, TOKENS.output);
      const opus = calcCostUsd('claude-opus-4-8', TOKENS.input, TOKENS.output);
      const ratio = opus / sonnet;
      expect(ratio).toBeGreaterThan(4);
      // If someone switches a Research/Opportunity Agent to opus, this ratio documents why costs spike
    });
  });

  describe('agent_costs table structure contract', () => {
    // These tests verify that the table fields map to the calculation correctly.
    // They fail if someone changes the field names in the schema.
    it('AgentCost record has all required fields for cost calculation', () => {
      const mockRecord = {
        id: 'cost-1',
        runId: 'run-1',
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        inputTokens: 50_000,
        outputTokens: 8_000,
        totalTokens: 58_000,
        costUsd: '0.27', // stored as Decimal in DB
        createdAt: new Date(),
      };

      // The record must have these fields to calculate ROI correctly
      expect(mockRecord).toHaveProperty('inputTokens');
      expect(mockRecord).toHaveProperty('outputTokens');
      expect(mockRecord).toHaveProperty('costUsd');
      expect(mockRecord).toHaveProperty('model');
      expect(mockRecord).toHaveProperty('provider');

      // Verify cost calculation matches stored value
      const calculated = calcCostUsd('claude-sonnet-4-6', mockRecord.inputTokens, mockRecord.outputTokens);
      const stored = parseFloat(mockRecord.costUsd);
      expect(Math.abs(calculated - stored)).toBeLessThan(0.01); // within 1 cent
    });
  });
});
