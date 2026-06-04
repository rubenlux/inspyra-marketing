import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Inspyra ERP database...');

  // Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'inspyra' },
    update: {},
    create: { name: 'Inspyra Agency', slug: 'inspyra', plan: 'pro' },
  });
  console.log(`✅ Tenant: ${tenant.name}`);

  // Admin user
  const hash = await argon2.hash('Admin1234!');
  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@inspyra.io' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@inspyra.io',
      password: hash,
      firstName: 'Admin',
      lastName: 'Inspyra',
      role: 'ADMIN',
      emailVerified: true,
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // Service Catalog
  const catalog = [
    { nombre: 'Diseño Web Corporativo', categoria: 'WEB', precioBaseUsd: 1500, billingModelDefault: 'UNICO', descripcionDefault: 'Diseño y desarrollo de sitio web corporativo hasta 10 páginas' },
    { nombre: 'Tienda Online (E-commerce)', categoria: 'WEB', precioBaseUsd: 2500, billingModelDefault: 'UNICO', descripcionDefault: 'Tienda online con carrito, pagos y panel de gestión' },
    { nombre: 'SEO Mensual', categoria: 'SEO', precioBaseUsd: 600, billingModelDefault: 'MENSUAL', descripcionDefault: 'Posicionamiento orgánico: técnico, contenidos y link building' },
    { nombre: 'Google Ads Management', categoria: 'ADS', precioBaseUsd: 500, billingModelDefault: 'MENSUAL', descripcionDefault: 'Gestión de campañas de búsqueda y display en Google' },
    { nombre: 'Meta Ads Management', categoria: 'ADS', precioBaseUsd: 500, billingModelDefault: 'MENSUAL', descripcionDefault: 'Gestión de campañas en Facebook e Instagram' },
    { nombre: 'Branding Completo', categoria: 'BRANDING', precioBaseUsd: 1200, billingModelDefault: 'UNICO', descripcionDefault: 'Logo, paleta, tipografía y manual de marca' },
    { nombre: 'Hosting Gestionado (HostingGuard)', categoria: 'HOSTING', precioBaseUsd: 49, billingModelDefault: 'MENSUAL', descripcionDefault: 'Hosting con actualizaciones, backups y monitoreo 24/7' },
    { nombre: 'Email Marketing Automation', categoria: 'EMAIL_MKT', precioBaseUsd: 400, billingModelDefault: 'MENSUAL', descripcionDefault: 'Plataforma + flows de automatización + newsletters' },
    { nombre: 'Soporte y Mantenimiento', categoria: 'SOPORTE', precioBaseUsd: 200, billingModelDefault: 'MENSUAL', descripcionDefault: 'Mantenimiento técnico mensual y soporte prioritario' },
    { nombre: 'Consultoría Estratégica Digital', categoria: 'CONSULTORIA', precioBaseUsd: 150, billingModelDefault: 'POR_HORAS', descripcionDefault: 'Sesiones de estrategia digital 1:1' },
  ] as const;

  for (const item of catalog) {
    await prisma.serviceCatalogItem.upsert({
      where: { id: `seed-${item.nombre.toLowerCase().replace(/\s/g, '-')}` },
      update: {},
      create: {
        id: `seed-${item.nombre.toLowerCase().replace(/\s/g, '-')}`,
        tenantId: tenant.id,
        nombre: item.nombre,
        categoria: item.categoria as any,
        descripcionDefault: item.descripcionDefault,
        precioBaseUsd: item.precioBaseUsd,
        billingModelDefault: item.billingModelDefault as any,
        activo: true,
      },
    });
  }
  console.log(`✅ Service catalog: ${catalog.length} items`);

  // Service Intelligence Rules — Inspyra's commercial knowledge
  const intelRules = [
    {
      id: 'intel-sin-seo',
      problemPattern: 'sin seo,sin posicionamiento,no aparece en google,web sin seo,sin optimización',
      impactoDescripcion: 'No aparece en búsquedas locales — clientes van directamente a la competencia',
      serviciosRecomendados: ['SEO Mensual'],
      prioridad: 'ALTA',
      ticketEstimadoUsd: 600,
      bundleSugerido: 'SEO + Web',
    },
    {
      id: 'intel-web-vieja',
      problemPattern: 'web vieja,web antigua,web desactualizada,web de 201,web de 202,diseño antiguo,sin mobile',
      impactoDescripcion: 'Tasa de rebote alta, no convierte, daña imagen de marca y reduce confianza del cliente',
      serviciosRecomendados: ['Diseño Web Corporativo'],
      prioridad: 'ALTA',
      ticketEstimadoUsd: 1500,
      bundleSugerido: 'SEO + Web',
    },
    {
      id: 'intel-sin-google-ads',
      problemPattern: 'sin google ads,sin campañas,sin publicidad google,no pauta en google',
      impactoDescripcion: 'Pierde tráfico de búsqueda pagada frente a competidores que sí invierten en ads',
      serviciosRecomendados: ['Google Ads Management'],
      prioridad: 'MEDIA',
      ticketEstimadoUsd: 500,
      bundleSugerido: null,
    },
    {
      id: 'intel-sin-meta-ads',
      problemPattern: 'sin meta ads,sin facebook ads,sin instagram ads,sin pauta redes',
      impactoDescripcion: 'Sin captación de leads desde redes sociales donde está su audiencia objetivo',
      serviciosRecomendados: ['Meta Ads Management'],
      prioridad: 'MEDIA',
      ticketEstimadoUsd: 500,
      bundleSugerido: 'Ads + Landing',
    },
    {
      id: 'intel-sin-instagram',
      problemPattern: 'instagram abandonado,sin instagram,instagram desactualizado,poca presencia social,sin redes sociales',
      impactoDescripcion: 'Branding inconsistente y sin presencia social — pierde credibilidad ante prospectos jóvenes',
      serviciosRecomendados: ['Branding Completo'],
      prioridad: 'MEDIA',
      ticketEstimadoUsd: 1200,
      bundleSugerido: 'Branding + Redes',
    },
    {
      id: 'intel-sin-ssl',
      problemPattern: 'sin ssl,sin https,certificado vencido,http sin seguridad,sitio no seguro',
      impactoDescripcion: 'Google penaliza en ranking y los navegadores muestran advertencia de seguridad a visitantes',
      serviciosRecomendados: ['Hosting Gestionado (HostingGuard)', 'SEO Mensual'],
      prioridad: 'ALTA',
      ticketEstimadoUsd: 49,
      bundleSugerido: null,
    },
    {
      id: 'intel-sin-email-mkt',
      problemPattern: 'sin email marketing,sin newsletter,sin automatización email,no envía mails',
      impactoDescripcion: 'Pierde canal de retención y fidelización de bajo costo con mayor ROI del marketing digital',
      serviciosRecomendados: ['Email Marketing Automation'],
      prioridad: 'BAJA',
      ticketEstimadoUsd: 400,
      bundleSugerido: null,
    },
    {
      id: 'intel-sin-landing',
      problemPattern: 'sin landing,sin página de conversión,sin formulario de contacto,sin captación leads',
      impactoDescripcion: 'El tráfico llega pero no convierte — sin landing dedicada se pierde el 70% del potencial',
      serviciosRecomendados: ['Diseño Web Corporativo'],
      prioridad: 'ALTA',
      ticketEstimadoUsd: 800,
      bundleSugerido: 'Ads + Landing',
    },
  ] as const;

  for (const rule of intelRules) {
    await prisma.serviceIntelligenceRule.upsert({
      where: { id: rule.id },
      update: {},
      create: {
        id: rule.id,
        tenantId: tenant.id,
        problemPattern: rule.problemPattern,
        impactoDescripcion: rule.impactoDescripcion,
        serviciosRecomendados: [...rule.serviciosRecomendados],
        prioridad: rule.prioridad as any,
        ticketEstimadoUsd: rule.ticketEstimadoUsd,
        bundleSugerido: rule.bundleSugerido ?? null,
        activo: true,
      },
    });
  }
  console.log(`✅ Service Intelligence rules: ${intelRules.length} reglas`);

  // Sample prospect
  await prisma.prospect.upsert({
    where: { id: 'seed-prospect-1' },
    update: {},
    create: {
      id: 'seed-prospect-1',
      tenantId: tenant.id,
      nombreEmpresa: 'Inmobiliaria Del Valle',
      nombreContacto: 'Carlos Fernández',
      cargo: 'Gerente Comercial',
      telefono: '+54 11 4567-8901',
      email: 'carlos@delvalle.com.ar',
      pais: 'Argentina',
      ciudad: 'Buenos Aires',
      rubro: 'Inmobiliaria',
      website: 'http://delvalle.com.ar',
      score: 82,
      prioridad: 'ALTA',
      nivelOportunidad: 'ALTA',
      oportunidadDetectada: 'Web desactualizada, sin SEO local, sin Google Ads',
      problemasEncontrados: ['Sin SSL', 'Web 2015', 'Sin SEO local', 'Sin campañas pagas'],
      servicioSugerido: 'Web + SEO + Google Ads',
      estado: 'LISTO_OUTREACH',
      fuente: 'MANUAL',
      detectadoPor: 'MANUAL',
      ownerId: admin.id,
      creadoPorId: admin.id,
    },
  });
  console.log('✅ Sample prospect created');

  // Service accounts — one per agent with minimal scopes
  const serviceAccounts = [
    {
      id: 'sa-research',
      name: 'Research Agent',
      agentName: 'research-agent',
      scopes: ['prospects.read', 'prospects.create', 'prospects.update', 'intel.read'],
    },
    {
      id: 'sa-opportunity',
      name: 'Opportunity Agent',
      agentName: 'opportunity-agent',
      scopes: ['prospects.read', 'catalog.read', 'intel.read', 'score.update'],
    },
    {
      id: 'sa-proposal',
      name: 'Proposal Agent',
      agentName: 'proposal-agent',
      scopes: ['prospects.read', 'catalog.read', 'pricing.read'],
    },
    {
      id: 'sa-meeting',
      name: 'Meeting Agent',
      agentName: 'meeting-agent',
      scopes: ['deals.read', 'prospects.read', 'deals.notes'],
    },
    {
      id: 'sa-followup',
      name: 'Follow-up Agent',
      agentName: 'followup-agent',
      scopes: ['deals.read', 'prospects.read', 'deals.next_action'],
    },
  ];

  for (const sa of serviceAccounts) {
    await prisma.serviceAccount.upsert({
      where: { id: sa.id },
      update: { scopes: sa.scopes },
      create: {
        id: sa.id,
        tenantId: tenant.id,
        name: sa.name,
        agentName: sa.agentName,
        scopes: sa.scopes,
        isActive: true,
      },
    });
  }
  console.log(`✅ Service accounts: ${serviceAccounts.length} agentes`);

  console.log('\n🚀 Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin login:');
  console.log('  Email:    admin@inspyra.io');
  console.log('  Password: Admin1234!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
