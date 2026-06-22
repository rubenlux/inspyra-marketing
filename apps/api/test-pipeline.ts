import { NestFactory } from '@nestjs/core';
import { ResearchService } from './modules/research/research.service';
import { AppModule } from './app.module';
import { PrismaService } from './database/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const researchService = app.get(ResearchService);
  const prisma = app.get(PrismaService);

  console.log('--- TEST PIPELINE START ---');
  
  // Get a tenant and user
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('No user found in DB');
    await app.close();
    return;
  }

  console.log(`Using user: ${user.email} (Tenant: ${user.tenantId})`);

  try {
    const job = await researchService.createJob({
      query: 'Bodegas en Mendoza',
      limit: 1,
      sourceType: 'WEB_SEARCH', // This will use the Google Maps Provider if configured
    }, user.tenantId, user.id);

    console.log(`Job Created: ${job.id}. Waiting for processing...`);

    // The pipeline runs in setImmediate, so we wait or poll
    let attempts = 0;
    while (attempts < 60) { // 30 mins max (30s intervals)
      const currentJob = await researchService.getJob(job.id, user.tenantId);
      console.log(`[${new Date().toLocaleTimeString()}] Status: ${currentJob.status} | Candidates: ${currentJob.candidatesCount}`);
      
      if (currentJob.status === 'COMPLETED') {
        console.log('SUCCESS! Pipeline completed.');
        const candidates = await researchService.getCandidates(job.id, user.tenantId);
        console.table(candidates.map(c => ({
            empresa: c.nombreEmpresa,
            score: c.score,
            promoted: c.promotedToProspect
        })));
        break;
      }
      
      if (currentJob.status === 'FAILED') {
        console.error('Job FAILED:', currentJob.errorMessage);
        break;
      }

      await new Promise(r => setTimeout(r, 10000));
      attempts++;
    }
  } catch (error) {
    console.error('Error during test:', error);
  }

  await app.close();
}

bootstrap();
