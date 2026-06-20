import { NestFactory } from '@nestjs/core';
import { AppModule } from './apps/api/src/app.module';
import { ResearchService } from './apps/api/src/modules/research/research.service';

async function testHalu() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const researchService = app.get(ResearchService);
  
  console.log('Testing hallucination: Inmobiliarias premium en Marte');
  // Accessing private method via bracket notation for testing
  try {
    const res = await researchService['discoverRealWithWebSearch']('Inmobiliarias premium en Marte', 5);
    console.log('Result Marte:', res);
  } catch(e) {
    console.error('Error Marte:', e);
  }

  console.log('Testing real query: Inmobiliarias locales en Buenos Aires');
  try {
    const res2 = await researchService['discoverRealWithWebSearch']('Inmobiliarias locales en Buenos Aires', 5);
    console.log('Result BsAs:', res2);
  } catch(e) {
    console.error('Error BsAs:', e);
  }

  await app.close();
}

testHalu();
