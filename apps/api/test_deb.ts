import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ResearchService } from './src/modules/research/research.service';

async function deb() {
  const app = await NestFactory.createApplicationContext(AppModule);
  if (!app) { console.error("Could not bootstrap App"); return; }
  
  const researchService = app.get(ResearchService);
  
  console.log("Running discoverRealWithWebSearch...");
  try {
      const res = await researchService['discoverRealWithWebSearch']('Bodegas en Mendoza', 5);
      console.log(JSON.stringify(res, null, 2));
  } catch(e) {
      console.error(e);
  }
  await app.close();
}

deb().catch(e => console.error(e));
