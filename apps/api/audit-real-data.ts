/**
 * AUDIT: REAL DATA FROM DATABASE
 *
 * Extrae 20+ empresas analizadas de la BD real
 * Genera matriz de validación:
 * - Qué oportunidades detectó el pipeline actual
 * - Qué oportunidades debería detectar el motor nuevo
 * - Falsos positivos / falsos negativos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CompanyAnalysis {
  id: string;
  nombreEmpresa: string;
  rubro: string;
  website: string | null | undefined;
  signalsAvailable: boolean;
  signalsCount: number;
  signals?: any;
  currentProblems: string[];
  problemasEncontrados: string[];
  estado: string;
  createdAt: Date;
}

interface AuditResult {
  totalCompanies: number;
  companiesWithSignals: number;
  companiesWithProblems: number;
  companies: CompanyAnalysis[];
  signalCoverage: {
    [key: string]: number;
  };
  problemFrequency: {
    [key: string]: number;
  };
}

async function auditRealData(): Promise<AuditResult> {
  console.log('═'.repeat(90));
  console.log('AUDIT: REAL DATA FROM DATABASE');
  console.log('═'.repeat(90));
  console.log('');

  // ============================================================================
  // EXTRACT COMPANIES WITH ENRICHMENT RESULTS
  // ============================================================================
  console.log('Extracting companies from database...\n');

  const prospects = await prisma.prospect.findMany({
    where: {
      enrichmentResult: {
        isNot: null,
      },
      isLegacy: false,
      deletedAt: null,
    },
    include: {
      enrichmentResult: true,
      validation: true,
    },
    take: 50, // Get up to 50 companies
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (prospects.length === 0) {
    console.log('❌ No companies found in database');
    process.exit(1);
  }

  console.log(`✅ Found ${prospects.length} companies with enrichment results\n`);

  // ============================================================================
  // ANALYSIS
  // ============================================================================

  const companies: CompanyAnalysis[] = [];
  const signalCoverage: { [key: string]: number } = {};
  const problemFrequency: { [key: string]: number } = {};

  for (const prospect of prospects) {
    const enrichment = prospect.enrichmentResult;
    const signals = enrichment?.signals as any || {};

    // Count signals
    const signalKeys = Object.keys(signals);
    signalKeys.forEach(key => {
      signalCoverage[key] = (signalCoverage[key] || 0) + 1;
    });

    // Count problems
    const problems = prospect.currentProblems || [];
    problems.forEach(problem => {
      problemFrequency[problem] = (problemFrequency[problem] || 0) + 1;
    });

    companies.push({
      id: prospect.id,
      nombreEmpresa: prospect.nombreEmpresa,
      rubro: prospect.rubro || 'Unknown',
      website: prospect.website,
      signalsAvailable: signalKeys.length > 0,
      signalsCount: signalKeys.length,
      signals: signals,
      currentProblems: problems,
      problemasEncontrados: prospect.problemasEncontrados || [],
      estado: prospect.estado,
      createdAt: prospect.createdAt,
    });
  }

  // ============================================================================
  // REPORT
  // ============================================================================

  console.log('═'.repeat(90));
  console.log('MATRIX: COMPANIES ANALYZED');
  console.log('═'.repeat(90));
  console.log('');

  console.log('Nro'.padEnd(5) + 'Empresa'.padEnd(30) + 'Rubro'.padEnd(20) + 'Signals'.padEnd(8) + 'Problems');
  console.log('─'.repeat(90));

  companies.slice(0, 20).forEach((company, index) => {
    const nro = String(index + 1).padEnd(5);
    const empresa = company.nombreEmpresa.substring(0, 28).padEnd(30);
    const rubro = company.rubro.substring(0, 18).padEnd(20);
    const signals = String(company.signalsCount).padEnd(8);
    const problems = String(company.currentProblems.length);
    console.log(nro + empresa + rubro + signals + problems);
  });

  console.log('');

  // ============================================================================
  // SIGNAL COVERAGE REPORT
  // ============================================================================

  console.log('═'.repeat(90));
  console.log('SIGNAL COVERAGE: Which signals are captured?');
  console.log('═'.repeat(90));
  console.log('');

  const sortedSignals = Object.entries(signalCoverage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);

  console.log('Signal'.padEnd(40) + 'Count'.padEnd(8) + 'Coverage %');
  console.log('─'.repeat(90));

  sortedSignals.forEach(([signal, count]) => {
    const coverage = ((count / companies.length) * 100).toFixed(1);
    const sig = signal.substring(0, 38).padEnd(40);
    const cnt = String(count).padEnd(8);
    console.log(sig + cnt + coverage + '%');
  });

  console.log('');

  // ============================================================================
  // PROBLEM FREQUENCY REPORT
  // ============================================================================

  console.log('═'.repeat(90));
  console.log('PROBLEM FREQUENCY: What problems are detected?');
  console.log('═'.repeat(90));
  console.log('');

  const sortedProblems = Object.entries(problemFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);

  console.log('Problem'.padEnd(60) + 'Count'.padEnd(8) + 'Frequency %');
  console.log('─'.repeat(90));

  sortedProblems.forEach(([problem, count]) => {
    const frequency = ((count / companies.length) * 100).toFixed(1);
    const prob = problem.substring(0, 58).padEnd(60);
    const cnt = String(count).padEnd(8);
    console.log(prob + cnt + frequency + '%');
  });

  console.log('');

  // ============================================================================
  // JSON OUTPUT FOR PROCESSING
  // ============================================================================

  const auditResult: AuditResult = {
    totalCompanies: companies.length,
    companiesWithSignals: companies.filter(c => c.signalsAvailable).length,
    companiesWithProblems: companies.filter(c => c.currentProblems.length > 0).length,
    companies: companies.slice(0, 20),
    signalCoverage,
    problemFrequency,
  };

  // Save to JSON file for further processing
  const fs = require('fs');
  fs.writeFileSync(
    'AUDIT_REAL_DATA.json',
    JSON.stringify(auditResult, null, 2)
  );

  console.log('═'.repeat(90));
  console.log('✅ AUDIT COMPLETE');
  console.log('═'.repeat(90));
  console.log(`\nTotal companies: ${auditResult.totalCompanies}`);
  console.log(`With signals: ${auditResult.companiesWithSignals}`);
  console.log(`With problems: ${auditResult.companiesWithProblems}`);
  console.log('\nDetailed data saved to: AUDIT_REAL_DATA.json\n');

  return auditResult;
}

// Run
auditRealData()
  .then(() => {
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    prisma.$disconnect();
    process.exit(1);
  });
