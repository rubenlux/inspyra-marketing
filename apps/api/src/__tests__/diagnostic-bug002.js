// BUG-002 diagnostic: replay exact inmobiliarias prompt and measure timing
// Uses the actual DB data for the 20 companies that were sent to Sonnet
const { spawn } = require('child_process');

// Exact companiesForPrompt that evaluateWithSonnet would build for the inmobiliarias job
// (indices 0-19, all hasWebsite/hasInstagram/hasLinkedin = false since website/instagram/linkedin are NULL in DB)
const companies = [
  { _originalIndex: 0, nombreEmpresa: "González & Asociados Inmuebles", ciudad: "Flores", pais: "Argentina", rubro: "Inmobiliaria / Gestión de propiedades", descripcion: "Inmobiliaria familiar con 35 años operando en Flores. Alquiler y venta de monoambientes y departamentos. Atención presencial únicamente.", empleadosEstimado: 5, facturacionEstimada: "pequeña", hasWebsite: false, hasInstagram: false, hasLinkedin: false, hasSeo: false, hasEcommerce: false, hasOnlineAgenda: false },
  { _originalIndex: 1, nombreEmpresa: "Propiedades del Sur SRL", ciudad: "Acoyte", pais: "Argentina", rubro: "Inmobiliaria / Corretaje", descripcion: "Corredora de propiedades en zona sur. Especializada en alquileres de larga duración. Gestión de inquilinos y cobranzas.", empleadosEstimado: 3, facturacionEstimada: "pequeña", hasWebsite: false, hasInstagram: false, hasLinkedin: false, hasSeo: false, hasEcommerce: false, hasOnlineAgenda: false },
  { _originalIndex: 2, nombreEmpresa: "Construcciones Martínez & Hijos", ciudad: "San Justo", pais: "Argentina", rubro: "Desarrollista / Construcción", descripcion: "Constructora con 28 años. Desarrolla proyectos de vivienda multifamiliar. Venta de unidades de forma directa.", empleadosEstimado: 12, facturacionEstimada: "mediana", hasWebsite: false, hasInstagram: false, hasLinkedin: false, hasSeo: false, hasEcommerce: false, hasOnlineAgenda: false },
  { _originalIndex: 3, nombreEmpresa: "Inmuebles Caballito Express", ciudad: "Caballito", pais: "Argentina", rubro: "Inmobiliaria / Alquileres", descripcion: "Agencia de alquileres rápidos en Caballito. Enfoque en departamentos para estudiantes y jóvenes profesionales.", empleadosEstimado: 4, facturacionEstimada: "pequeña", hasWebsite: false, hasInstagram: false, hasLinkedin: false, hasSeo: false, hasEcommerce: false, hasOnlineAgenda: false },
  { _originalIndex: 4, nombreEmpresa: "Casa Propia Inmobiliaria", ciudad: "La Boca", pais: "Argentina", rubro: "Inmobiliaria / Venta de propiedades", descripcion: "Inmobiliaria especializada en venta de casas en La Boca y alrededores. Cartera de 40+ propiedades.", empleadosEstimado: 6, facturacionEstimada: "pequeña", hasWebsite: false, hasInstagram: false, hasLinkedin: false, hasSeo: false, hasEcommerce: false, hasOnlineAgenda: false },
  { _originalIndex: 5, nombreEmpresa: "Barracas Desarrollos Inmobiliarios", ciudad: "Barracas", pais: "Argentina", rubro: "Desarrollista / Inmobiliaria", descripcion: "Desarrolladora que construye y vende departamentos en zona en crecimiento. Proyectos de 50-100 unidades.", empleadosEstimado: 8, facturacionEstimada: "mediana", hasWebsite: false, hasInstagram: false, hasLinkedin: false, hasSeo: false, hasEcommerce: false, hasOnlineAgenda: false },
  { _originalIndex: 6, nombreEmpresa: "Alquileres Rápidos Parque Centenario", ciudad: "Parque Centenario", pais: "Argentina", rubro: "Inmobiliaria / Gestión de alquileres", descripcion: "Agencia de alquileres de corta y larga duración. Enfoque en amueblados para turistas y ejecutivos.", empleadosEstimado: 5, facturacionEstimada: "pequeña", hasWebsite: false, hasInstagram: false, hasLinkedin: false, hasSeo: false, hasEcommerce: false, hasOnlineAgenda: false },
  { _originalIndex: 7, nombreEmpresa: "Propiedades Villa Ortúzar", ciudad: "Villa Ortúzar", pais: "Argentina", rubro: "Inmobiliaria / Venta y alquiler", descripcion: "Inmobiliaria con 20 años de trayectoria. Especializada en venta de casas en Villa Ortúzar y Belgrano.", empleadosEstimado: 4, facturacionEstimada: "pequeña", hasWebsite: false, hasInstagram: false, hasLinkedin: false, hasSeo: false, hasEcommerce: false, hasOnlineAgenda: false },
  { _originalIndex: 8, nombreEmpresa: "Constructora Nueva Época", ciudad: "Morón", pais: "Argentina", rubro: "Desarrollista / Construcción", descripcion: "Constructora con 15 años construyendo en zona oeste. Proyectos de viviendas multifamiliares y casas.", empleadosEstimado: 10, facturacionEstimada: "mediana", hasWebsite: false, hasInstagram: false, hasLinkedin: false, hasSeo: false, hasEcommerce: false, hasOnlineAgenda: false },
  { _originalIndex: 9, nombreEmpresa: "Inmobiliaria San Cristóbal", ciudad: "San Cristóbal", pais: "Argentina", rubro: "Inmobiliaria / Corretaje", descripcion: "Corredora de propiedades familiar. Alquileres y ventas en San Cristóbal y zona de influencia.", empleadosEstimado: 3, facturacionEstimada: "pequeña", hasWebsite: false, hasInstagram: false, hasLinkedin: false, hasSeo: false, hasEcommerce: false, hasOnlineAgenda: false },
  { _originalIndex: 10, nombreEmpresa: "Gestión Integral de Propiedades", ciudad: "Núñez", pais: "Argentina", rubro: "Inmobiliaria / Administración", descripcion: "Empresa de administración de propiedades y cobro de alquileres. Gestiona 150+ inmuebles en zona norte.", empleadosEstimado: 7, facturacionEstimada: "mediana", hasWebsite: false, hasInstagram: false, hasLinkedin: false, hasSeo: false, hasEcommerce: false, hasOnlineAgenda: false },
  { _originalIndex: 11, nombreEmpresa: "Propiedades San Isidro Premium", ciudad: "San Isidro", pais: "Argentina", rubro: "Inmobiliaria / Lujo", descripcion: "Inmobiliaria especializada en propiedades premium y casas en San Isidro. Venta de mansiones y chacras.", empleadosEstimado: 5, facturacionEstimada: "mediana", hasWebsite: false, hasInstagram: false, hasLinkedin: false, hasSeo: false, hasEcommerce: false, hasOnlineAgenda: false },
  { _originalIndex: 12, nombreEmpresa: "Alquileres Belgrano Centro", ciudad: "Belgrano", pais: "Argentina", rubro: "Inmobiliaria / Alquileres", descripcion: "Agencia de alquileres en Belgrano. Maneja departamentos y casas de clase media-alta.", empleadosEstimado: 4, facturacionEstimada: "pequeña", hasWebsite: false, hasInstagram: false, hasLinkedin: false, hasSeo: false, hasEcommerce: false, hasOnlineAgenda: false },
  { _originalIndex: 13, nombreEmpresa: "Desarrollos Paternal", ciudad: "Paternal", pais: "Argentina", rubro: "Desarrollista / Vivienda", descripcion: "Desarrolladora con 12 años. Construye departamentos para clase media en zona norte.", empleadosEstimado: 8, facturacionEstimada: "mediana", hasWebsite: false, hasInstagram: false, hasLinkedin: false, hasSeo: false, hasEcommerce: false, hasOnlineAgenda: false },
  { _originalIndex: 14, nombreEmpresa: "Inmuebles Mataderos", ciudad: "Mataderos", pais: "Argentina", rubro: "Inmobiliaria / Venta", descripcion: "Inmobiliaria especializada en venta de casas en Mataderos y ciudadela. Zona tradicional.", empleadosEstimado: 3, facturacionEstimada: "pequeña", hasWebsite: false, hasInstagram: false, hasLinkedin: false, hasSeo: false, hasEcommerce: false, hasOnlineAgenda: false },
  { _originalIndex: 15, nombreEmpresa: "Propiedades Retiro Express", ciudad: "Retiro", pais: "Argentina", rubro: "Inmobiliaria / Alquileres ejecutivos", descripcion: "Agencia especializada en alquiler de departamentos ejecutivos en Retiro para profesionales.", empleadosEstimado: 4, facturacionEstimada: "pequeña", hasWebsite: false, hasInstagram: false, hasLinkedin: false, hasSeo: false, hasEcommerce: false, hasOnlineAgenda: false },
  { _originalIndex: 16, nombreEmpresa: "Constructora San Justo Ltda", ciudad: "San Justo", pais: "Argentina", rubro: "Desarrollista / Construcción", descripcion: "Constructora con 18 años de experiencia. Desarrolla proyectos de viviendas multifamiliares.", empleadosEstimado: 11, facturacionEstimada: "mediana", hasWebsite: false, hasInstagram: false, hasLinkedin: false, hasSeo: false, hasEcommerce: false, hasOnlineAgenda: false },
  { _originalIndex: 17, nombreEmpresa: "Inmobiliaria Versalles", ciudad: "Versalles", pais: "Argentina", rubro: "Inmobiliaria / Alquileres", descripcion: "Agencia de alquileres en Versalles. Gestiona cartera de 80+ propiedades.", empleadosEstimado: 5, facturacionEstimada: "pequeña", hasWebsite: false, hasInstagram: false, hasLinkedin: false, hasSeo: false, hasEcommerce: false, hasOnlineAgenda: false },
  { _originalIndex: 18, nombreEmpresa: "Propiedades Acomodadas", ciudad: "Acoyte", pais: "Argentina", rubro: "Inmobiliaria / Clase media", descripcion: "Inmobiliaria enfocada en venta de departamentos de clase media en Acoyte.", empleadosEstimado: 3, facturacionEstimada: "pequeña", hasWebsite: false, hasInstagram: false, hasLinkedin: false, hasSeo: false, hasEcommerce: false, hasOnlineAgenda: false },
  { _originalIndex: 19, nombreEmpresa: "Viviendas Temperley", ciudad: "Temperley", pais: "Argentina", rubro: "Desarrollista / Vivienda", descripcion: "Desarrolladora de viviendas en zona sur. Proyectos de mediano porte.", empleadosEstimado: 7, facturacionEstimada: "mediana", hasWebsite: false, hasInstagram: false, hasLinkedin: false, hasSeo: false, hasEcommerce: false, hasOnlineAgenda: false },
];

