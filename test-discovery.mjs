#!/usr/bin/env node

/**
 * Test script: Buscar bodegas en Mendoza sin intervención de Claude
 * Fases: Discovery → Evidence Validation → Qualification Signals → Contact Acquisition
 */

const API = 'http://localhost:3001/api/v1';
const tenant_test = 'test-tenant-001';
const user_test = { email: 'test@example.com', password: 'Test123!' };

async function req(method, path, body = null, token = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (token) opts.headers.Authorization = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API}${path}`, opts);
  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(`${res.status} ${json?.error?.message || 'unknown error'}`);
  }

  return json.data;
}

async function main() {
  console.log('🔍 Test: Discovery Bodegas Mendoza (sin Claude)\n');

  // Step 1: Login o crear usuario
  console.log('1️⃣  Autenticándose...');
  let token;
  try {
    const auth = await req('POST', '/auth/login', user_test);
    token = auth.accessToken;
    const me = await req('GET', '/auth/me', null, token);
    console.log(`   ✅ Login exitoso: ${me.email} (tenant: ${me.tenant.name})`);
  } catch (err) {
    console.error(`   ❌ Error de autenticación: ${err.message}`);
    process.exit(1);
  }

  // Step 2: Crear research job
  console.log('\n2️⃣  Lanzando research job: "bodegas en Mendoza"...');
  let jobId;
  try {
    const job = await req('POST', '/research/jobs',
      { query: 'bodegas vino Mendoza Argentina', limit: 5 },
      token
    );
    jobId = job.id;
    console.log(`   ✅ Job creado: ${jobId}`);
    console.log(`   Status: ${job.status}`);
  } catch (err) {
    console.error(`   ❌ Error: ${err.message}`);
    process.exit(1);
  }

  // Step 3: Monitor pipeline
  console.log('\n3️⃣  Monitoreando pipeline (sin Claude intervieniendo)...');

  let completed = false;
  let attempts = 0;
  const maxAttempts = 120; // 2 minutos máximo

  while (!completed && attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, 1000));
    attempts++;

    try {
      const job = await req('GET', `/research/jobs/${jobId}`, null, token);

      if (job.agentOutput) {
        process.stdout.write(`\r   ${job.agentOutput}                    `);
      }

      if (job.status === 'COMPLETED' || job.status === 'FAILED') {
        console.log('\n');
        completed = true;

        console.log(`\n   Status Final: ${job.status}`);
        console.log(`   Empresas encontradas: ${job.candidatesFound}`);
        console.log(`   Prospectos promovidos: ${job.prospectsFound}`);

        if (job.status === 'FAILED') {
          console.log(`   Error: ${job.errorMessage}`);
        }

        // Step 4: Listar candidatos
        console.log('\n4️⃣  Candidatos descubiertos:');
        try {
          const candidates = await req('GET', `/research/jobs/${jobId}/candidates`, null, token);

          for (let i = 0; i < Math.min(candidates.length, 5); i++) {
            const c = candidates[i];
            console.log(`\n   [${i+1}] ${c.nombreEmpresa}`);
            console.log(`       Ciudad: ${c.ciudad}, País: ${c.pais}`);
            console.log(`       Rubro: ${c.rubro}`);
            console.log(`       Website: ${c.website || '(sin web)'}`);
            console.log(`       Status: ${c.status}`);
            if (c.discardReason) {
              console.log(`       ⚠️  Descartado: ${c.discardReason}`);
            }
          }

          console.log(`\n   Total: ${candidates.length} candidatos encontrados`);
        } catch (err) {
          console.log(`   Error listando candidatos: ${err.message}`);
        }
      }
    } catch (err) {
      console.log(`\n   ❌ Error monitoreo: ${err.message}`);
      break;
    }
  }

  if (!completed) {
    console.log('\n⏱️  Timeout esperando resultado (>2 min)');
  }

  console.log('\n✅ Test completado\n');
}

main().catch(err => {
  console.error(`\n❌ Fatal: ${err.message}`);
  process.exit(1);
});
