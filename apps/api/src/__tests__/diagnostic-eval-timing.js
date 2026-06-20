// Final timing test: new prompt (no URLs) + --allowedTools '' via Node.js spawn
const { spawn } = require('child_process');

const companies = Array(20).fill(null).map((_, i) => ({
  _originalIndex: i,
  nombreEmpresa: 'Estudio Juridico ' + i + ' y Asociados',
  ciudad: 'La Plata',
  pais: 'Argentina',
  rubro: 'Estudio juridico / Abogacia',
  descripcion: 'Estudio fundado en 199' + (i % 10) + '. Presencia online minima. Sin redes sociales activas. No figura en Google Maps.',
  empleadosEstimado: 5 + (i * 2),
  facturacionEstimada: i % 3 === 0 ? 'mediana' : 'pequena',
  hasWebsite: i % 4 !== 0,
  hasInstagram: i % 5 === 0,
  hasLinkedin: i % 6 === 0,
  hasSeo: false,
  hasEcommerce: false,
  hasOnlineAgenda: i % 7 === 0,
}));

const prompt = [
  'Sos el Senior Analyst de Inspyra Digital, agencia de marketing digital para pymes latinoamericanas.',
  '',
  'Tu ÚNICA tarea: evaluar estas ' + companies.length + ' empresas usando ÚNICAMENTE los datos provistos.',
  'No busques información externa. Solo razonamiento sobre los campos del JSON.',
  '',
  'SEÑALES DE PRESENCIA DIGITAL (ya calculadas):',
  '  hasWebsite / hasInstagram / hasLinkedin / hasSeo / hasEcommerce / hasOnlineAgenda = true/false',
  '',
  'CRITERIOS DE SCORE (0-100):',
  '  +35 — hasEcommerce: false',
  '  +25 — hasSeo: false',
  '  +20 — hasOnlineAgenda: false (gastronomía, salud, legal, servicios)',
  '  +15 — hasWebsite: false',
  '  +15 — hasInstagram y hasLinkedin ambos false',
  '  +10 — Rubro alta demanda (gastronomía, salud, legal, inmobiliaria, turismo)',
  '  -20 — Empresa grande con marketing interno',
  '  -15 — Microempresa sin presupuesto (empleados < 3, facturacion pequeña)',
  '  -10 — Ya bien posicionada (todos los has* = true)',
  '',
  'PROMOTE si score >= 60. DISCARD si score < 60.',
  '',
  'EMPRESAS:',
  JSON.stringify(companies, null, 2),
  '',
  'FORMATO (SOLO JSON array):',
  '[{"index":<_originalIndex>,"nombreEmpresa":"nombre","action":"PROMOTE","score":75,',
  '"scoreBreakdown":{"sinEcommerce":35,"sinSeo":25,"sinAgenda":0,"sinWeb":0,"sinRedes":15,"bonusRubro":10,"penalizaciones":0},',
  '"reasoning":"2-3 oraciones.","problemasDetectados":["prob"],"oportunidadDetectada":"desc","servicioSugerido":"Web+SEO","estimatedTicketUsd":2100}]',
  '',
  'Evalúa las ' + companies.length + ' empresas. SOLO el JSON array.',
].join('\n');

console.log('Prompt size:', prompt.length, 'chars,', Math.round(prompt.length / 4), 'tokens');
console.log('Starting Sonnet + --allowedTools ""...');

const start = Date.now();

const child = spawn('claude', [
  '-p', '-',
  '--output-format', 'text',
  '--dangerously-skip-permissions',
  '--model', 'claude-sonnet-4-6',
  '--allowedTools', '',
], {
  cwd: 'c:/Users/ruben/Documents/Mis-Proyectos/inspyra-marketing',
  stdio: ['pipe', 'pipe', 'pipe'],
});

child.stdin.write(prompt, 'utf8');
child.stdin.end();

let stdout = '';
let stderr = '';

child.stdout.on('data', (d) => {
  stdout += d;
  process.stdout.write('.');
});
child.stderr.on('data', (d) => { stderr += d; });

child.on('close', (code) => {
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log('\n\nExit:', code, '| Elapsed:', elapsed, 's | Output:', stdout.length, 'chars');
  if (stderr) console.log('Stderr (300):', stderr.slice(0, 300));

  try {
    const match = stdout.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      const promote = parsed.filter(e => e.action === 'PROMOTE').length;
      const discard = parsed.filter(e => e.action === 'DISCARD').length;
      console.log('Parsed OK — PROMOTE:', promote, '| DISCARD:', discard, '| Total:', parsed.length);
      console.log('Sample entry:', JSON.stringify(parsed[0]).slice(0, 200));
    } else {
      console.log('No JSON array found. Output:', stdout.slice(0, 300));
    }
  } catch (e) {
    console.log('Parse error:', e.message);
    console.log('Raw output:', stdout.slice(0, 400));
  }
  process.exit(0);
});

setTimeout(() => {
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log('\nTIMEOUT 120s | Elapsed:', elapsed, 's | Output so far:', stdout.length, 'chars');
  if (stderr) console.log('Stderr:', stderr.slice(0, 300));
  child.kill('SIGTERM');
  process.exit(1);
}, 120000);
