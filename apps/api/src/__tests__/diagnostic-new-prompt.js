// Measure the new prompt size after URL stripping
const companies = Array(20).fill(null).map((_, i) => ({
  _originalIndex: i,
  nombreEmpresa: 'Estudio Juridico ' + i + ' y Asociados',
  ciudad: 'La Plata',
  pais: 'Argentina',
  rubro: 'Estudio juridico / Abogacia',
  descripcion: 'Estudio fundado en 199' + (i % 10) + '. Presencia online minima. Sin redes sociales activas. No figura en Google Maps.',
  empleadosEstimado: 5 + i,
  facturacionEstimada: 'pequena',
  hasWebsite: true,
  hasInstagram: false,
  hasLinkedin: false,
  hasSeo: false,
  hasEcommerce: false,
  hasOnlineAgenda: false,
}));

const dataJson = JSON.stringify(companies, null, 2);

console.log('=== NUEVO PAYLOAD (sin URLs) ===');
console.log('1 empresa:', Math.round(dataJson.length / 20), 'chars');
console.log('20 empresas:', dataJson.length, 'chars,', Math.round(dataJson.length / 4), 'tokens');

const prompt = `Sos el Senior Analyst de Inspyra Digital...
[instrucciones ~500 chars]
EMPRESAS:
${dataJson}
[formato ~400 chars]`;

const oldSingleChars = 1001;
const oldTotalChars = 21962;
const newSingleChars = Math.round(dataJson.length / 20);
const newTotalChars = dataJson.length + 900 + 400; // header + footer

console.log('\n=== COMPARACIÓN ===');
console.log('Por empresa — antes:', oldSingleChars, 'chars | ahora:', newSingleChars, 'chars | reducción:', Math.round((1 - newSingleChars/oldSingleChars) * 100) + '%');
console.log('Total prompt — antes:', oldTotalChars, 'chars (~5491 tokens) | ahora:', newTotalChars, 'chars (~' + Math.round(newTotalChars/4) + ' tokens)');
console.log('Reducción total:', Math.round((1 - newTotalChars/oldTotalChars) * 100) + '%');

console.log('\n=== CAMPOS REMOVIDOS DEL PAYLOAD ===');
const removed = ['website (ej: estudio-abc.com.ar)', 'instagram (ej: @estudioabc)', 'linkedin (ej: linkedin.com/company/estudio-abc)', 'presenciaDigital (objeto anidado con 5 booleans → aplanado a hasX: boolean)', 'anosFundacion'];
removed.forEach(f => console.log(' -', f));

console.log('\n=== CAMPOS AGREGADOS ===');
const added = ['hasWebsite: boolean', 'hasInstagram: boolean', 'hasLinkedin: boolean', 'hasSeo: boolean', 'hasEcommerce: boolean', 'hasOnlineAgenda: boolean'];
added.forEach(f => console.log(' +', f));
