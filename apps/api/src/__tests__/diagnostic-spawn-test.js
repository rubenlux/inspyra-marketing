const { spawn } = require('child_process');

const sampleCompany = (i) => ({
  _originalIndex: i,
  nombreEmpresa: 'Estudio Juridico ' + i + ' y Asociados',
  ciudad: 'La Plata',
  provincia: 'Buenos Aires',
  pais: 'Argentina',
  rubro: 'Estudio juridico / Abogacia',
  website: 'estudio' + i + '-abogados.com.ar',
  instagram: '@estudio' + i + 'abogados',
  linkedin: 'linkedin.com/company/estudio' + i + '-abogados',
  descripcion: 'Estudio juridico fundado en 199' + (i % 10) + ' especializado en derecho comercial y civil. Atiende principalmente a pymes y comercios de La Plata. Su presencia online es minima: web basica de 2010 sin actualizaciones, sin blog ni contenido educativo, sin redes sociales activas. No figura en Google Maps ni tiene resenas online.',
  empleadosEstimado: 5 + i,
  anosFundacion: '199' + (i % 10),
  presenciaDigital: { tieneWeb: true, tieneSeo: false, tieneRedes: false, tieneEcommerce: false, tieneAgendaOnline: false },
  facturacionEstimada: 'pequena',
});

const companies = Array(20).fill(null).map((_, i) => sampleCompany(i));

const instructionsStatic = [
  'Sos el Senior Analyst de Inspyra Digital.',
  '',
  'Tu UNICA tarea: evaluar estas ' + companies.length + ' empresas y devolver un JSON array.',
  'NO uses herramientas. SOLO razona con los datos provistos. SOLO JSON como respuesta.',
  '',
  'CRITERIOS DE SCORE (0-100):',
  '  +35 Sin ecommerce/tienda online',
  '  +25 Sin SEO',
  '  +20 Sin agenda online',
  '  +15 Sin web o muy desactualizada',
  '  +15 Sin redes activas',
  '  +10 Rubro con alta demanda Inspyra',
  '  -20 Empresa grande con marketing interno',
  '  -15 Microempresa sin presupuesto probable',
  '  -10 Ya bien posicionada digitalmente',
  '',
  'PROMOTE si score >= 60. DISCARD si score < 60.',
  '',
  'EMPRESAS:',
  JSON.stringify(companies, null, 2),
  '',
  'FORMATO RESPUESTA (SOLO JSON array sin texto extra):',
  '[{"index":<_originalIndex>,"nombreEmpresa":"nombre","action":"PROMOTE","score":75,',
  '"scoreBreakdown":{"sinEcommerce":35,"sinSeo":25},"reasoning":"2-3 oraciones.",',
  '"problemasDetectados":["prob"],"oportunidadDetectada":"desc","servicioSugerido":"Web","estimatedTicketUsd":2100}]',
  '',
  'Evalua las ' + companies.length + ' empresas. SOLO el JSON array.',
].join('\n');

console.log('Prompt size:', instructionsStatic.length, 'chars,', Math.round(instructionsStatic.length / 4), 'tokens aprox');
console.log('Starting Sonnet 4.6 via spawn...');

const start = Date.now();
let lastDot = start;

const child = spawn('claude', [
  '-p', '-',
  '--output-format', 'text',
  '--dangerously-skip-permissions',
  '--model', 'claude-sonnet-4-6',
], {
  cwd: 'c:/Users/ruben/Documents/Mis-Proyectos/inspyra-marketing',
  stdio: ['pipe', 'pipe', 'pipe'],
});

child.stdin.write(instructionsStatic, 'utf8');
child.stdin.end();

let stdout = '';
let stderr = '';

child.stdout.on('data', (d) => {
  stdout += d;
  const now = Date.now();
  if (now - lastDot > 2000) {
    process.stdout.write(' [' + Math.round((now - start) / 1000) + 's, ' + stdout.length + 'ch] ');
    lastDot = now;
  }
});
child.stderr.on('data', (d) => { stderr += d.toString(); });

child.on('close', (code) => {
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log('\n\n=== RESULTADO ===');
  console.log('Exit code:', code);
  console.log('Elapsed:', elapsed, 'sec');
  console.log('Stdout:', stdout.length, 'chars');
  if (stderr.length > 0) console.log('STDERR (first 300):', stderr.slice(0, 300));
  if (stdout.length > 0) console.log('Output preview (first 300):', stdout.slice(0, 300));
  process.exit(0);
});

const TIMEOUT_SEC = 60;
setTimeout(() => {
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log('\n\n=== TIMEOUT ' + TIMEOUT_SEC + 's REACHED ===');
  console.log('Elapsed:', elapsed, 'sec');
  console.log('Stdout so far:', stdout.length, 'chars');
  if (stderr.length > 0) console.log('STDERR:', stderr.slice(0, 500));
  console.log('Output so far:', stdout.slice(0, 300));
  child.kill('SIGTERM');
  process.exit(1);
}, TIMEOUT_SEC * 1000);
