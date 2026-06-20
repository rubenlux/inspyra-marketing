import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ResearchService } from './src/modules/research/research.service';
import { PrismaService } from './src/database/prisma.service';
import * as fs from 'fs';

async function runBatch() {
  const app = await NestFactory.createApplicationContext(AppModule);
  if (!app) { console.error("Could not bootstrap App"); return; }
  
  const researchService = app.get(ResearchService);
  const prisma = app.get(PrismaService);
  
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.error("No tenant found. Cannot proceed.");
    await app.close();
    return;
  }

  const queries = [
    'Bodegas en Mendoza',
    'Hoteles en Mendoza',
    'Inmobiliarias Buenos Aires',
    'Clínicas Córdoba'
  ];

  const resultsCSV = ['query,company_name,website,instagram,linkedin,status,discard_reason,score,opportunity,is_noise'];

  let totalRaw = 0, totalNoise = 0, totalPromoted = 0, totalTimeMs = 0;

  for (const q of queries) {
    console.log(`\n================================`);
    console.log(`Starting Batch Job for: ${q} (limit: 25)`);
    
    // Timer
    const t0 = Date.now();
    
    const job = await prisma.researchJob.create({
      data: {
        tenantId: tenant.id,
        query: q,
        limit: 25,
        status: 'PENDING',
        jobType: 'DISCOVERY',
        sourceType: 'WEB_SEARCH',
      }
    });

    try {
      await researchService['runPipeline'](job.id, tenant.id, q, 25);
    } catch(e) {
      console.error(`[ERROR] Failed on ${q}`, e);
    }
    
    const timeMs = Date.now() - t0;
    totalTimeMs += timeMs;

    const candidates = await prisma.researchCandidate.findMany({
      where: { jobId: job.id }
    });
    
    const finalJob = await prisma.researchJob.findUnique({ where: { id: job.id } });

    let qRaw = candidates.length; 
    let qNoise = 0;
    let qPromoted = 0;
    
    for (const c of candidates) {
        // Noise rate detection mapping
        const wStr = (c.website || '').toLowerCase();
        const nStr = (c.nombreEmpresa || '').toLowerCase();
        const isNoise = /booking|tripadvisor|facebook|linkedin|instagram|guia|directorio|paginasamarillas|zona|zonaprop|airbnb|despegar|expedia/i.test(wStr) || /guia|directorio/i.test(nStr);
        if (isNoise) qNoise++;
        if (c.status === 'PROMOTED') qPromoted++;
        
        resultsCSV.push(`"${q}","${c.nombreEmpresa}","${c.website || ''}","${c.instagram || ''}","${c.linkedin || ''}","${c.status}","${c.discardReason || ''}","${c.score || ''}","${c.oportunidadDetectada ? c.oportunidadDetectada.replace(/"/g, '""') : ''}","${isNoise ? 'YES' : 'NO'}"`);
    }

    console.log(`-- Report Query: ${q} --`);
    console.log(`Time: ${timeMs}ms`);
    console.log(`Found: ${qRaw} candidates`);
    console.log(`Noise: ${qNoise} (${((qNoise/(qRaw||1))*100).toFixed(1)}%) -> Directories/Aggregators`);
    console.log(`Promoted: ${qPromoted}`);
    console.log(`Metrics String:`);
    console.log(finalJob?.agentOutput?.split('\n').join(' | '));
    
    totalRaw += qRaw;
    totalNoise += qNoise;
    totalPromoted += qPromoted;
  }

  // Export CSV
  fs.writeFileSync('discovery_diagnostics.csv', resultsCSV.join('\n'), 'utf8');

  console.log(`\n================================`);
  console.log(`--- CONCLUSIÓN GLOBAL (100 Request) ---`);
  console.log(`Total Candidates Found: ${totalRaw}`);
  console.log(`NOISE RATE: ${((totalNoise/(totalRaw||1))*100).toFixed(1)}%`);
  console.log(`Total Promoted Valid Opty: ${totalPromoted}`);
  console.log(`Total Time: ${(totalTimeMs/1000).toFixed(1)}s`);
  console.log(`CSV Exported: discovery_diagnostics.csv`);

  await app.close();
}

runBatch().catch(e => console.error(e));
