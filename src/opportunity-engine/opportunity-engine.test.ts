/**
 * OPPORTUNITY ENGINE — Automated Tests
 *
 * Tests: Casa Vigil, Norton, Pulenta Estate
 * Validates: Correct opportunity detection
 *
 * NO manual assertions. Pure deterministic validation.
 */

import { OpportunityEngine } from './opportunity-engine.service';
import catalogData from '../../SERVICES_CATALOG_MACHINE.json';

// ============================================================================
// TEST DATA: Real signals from EVIDENCIA_REAL_PIPELINE.md
// ============================================================================

const CASA_VIGIL_SIGNALS = {
  industry: 'Food Service',
  hasOnlineBooking: false,
  navContainsReservation: true,
  hasEcommerce: true,
  hasMetaPixel: false,
  hasWebsite: true,
  hasGoogleBusiness: false,
  hasSocialLinks: true,
  hasMetaDescription: true,
  hasSchema: false,
  hasSitemap: false,
  hasLeadForm: false,
  tourism: false,
  h1Count: 0,
  hasViewport: true,
  hasContactForm: false,
};

const NORTON_SIGNALS = {
  industry: 'Wine/Beverages',
  hasOnlineBooking: false,
  hasEcommerce: true,
  hasMetaPixel: false,
  hasWebsite: true,
  hasGoogleBusiness: false,
  hasSocialLinks: true,
  hasMetaDescription: false,
  hasSchema: false,
  hasSitemap: false,
  hasLeadForm: false,
  tourism: false,
  h1Count: 2,
  hasContactForm: true,
  hasWooCommerce: true,
  hasViewport: true,
  estimatedPageWeightKb: 372,
  imageCount: 14,
  navContains: ['NOSOTROS', 'NUESTROS VINOS', 'SPIRITS & IMPORTADOS'],
};

const PULENTA_SIGNALS = {
  industry: 'Wine/Beverages',
  hasOnlineBooking: true,
  hasEcommerce: true,
  hasMetaPixel: true,
  hasWebsite: true,
  hasGoogleBusiness: false,
  hasSocialLinks: true,
  hasMetaDescription: false,
  hasSchema: false,
  hasSitemap: false,
  tourism: true,
  h1Count: 2,
  hasContactForm: true,
  hasLeadForm: false,
  hasViewport: true,
  estimatedPageWeightKb: 25,
  imageCount: 21,
  navContains: ['ESP', 'ENG', 'POR', 'TIENDA', 'VINOS', 'TURISMO', 'QUIÉNES SOMOS', 'VIÑEDOS'],
};

// ============================================================================
// TEST INTERFACE
// ============================================================================

interface TestCase {
  name: string;
  signals: any;
  expectedServices: string[];
  description: string;
}

interface TestResult {
  testName: string;
  passed: boolean;
  expected: string[];
  detected: string[];
  opportunities: any[];
  errors: string[];
}

// ============================================================================
// TEST CASES
// ============================================================================

const TEST_CASES: TestCase[] = [
  {
    name: 'Casa Vigil',
    signals: CASA_VIGIL_SIGNALS,
    expectedServices: ['online-booking', 'crm-automation'],
    description: 'Restaurant with booking nav but no online system, ecommerce without retargeting',
  },
  {
    name: 'Norton',
    signals: NORTON_SIGNALS,
    expectedServices: ['online-booking', 'crm-automation', 'local-visibility'],
    description: 'Winery with WooCommerce and no booking, no pixel, no GBP',
  },
  {
    name: 'Pulenta Estate',
    signals: PULENTA_SIGNALS,
    expectedServices: ['local-visibility'],
    description: 'Premium winery with everything except GBP, tourism-focused',
  },
];

// ============================================================================
// TEST RUNNER
// ============================================================================

export class OpportunityEngineTestRunner {
  private engine: OpportunityEngine;
  private results: TestResult[] = [];

  constructor() {
    this.engine = new OpportunityEngine(catalogData.services);
  }

  /**
   * Run all tests
   */
  run(): TestResult[] {
    console.log('═'.repeat(80));
    console.log('OPPORTUNITY ENGINE — AUTOMATED TESTS');
    console.log('═'.repeat(80));
    console.log('');

    for (const testCase of TEST_CASES) {
      const result = this.runTestCase(testCase);
      this.results.push(result);

      // Print test result
      this.printTestResult(result);
    }

    // Print summary
    this.printSummary();

    return this.results;
  }

  /**
   * Run a single test case
   */
  private runTestCase(testCase: TestCase): TestResult {
    const detected = this.engine.evaluate(testCase.signals, testCase.signals.industry);
    const detectedIds = detected.map(opp => opp.serviceId);

    const passed = this.arrayEquals(testCase.expectedServices, detectedIds);

    return {
      testName: testCase.name,
      passed,
      expected: testCase.expectedServices,
      detected: detectedIds,
      opportunities: detected,
      errors: passed
        ? []
        : [
            `Expected: ${testCase.expectedServices.join(', ')}`,
            `Detected: ${detectedIds.join(', ')}`,
          ],
    };
  }

  /**
   * Print individual test result
   */
  private printTestResult(result: TestResult): void {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${result.testName}`);

    if (result.passed) {
      console.log(`       Detected: ${result.detected.join(', ')}`);
    } else {
      console.log(`       Expected: ${result.expected.join(', ')}`);
      console.log(`       Detected: ${result.detected.join(', ')}`);
    }

    // Print evidence for each opportunity
    if (result.opportunities.length > 0) {
      result.opportunities.forEach(opp => {
        console.log(`\n       📊 ${opp.name} (TIER ${opp.tier}, Business Value ${opp.businessValue})`);
        console.log(`          Evidence:`);
        opp.evidence.forEach(ev => {
          console.log(`            • ${ev}`);
        });
      });
    }

    console.log('');
  }

  /**
   * Print test summary
   */
  private printSummary(): void {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    console.log('═'.repeat(80));
    console.log('SUMMARY');
    console.log('═'.repeat(80));
    console.log(`Total: ${total}`);
    console.log(`✅ PASSED: ${passed}/${total}`);
    console.log(`❌ FAILED: ${failed}/${total}`);
    console.log('');

    if (failed === 0) {
      console.log('🎯 ALL TESTS PASSED — Engine is deterministic and trazable');
    } else {
      console.log('⚠️  TESTS FAILED — Review catalog or engine logic');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`\n   ${r.testName}:`);
          r.errors.forEach(e => console.log(`     • ${e}`));
        });
    }

    console.log('');
  }

  /**
   * Utility: Array equality
   */
  private arrayEquals(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    return a.every(item => b.includes(item)) && b.every(item => a.includes(item));
  }
}

// ============================================================================
// MAIN
// ============================================================================

if (require.main === module) {
  const runner = new OpportunityEngineTestRunner();
  const results = runner.run();
  process.exit(results.every(r => r.passed) ? 0 : 1);
}

export { OpportunityEngineTestRunner };
