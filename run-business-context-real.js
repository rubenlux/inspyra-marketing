import { BusinessContextEngine } from "./src/business-context-engine/business-context-engine.service.js";
import {
  CASA_VIGIL,
  PULENTA_ESTATE,
  BODEGAS_LOPEZ,
  NORTON
} from "./src/business-context-engine/test-data.js";

/**
 * EJECUCIÓN FUNCIONAL: Business Context Engine sobre 5 bodegas reales
 * Output: JSON COMPLETO de cada caso (sin resumen)
 */

const engine = new BusinessContextEngine();

const testCases = [
  { name: "Casa Vigil", data: CASA_VIGIL },
  { name: "Pulenta Estate", data: PULENTA_ESTATE },
  { name: "Bodegas López", data: BODEGAS_LOPEZ },
  { name: "Norton", data: NORTON },
];

console.log("════════════════════════════════════════════════════════════════");
console.log("BUSINESS CONTEXT ENGINE - VALIDACIÓN FUNCIONAL REAL");
console.log("════════════════════════════════════════════════════════════════\n");

testCases.forEach((testCase, index) => {
  console.log(`\n${"═".repeat(70)}`);
  console.log(`CASO ${index + 1}: ${testCase.name}`);
  console.log(`${"═".repeat(70)}\n`);

  try {
    const result = engine.process(testCase.data);

    // Output: JSON COMPLETO
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error(`❌ ERROR PROCESSING ${testCase.name}:`);
    console.error(error.message);
    console.error(error.stack);
  }
});

console.log(`\n${"═".repeat(70)}`);
console.log("FIN VALIDACIÓN FUNCIONAL");
console.log(`${"═".repeat(70)}\n`);
