import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ResearchService } from './src/modules/research/research.service';

async function testHalu() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const researchService = app.get(ResearchService);
  
  console.log('Testing hallucination: Inmobiliarias premium en Marte');
  try {
    const res = await researchService['discoverRealWithWebSearch']('Inmobiliarias premium en Marte', 5);
    console.log('Result Marte:', res);
  } catch(e) {
    console.error('Error Marte:', e);
  }

  console.log('Testing real query: Hoteles Mendoza');
  try {
    const res2 = await researchService['discoverRealWithWebSearch']('Hoteles Mendoza', 5);
    console.log('Result Hoteles:', res2);
  } catch(e) {
    console.error('Error Hoteles:', e);
  }

  await app.close();
}

testHalu();