// Exact prompt from evaluateWithSonnet
const prompt = `Sos el Senior Analyst de Inspyra Digital, agencia de marketing digital para pymes latinoamericanas (web, SEO local, redes sociales, publicidad digital, ecommerce, agendas online).

Tu ÚNICA tarea: evaluar estas ${companies.length} empresas usando ÚNICAMENTE los datos provistos. No busques información externa. Solo razonamiento sobre los campos del JSON.

SEÑALES DE PRESENCIA DIGITAL (ya calculadas por el sistema):
  hasWebsite / hasInstagram / hasLinkedin / hasSeo / hasEcommerce / hasOnlineAgenda = true/false

CRITERIOS DE SCORE — suma estricta, sin redondear, sin capear en 100:
  +30 — hasEcommerce: false (necesitan tienda online)
  +22 — hasSeo: false (oportunidad SEO local/orgánico)
  +17 — hasOnlineAgenda: false (aplica a gastronomía, salud, legal, servicios)
  +12 — hasWebsite: false (sin presencia web)
  +13 — hasInstagram: false y hasLinkedin: false (sin redes activas)
  +6  — Rubro con alta demanda Inspyra (gastronomía, salud, legal, inmobiliaria, turismo)
  -20 — Empresa grande con equipo de marketing interno
  -15 — Microempresa sin presupuesto probable (empleadosEstimado < 3, facturacion pequeña)
  -10 — Ya bien posicionada (todos los has* = true)

La suma máxima teórica (todos los positivos) es 100. Calculá la suma exacta — no la redondees ni la capees. Cada empresa debe tener un score diferente si sus señales difieren.

PROMOTE si score >= 55. DISCARD si score < 55.

EMPRESAS:
${JSON.stringify(companies, null, 2)}

REGLAS DE TEXTO — MUY IMPORTANTES:
  - reasoning: máximo 12 palabras. Sin puntos. Sin conectores.
  - oportunidadDetectada: máximo 12 palabras. Slug corto.
  - servicioSugerido: slug corto sin espacios innecesarios (ej: "Web+SEO", "SEO+Redes", "Web+Agenda")
  - problemasDetectados: array de slugs de 2-3 palabras (ej: ["Sin web", "Sin SEO"])
  - discardReason: slug de 3-5 palabras

FORMATO DE RESPUESTA (SOLO este JSON array, sin texto adicional):
[
  {
    "index": <_originalIndex de la empresa>,
    "nombreEmpresa": "nombre exacto",
    "action": "PROMOTE",
    "score": 71,
    "scoreBreakdown": {"sinEcommerce": 30, "sinSeo": 22, "sinAgenda": 0, "sinWeb": 0, "sinRedes": 13, "bonusRubro": 6, "penalizaciones": 0},
    "reasoning": "Sin web, sin SEO, sin redes. Alto potencial.",
    "problemasDetectados": ["Sin web", "Sin SEO"],
    "oportunidadDetectada": "Web + SEO local para captar clientes nuevos.",
    "servicioSugerido": "Web+SEO",
    "estimatedTicketUsd": 2100
  },
  {
    "index": <_originalIndex>,
    "nombreEmpresa": "nombre exacto",
    "action": "DISCARD",
    "score": 20,
    "scoreBreakdown": {"penalizaciones": -20},
    "reasoning": "Empresa grande con marketing interno.",
    "discardReason": "Marketing interno"
  }
]

Evalúa las ${companies.length} empresas. SOLO el JSON array.`;

