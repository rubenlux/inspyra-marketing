import { BusinessContextEngine } from "./business-context-engine.service.js";
import { BusinessContextValidator } from "./business-context.validator.js";
import { TEST_DATA_STAGE_A } from "./test-data-20.js";

/**
 * STAGE A RUNNER: Ejecuta 20 casos reales
 * Objetivo: Identificar fallos, edge cases, desalineamientos
 */

interface StageAResult {
  prospectName: string;
  prospectId: string;
  status: "PASS" | "FAIL" | "EDGE_CASE";
  errors: any[];
  classification: "FULL" | "PARTIAL" | "NONE";
  hasWebsiteAnalysis: boolean;
  hasPatterns: number;
  unverifiedPatterns: number;
  notes: string[];
}

async function runStageA() {
  const engine = new BusinessContextEngine();
  const validator = new BusinessContextValidator();
  const results: StageAResult[] = [];

  console.log("════════════════════════════════════════════════════════════════");
  console.log("STAGE A: 20 CASOS - EJECUCIÓN REAL");
  console.log("════════════════════════════════════════════════════════════════\n");

  for (const testCase of TEST_DATA_STAGE_A) {
    try {
      // ====================================================================
      // EJECUCIÓN DEL ENGINE
      // ====================================================================
      const context = engine.process(testCase.data);

      // ====================================================================
      // VALIDACIÓN
      // ====================================================================
      const validationResult = validator.validate(context);
      const contradictionResult = validator.validateNoContradictions(context);

      // ====================================================================
      // ANÁLISIS DEL RESULTADO
      // ====================================================================
      const allErrors = [...validationResult.errors, ...contradictionResult.errors];
      const hasCriticalErrors = allErrors.some((e) => e.severity === "CRITICAL");

      const unverifiedPatterns = context.websiteAnalysis
        ? context.websiteAnalysis.observedPatterns.filter(
            (p) => p.status === "UNVERIFIED"
          ).length
        : 0;

      const result: StageAResult = {
        prospectName: testCase.name,
        prospectId: context.prospectId,
        status: hasCriticalErrors ? "FAIL" : unverifiedPatterns > 0 ? "EDGE_CASE" : "PASS",
        errors: allErrors,
        classification: context.metadata.classificationCoverage,
        hasWebsiteAnalysis: context.websiteAnalysis !== null,
        hasPatterns: context.websiteAnalysis
          ? context.websiteAnalysis.observedPatterns.length
          : 0,
        unverifiedPatterns,
        notes: context.metadata.notes || [],
      };

      results.push(result);

      // ====================================================================
      // SALIDA INDIVIDUAL
      // ====================================================================
      const statusIcon =
        result.status === "PASS"
          ? "✅"
          : result.status === "FAIL"
            ? "❌"
            : "⚠️";

      console.log(`${statusIcon} ${testCase.name}`);
      console.log(`   ID: ${context.prospectId}`);
      console.log(`   Classification Coverage: ${result.classification}`);
      console.log(`   Website Analysis: ${result.hasWebsiteAnalysis ? "✓" : "✗"}`);
      console.log(`   Patterns: ${result.hasPatterns} (${result.unverifiedPatterns} UNVERIFIED)`);

      if (allErrors.length > 0) {
        console.log(`   ❌ ${allErrors.length} validation error(s):`);
        allErrors.slice(0, 3).forEach((error) => {
          console.log(`      - [${error.field}] ${error.error}`);
        });
        if (allErrors.length > 3) {
          console.log(`      ... +${allErrors.length - 3} more`);
        }
      }

      console.log("");
    } catch (error) {
      // Crash
      results.push({
        prospectName: testCase.name,
        prospectId: testCase.data.id,
        status: "FAIL",
        errors: [{ message: String(error) }],
        classification: "NONE",
        hasWebsiteAnalysis: false,
        hasPatterns: 0,
        unverifiedPatterns: 0,
        notes: ["CRASH"],
      });

      console.log(`💥 ${testCase.name} - CRASH`);
      console.log(`   Error: ${error}`);
      console.log("");
    }
  }

  // ========================================================================
  // RESUMEN
  // ========================================================================
  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("RESUMEN STAGE A");
  console.log("════════════════════════════════════════════════════════════════\n");

  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const edgeCases = results.filter((r) => r.status === "EDGE_CASE").length;

  console.log(`Total Casos:      ${results.length}`);
  console.log(`✅ PASS:          ${passed} (${((passed / results.length) * 100).toFixed(1)}%)`);
  console.log(`❌ FAIL:          ${failed} (${((failed / results.length) * 100).toFixed(1)}%)`);
  console.log(`⚠️  EDGE_CASE:    ${edgeCases} (${((edgeCases / results.length) * 100).toFixed(1)}%)\n`);

  // ========================================================================
  // MÉTRICAS POR CATEGORÍA
  // ========================================================================
  console.log("MÉTRICAS POR CATEGORÍA:\n");

  const bodegas = results.slice(0, 5);
  const restaurantes = results.slice(5, 10);
  const retail = results.slice(10, 15);
  const servicios = results.slice(15, 20);

  console.log(`Bodegas (5):`);
  console.log(`  PASS: ${bodegas.filter((r) => r.status === "PASS").length}/5`);
  console.log(`  Issues: ${bodegas.filter((r) => r.status !== "PASS").map((r) => r.prospectName).join(", ") || "None"}`);

  console.log(`\nRestaurantes (5):`);
  console.log(`  PASS: ${restaurantes.filter((r) => r.status === "PASS").length}/5`);
  console.log(`  Issues: ${restaurantes.filter((r) => r.status !== "PASS").map((r) => r.prospectName).join(", ") || "None"}`);

  console.log(`\nRetail (5):`);
  console.log(`  PASS: ${retail.filter((r) => r.status === "PASS").length}/5`);
  console.log(`  Issues: ${retail.filter((r) => r.status !== "PASS").map((r) => r.prospectName).join(", ") || "None"}`);

  console.log(`\nServicios (5):`);
  console.log(`  PASS: ${servicios.filter((r) => r.status === "PASS").length}/5`);
  console.log(`  Issues: ${servicios.filter((r) => r.status !== "PASS").map((r) => r.prospectName).join(", ") || "None"}`);

  // ========================================================================
  // ANÁLISIS DE FALLOS
  // ========================================================================
  const failedCases = results.filter((r) => r.status === "FAIL");
  if (failedCases.length > 0) {
    console.log(`\n\n❌ FAILED CASES (${failedCases.length}):\n`);
    failedCases.forEach((r) => {
      console.log(`${r.prospectName}:`);
      if (r.notes.includes("CRASH")) {
        console.log(`  💥 Engine crashed`);
      } else {
        r.errors.slice(0, 3).forEach((e) => {
          console.log(`  - ${e.field}: ${e.error}`);
        });
      }
      console.log("");
    });
  }

  // ========================================================================
  // ANÁLISIS DE EDGE CASES
  // ========================================================================
  if (edgeCases > 0) {
    console.log(`\n⚠️  EDGE CASES (${edgeCases}):\n`);
    results
      .filter((r) => r.status === "EDGE_CASE")
      .forEach((r) => {
        console.log(`${r.prospectName}:`);
        console.log(`  UNVERIFIED patterns: ${r.unverifiedPatterns}`);
        r.notes.forEach((n) => {
          console.log(`  Note: ${n}`);
        });
        console.log("");
      });
  }

  // ========================================================================
  // HALLAZGOS
  // ========================================================================
  console.log("════════════════════════════════════════════════════════════════");
  console.log("HALLAZGOS\n");

  const fullyClassified = results.filter((r) => r.classification === "FULL").length;
  const partiallyClassified = results.filter((r) => r.classification === "PARTIAL").length;
  const unclassified = results.filter((r) => r.classification === "NONE").length;

  console.log(`Classification Coverage:`);
  console.log(`  FULL:    ${fullyClassified}/20 (${((fullyClassified / 20) * 100).toFixed(0)}%)`);
  console.log(`  PARTIAL: ${partiallyClassified}/20 (${((partiallyClassified / 20) * 100).toFixed(0)}%)`);
  console.log(`  NONE:    ${unclassified}/20 (${((unclassified / 20) * 100).toFixed(0)}%)\n`);

  const withAnalysis = results.filter((r) => r.hasWebsiteAnalysis).length;
  console.log(`Website Analysis:`);
  console.log(`  Available: ${withAnalysis}/20 (${((withAnalysis / 20) * 100).toFixed(0)}%)`);
  console.log(`  Null:      ${20 - withAnalysis}/20 (${(((20 - withAnalysis) / 20) * 100).toFixed(0)}%)\n`);

  const totalPatterns = results.reduce((sum, r) => sum + r.hasPatterns, 0);
  const totalUnverified = results.reduce((sum, r) => sum + r.unverifiedPatterns, 0);

  console.log(`Patterns:`);
  console.log(`  Total:      ${totalPatterns}`);
  console.log(`  UNVERIFIED: ${totalUnverified} (${totalPatterns > 0 ? ((totalUnverified / totalPatterns) * 100).toFixed(0) : 0}%)`);
  console.log(`  CONFIRMED:  ${totalPatterns - totalUnverified}`);

  // ========================================================================
  // RECOMENDACIÓN
  // ========================================================================
  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("RECOMENDACIÓN\n");

  if (failed === 0 && edgeCases <= 3) {
    console.log("🟢 STAGE A PASSED - Proceder a STAGE B (50 casos)");
    console.log(`   ${edgeCases} edge case(s) detectado(s) pero no bloqueante(s)`);
  } else if (failed > 0) {
    console.log("🔴 STAGE A FAILED - Corregir problemas antes de STAGE B");
    console.log(`   ${failed} caso(s) fallido(s) requieren auditoría manual`);
  } else {
    console.log("🟡 STAGE A INCONCLUSIVE - Revisar edge cases");
  }

  console.log("\n════════════════════════════════════════════════════════════════\n");

  return results;
}

// Ejecutar
runStageA().catch(console.error);
