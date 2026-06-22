/**
 * OPPORTUNITY ENGINE TESTS RUNNER
 *
 * Execute: npx ts-node run-opportunity-engine-tests.ts
 * Validates: Casa Vigil, Norton, Pulenta Estate
 */

import { OpportunityEngine } from './src/opportunity-engine/opportunity-engine.service';
import catalogData from './SERVICES_CATALOG_MACHINE.json';

// ============================================================================
// REAL SIGNALS FROM EVIDENCIA_REAL_PIPELINE.md
// ============================================================================

const CASA_VIGIL = {
  name: 'Casa Vigil',
  industry: 'Food Service',
  signals: {
    industry: 'Food Service',
    hasOnlineBooking: false,
    hasEcommerce: true,
    hasMetaPixel: false,
    hasWebsite: true,
    hasGoogleBusiness: false,
    hasSocialLinks: true,
    hasMetaDescription: true,
    hasSchema: false,
    hasSitemap: false,
    hasLeadForm: false,
    h1Count: 0,
    hasViewport: true,
    hasContactForm: false,
    tourism: false,
    navContains: ['UNIVERSO VIGIL', 'COMPRA ONLINE', 'HACER UNA RESERVA'],
  },
  expected: ['online-booking', 'crm-automation'],
};

const NORTON = {
  name: 'Norton',
  industry: 'Wine/Beverages',
  signals: {
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
    h1Count: 2,
    hasContactForm: true,
    hasWooCommerce: true,
    hasViewport: true,
    estimatedPageWeightKb: 372,
    imageCount: 14,
    tourism: false,
    navContains: ['NOSOTROS', 'NUESTROS VINOS', 'SPIRITS & IMPORTADOS'],
  },
  expected: ['online-booking', 'crm-automation', 'local-visibility'],
};

const PULENTA = {
  name: 'Pulenta Estate',
  industry: 'Wine/Beverages',
  signals: {
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
    h1Count: 2,
    hasContactForm: true,
    hasLeadForm: false,
    hasViewport: true,
    estimatedPageWeightKb: 25,
    imageCount: 21,
    tourism: true,
    navContains: ['ESP', 'ENG', 'POR', 'TIENDA', 'VINOS', 'TURISMO', 'QUIÉNES SOMOS', 'VIÑEDOS'],
  },
  expected: ['local-visibility'],
};

// ============================================================================
// RUN TESTS
// ============================================================================

const engine = new OpportunityEngine(catalogData.services);
const testCases = [CASA_VIGIL, NORTON, PULENTA];

console.log('\n' + '═'.repeat(90));
console.log('OPPORTUNITY ENGINE — AUTOMATED TESTS');
console.log('═'.repeat(90) + '\n');

let passedCount = 0;
let failedCount = 0;

testCases.forEach((testCase, index) => {
  console.log(`\n${'─'.repeat(90)}`);
  console.log(`TEST ${index + 1}: ${testCase.name}`);
  console.log(`${'─'.repeat(90)}\n`);

  // Run evaluation
  const detected = engine.evaluate(testCase.signals, testCase.industry);
  const detectedIds = detected.map(opp => opp.serviceId);

  // Check if test passed
  const passed = arraysEqual(testCase.expected, detectedIds);

  if (passed) {
    console.log(`✅ PASS\n`);
    passedCount++;
  } else {
    console.log(`❌ FAIL\n`);
    console.log(`   Expected: [${testCase.expected.join(', ')}]`);
    console.log(`   Detected: [${detectedIds.join(', ')}]\n`);
    failedCount++;
  }

  // Print opportunities with full evidence
  console.log(`📊 DETECTED OPPORTUNITIES:\n`);

  if (detected.length === 0) {
    console.log('   (none)\n');
  } else {
    detected.forEach(opp => {
      console.log(`   ✓ ${opp.serviceId}`);
      console.log(`     Name: ${opp.name}`);
      console.log(`     TIER: ${opp.tier}`);
      console.log(`     Business Value: ${opp.businessValue}`);
      console.log(`\n     EVIDENCE:`);

      opp.evidence.forEach(ev => {
        console.log(`       • ${ev}`);
      });

      // Required signals
      if (opp.matchedRequiredSignals.length > 0) {
        console.log(`\n     REQUIRED SIGNALS:`);
        opp.matchedRequiredSignals.forEach(sig => {
          const status = sig.matched ? '✓' : '✗';
          console.log(`       [${status}] ${sig.signal} ${sig.operator} ${JSON.stringify(sig.expected)}`);
          console.log(`           → actual: ${JSON.stringify(sig.actual)}`);
        });
      }

      // Optional groups that matched
      const matchedGroups = opp.matchedOptionalGroups.filter(g => g.matched);
      if (matchedGroups.length > 0) {
        console.log(`\n     MATCHED OPTIONAL GROUPS (${matchedGroups.length}):`);
        matchedGroups.forEach(group => {
          console.log(`       [GROUP ${group.groupIndex}]`);
          group.signals.forEach(sig => {
            console.log(`         ✓ ${sig.signal} ${sig.operator} ${JSON.stringify(sig.expected)}`);
            console.log(`           → actual: ${JSON.stringify(sig.actual)}`);
          });
        });
      }

      console.log('\n');
    });
  }
});

// ============================================================================
// SUMMARY
// ============================================================================

console.log(`\n${'═'.repeat(90)}`);
console.log('SUMMARY');
console.log(`${'═'.repeat(90)}\n`);

console.log(`Total Tests:      ${testCases.length}`);
console.log(`✅ Passed:        ${passedCount}/${testCases.length}`);
console.log(`❌ Failed:        ${failedCount}/${testCases.length}`);
console.log('');

if (failedCount === 0) {
  console.log('✅ ALL TESTS PASSED');
  console.log('   Engine is deterministic, trazable, and ready for integration');
  console.log('\n' + '═'.repeat(90) + '\n');
  process.exit(0);
} else {
  console.log('❌ TESTS FAILED');
  console.log('   Review catalog or engine logic');
  console.log('\n' + '═'.repeat(90) + '\n');
  process.exit(1);
}

// ============================================================================
// UTILITIES
// ============================================================================

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const aSet = new Set(a);
  const bSet = new Set(b);
  for (let item of aSet) {
    if (!bSet.has(item)) return false;
  }
  for (let item of bSet) {
    if (!aSet.has(item)) return false;
  }
  return true;
}