console.log('=== BUG-002 Diagnostic: inmobiliarias Buenos Aires ===');
console.log('Prompt size:', prompt.length, 'chars,', Math.round(prompt.length / 4), 'tokens');
console.log('Companies: 20 (same as failed job 42b425e6)');
console.log('Starting Sonnet with exact same flags as evaluateWithSonnet...');
console.log('');

const start = Date.now();
let lastOutputAt = Date.now();
let stdoutBytes = 0;

const child = spawn('claude', [
  '-p', '-',
  '--output-format', 'text',
  '--dangerously-skip-permissions',
  '--strict-mcp-config',
  '--model', 'claude-sonnet-4-6',
  '--allowedTools', 'none',
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
  stdoutBytes += d.length;
  lastOutputAt = Date.now();
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  process.stdout.write(`[${elapsed}s] stdout chunk: ${d.length} bytes (total: ${stdoutBytes})\n`);
});

child.stderr.on('data', (d) => {
  stderr += d.toString();
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  process.stdout.write(`[${elapsed}s] stderr: ${d.toString().trim()}\n`);
});

// Heartbeat: print status every 30s
const heartbeat = setInterval(() => {
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[${elapsed}s] HEARTBEAT — stdout so far: ${stdoutBytes} bytes | process running: ${!child.killed}`);
}, 30000);

const TIMEOUT_MS = 8 * 60 * 1000; // 8 minutes (longer than production 5 min)
const timer = setTimeout(() => {
  clearInterval(heartbeat);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n[${elapsed}s] TIMEOUT — killed after 8 minutes`);
  console.log('stdout bytes received:', stdoutBytes);
  if (stderr) console.log('stderr (last 500):', stderr.slice(-500));
  child.kill('SIGTERM');
  process.exit(1);
}, TIMEOUT_MS);

