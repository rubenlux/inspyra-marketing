import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './database/prisma.service';

async function check() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  const lastJob = await prisma.researchJob.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { candidates: true }
  });

  if (!lastJob) {
    console.log('No jobs found');
  } else {
    console.log(`Job: ${lastJob.query} (${lastJob.id})`);
    console.log(`Status: ${lastJob.status}`);
    console.log(`Error: ${lastJob.errorMessage}`);
    console.log(`Candidates Found: ${lastJob.candidates.length}`);
    
    if (lastJob.candidates.length > 0) {
      console.log('--- CANDIDATES ---');
      lastJob.candidates.forEach(c => {
        console.log(`- ${c.nombreEmpresa} | Status: ${c.status} | Website: ${c.website}`);
      });
    }
  }

  await app.close();
}

check();
