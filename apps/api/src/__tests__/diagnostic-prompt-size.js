// Diagnostic: calculate exact prompt size for evaluateWithSonnet
const sampleCompany = {
  _originalIndex: 3,
  nombreEmpresa: 'Estudio Juridico Fernandez y Asociados',
  ciudad: 'La Plata',
  provincia: 'Buenos Aires',
  pais: 'Argentina',
  rubro: 'Estudio juridico / Abogacia',
  website: 'fernandez-abogados.com.ar',
  instagram: '@fernandezabogados',
  linkedin: 'linkedin.com/company/fernandez-abogados',
  descripcion: 'Estudio juridico fundado en 1998 especializado en derecho comercial y civil. Atiende principalmente a pymes y comercios de La Plata. Su presencia online es minima: web basica de 2010 sin actualizaciones, sin blog ni contenido educativo, sin redes sociales activas. No figura en Google Maps ni tiene resenas online. Los potenciales clientes que buscan abogados en La Plata no los encuentran.',
  empleadosEstimado: 8,
  anosFundacion: '1998',
  presenciaDigital: { tieneWeb: true, tieneSeo: false, tieneRedes: false, tieneEcommerce: false, tieneAgendaOnline: false },
  facturacionEstimada: 'pequena',
};

const single = JSON.stringify(sampleCompany, null, 2);
console.log('=== 1 empresa ===');
console.log('chars:', single.length);
console.log('tokens aprox:', Math.round(single.length / 4));
console.log('');

const batch20 = JSON.stringify(Array(20).fill(null).map((_, i) => ({ ...sampleCompany, _originalIndex: i })), null, 2);
console.log('=== 20 empresas (JSON.stringify null,2) ===');
console.log('chars:', batch20.length);
console.log('tokens aprox:', Math.round(batch20.length / 4));
console.log('');

const header = `Sos el Senior Analyst de Inspyra Digital, agencia de marketing digital para pymes latinoamericanas (web, SEO local, redes sociales, publicidad digital, ecommerce, agendas online).

Tu UNICA tarea: evaluar estas 20 empresas y devolver un JSON array. NO uses herramientas. SOLO JSON como respuesta.

CRITERIOS DE SCORE (0-100):
  +35 Sin ecommerce/tienda online
  +25 Sin SEO
  +20 Sin agenda online
  +15 Sin web propia o muy desactualizada
  +15 Sin redes activas
  +10 Rubro con alta demanda Inspyra
  -20 Empresa grande con marketing interno
  -15 Microempresa sin presupuesto probable
  -10 Ya bien posicionada digitalmente

PROMOTE si score >= 60, DISCARD si score < 60

EMPRESAS (cada una tiene _originalIndex):
`;

const footer = `
FORMATO DE RESPUESTA (SOLO este JSON array):
[{ "index": <_originalIndex>, "nombreEmpresa", "action", "score", "scoreBreakdown", "reasoning", "problemasDetectados", "oportunidadDetectada", "servicioSugerido", "estimatedTicketUsd" }]

Evalua las 20 empresas. SOLO el JSON array como respuesta.`;

const totalPrompt = header + batch20 + footer;
console.log('=== PROMPT TOTAL ===');
console.log('header chars:', header.length);
console.log('footer chars:', footer.length);
console.log('data chars:', batch20.length);
console.log('TOTAL chars:', totalPrompt.length);
console.log('TOTAL tokens input aprox:', Math.round(totalPrompt.length / 4));
console.log('');

const sampleOutput = JSON.stringify(Array(20).fill(null).map((_, i) => ({
  index: i,
  nombreEmpresa: 'Empresa Ejemplo',
  action: 'PROMOTE',
  score: 75,
  scoreBreakdown: { sinEcommerce: 35, sinSeo: 25, sinAgenda: 0, sinWeb: 0, sinRedes: 15, bonusRubro: 10, penalizaciones: 0 },
  reasoning: 'Este estudio juridico presenta oportunidades claras para Inspyra. Su web de 2010 no convierte visitantes y no aparece en busquedas locales de abogados en La Plata. Alto potencial de conversion.',
  problemasDetectados: ['Sin SEO local', 'Web desactualizada 2010', 'Sin presencia en redes'],
  oportunidadDetectada: 'Rediseno web + SEO local para captar busquedas de abogados en La Plata.',
  servicioSugerido: 'Web + SEO Local',
  estimatedTicketUsd: 2100,
})), null, 2);

console.log('=== OUTPUT ESPERADO (20 evaluaciones completas) ===');
console.log('chars:', sampleOutput.length);
console.log('tokens output aprox:', Math.round(sampleOutput.length / 4));
console.log('');
console.log('=== TOTAL TOKENS ===');
console.log('Input:', Math.round(totalPrompt.length / 4));
console.log('Output:', Math.round(sampleOutput.length / 4));
console.log('Total:', Math.round((totalPrompt.length + sampleOutput.length) / 4));
console.log('');
console.log('=== TAREAS QUE REALIZA SONNET EN UNA LLAMADA ===');
console.log('Empresas:', 20);
console.log('Campos por empresa (PROMOTE):', 10, '(index, empresa, action, score, scoreBreakdown[7 subcampos], reasoning, problemas[], oportunidad, servicio, ticket)');
console.log('Campos por empresa (DISCARD):', 7);
console.log('Data points totales estimados:', 20 * 10);
console.log('');
console.log('=== TAREAS COMBINADAS EN 1 SOLA LLAMADA ===');
const tasks = [
  'Ranking: clasificar empresa por oportunidad comercial',
  'Scoring numerico: calcular score 0-100 con desglose de 7 sub-criterios',
  'Auditoria presencia digital: evaluar web/SEO/redes/ecommerce/agenda',
  'Reasoning: redactar analisis de 2-3 oraciones por empresa',
  'Deteccion de problemas: listar problemas especificos',
  'Calculo de oportunidad: describir que puede hacer Inspyra',
  'Service matching: elegir servicio del catalogo',
  'Ticket estimation: estimar valor en USD',
];
tasks.forEach((t, i) => console.log(`  ${i+1}. ${t}`));