child.on('close', (code) => {
  clearTimeout(timer);
  clearInterval(heartbeat);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n=== COMPLETED ===`);
  console.log(`Exit code: ${code} | Elapsed: ${elapsed}s | Output: ${stdout.length} chars`);

  if (code === 0 && stdout.length > 0) {
    try {
      const match = stdout.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        const promote = parsed.filter(e => e.action === 'PROMOTE').length;
        const discard = parsed.filter(e => e.action === 'DISCARD').length;
        const scores = parsed.map(e => e.score).sort((a, b) => b - a);
        console.log(`Parsed OK — PROMOTE: ${promote} | DISCARD: ${discard} | Total: ${parsed.length}`);
        console.log(`Scores: ${scores.join(', ')}`);
        console.log(`Response size: ${stdout.length} chars (~${Math.round(stdout.length/4)} tokens)`);
        console.log(`Sample entry: ${JSON.stringify(parsed[0]).slice(0, 300)}`);
      } else {
        console.log('No JSON array found in output.');
        console.log('Output (first 500):', stdout.slice(0, 500));
      }
    } catch (e) {
      console.log('Parse error:', e.message);
      console.log('Output (first 500):', stdout.slice(0, 500));
    }
  } else {
    console.log('Output (first 500):', stdout.slice(0, 500));
    if (stderr) console.log('Stderr:', stderr.slice(-500));
  }
  process.exit(code ?? 1);
});
