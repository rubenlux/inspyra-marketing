import { isLocalBusiness, isHighReviewSector } from './sectors';
import type { ServiceDefinition } from './types';

// Servicios que INSPYRA vende. Solo estos IDs califican como oportunidad comercial.
// Si ningún problema detectado mapea a uno de estos → DISCARDED (NO_SERVICE_MATCH).
export const INSPYRA_SERVICE_IDS = new Set<string>([
  'web-new',           // Diseño y desarrollo web
  'web-redesign',      // Diseño y desarrollo web
  'landing-page',      // Diseño y desarrollo web (conversión)
  'lead-capture',      // Diseño y desarrollo web (conversión)
  'ecommerce',         // Ecommerce
  'hostingguard',      // Seguridad, backups y monitoreo
  'seo-technical',     // SEO técnico y posicionamiento
  'seo-local',         // SEO técnico y posicionamiento
  'seo-schema',        // SEO técnico y posicionamiento
  'gbp-management',    // SEO técnico y posicionamiento (GBP local)
  'social-management', // Redes sociales gestionadas
]);

export const SIR_CATALOG: ServiceDefinition[] = [
  {
    id: 'gbp-management',
    category: 'google_business',
    name: 'Gestión de Google Business Profile',
    pitch: 'Tu perfil en Google Maps no está siendo aprovechado — clientes que buscan tu rubro en la zona eligen competidores con perfiles más completos y con reseñas recientes',
    sectorFit: ['GASTRONOMIA', 'SALUD', 'BELLEZA', 'FITNESS', 'LEGAL', 'CONTABLE', 'CONSTRUCCION', 'TURISMO', 'INMOBILIARIA', 'RETAIL', 'EDUCACION'],
    businessModelFit: [],
    signalDefs: [
      {
        id: 'local_sector',
        label: 'Negocio local que depende de clientes por cercanía',
        severity: 'high',
        source: 'context',
        condition: (ctx) => isLocalBusiness(ctx.sector),
      },
      {
        id: 'no_instagram_local',
        label: 'Sin Instagram — GBP es la única vidriera digital',
        severity: 'medium',
        source: 'context',
        condition: (ctx) => !ctx.hasInstagram,
      },
    ],
    avgTicketUsd: [200, 500],
  },
  {
    id: 'seo-local',
    category: 'seo',
    name: 'SEO Local',
    pitch: 'Tu negocio no aparece cuando alguien busca tu rubro en tu ciudad',
    sectorFit: ['GASTRONOMIA', 'SALUD', 'BELLEZA', 'FITNESS', 'LEGAL', 'CONTABLE', 'CONSTRUCCION', 'TURISMO', 'INMOBILIARIA'],
    businessModelFit: [],
    signalDefs: [
      {
        id: 'local_with_website',
        label: 'Negocio local con sitio web donde aplicar SEO',
        severity: 'high',
        source: 'context',
        condition: (ctx) => isLocalBusiness(ctx.sector) && ctx.hasWebsite,
      },
    ],
    avgTicketUsd: [300, 800],
  },
  {
    id: 'review-management',
    category: 'google_business',
    name: 'Gestión de Reseñas',
    pitch: 'Las reseñas online son el primer filtro que usan tus clientes potenciales para elegir',
    sectorFit: ['GASTRONOMIA', 'SALUD', 'BELLEZA', 'FITNESS', 'TURISMO', 'LEGAL', 'INMOBILIARIA'],
    businessModelFit: [],
    signalDefs: [
      {
        id: 'high_review_sector',
        label: 'Sector donde las reseñas son el principal factor de decisión de compra',
        severity: 'critical',
        source: 'context',
        condition: (ctx) => isHighReviewSector(ctx.sector),
      },
      {
        id: 'reputation_sector',
        label: 'Sector donde la reputación online condiciona la captación de clientes',
        severity: 'high',
        source: 'context',
        condition: (ctx) => ['LEGAL', 'INMOBILIARIA'].includes(ctx.sector),
      },
    ],
    avgTicketUsd: [150, 400],
  },
  {
    id: 'social-management',
    category: 'social',
    name: 'Gestión de Redes Sociales',
    pitch: 'Tu competencia capta clientes en Instagram todos los días — vos no tenés presencia activa',
    sectorFit: ['GASTRONOMIA', 'BELLEZA', 'FITNESS', 'RETAIL', 'TURISMO', 'BODEGA', 'ECOMMERCE'],
    businessModelFit: ['B2C'],
    signalDefs: [
      {
        id: 'no_instagram_visual_sector',
        label: 'Negocio visual B2C sin presencia en Instagram detectada',
        severity: 'high',
        source: 'context',
        condition: (ctx) => !ctx.hasInstagram,
      },
      {
        id: 'visual_sector_always',
        label: 'Sector altamente visual donde redes son canal de adquisición clave',
        severity: 'medium',
        source: 'context',
        condition: (ctx) => ['GASTRONOMIA', 'BELLEZA', 'FITNESS', 'BODEGA'].includes(ctx.sector),
      },
    ],
    avgTicketUsd: [300, 800],
  },
  {
    id: 'crm-setup',
    category: 'crm_ventas',
    name: 'Setup CRM',
    pitch: 'Estás perdiendo oportunidades de venta porque no tenés un sistema para gestionarlas',
    sectorFit: ['INMOBILIARIA', 'LEGAL', 'CONTABLE', 'TECNOLOGIA', 'EDUCACION', 'CONSULTORIA'],
    businessModelFit: ['B2B'],
    signalDefs: [
      {
        id: 'b2b_needs_crm',
        label: 'Empresa B2B con ciclo de venta largo sin CRM',
        severity: 'high',
        source: 'context',
        condition: (ctx) => ctx.businessModel === 'B2B',
      },
      {
        id: 'medium_team',
        label: 'Equipo con varios vendedores donde el seguimiento manual falla',
        severity: 'medium',
        source: 'context',
        condition: (ctx) => (ctx.empleadosEstimado ?? 0) >= 5,
      },
    ],
    avgTicketUsd: [500, 2000],
  },
  {
    id: 'whatsapp-setup',
    category: 'whatsapp',
    name: 'WhatsApp Business Setup',
    pitch: 'Estás perdiendo consultas porque no respondés por WhatsApp de manera profesional',
    sectorFit: ['GASTRONOMIA', 'SALUD', 'BELLEZA', 'FITNESS', 'INMOBILIARIA', 'CONSTRUCCION', 'EDUCACION', 'RETAIL', 'LEGAL', 'CONTABLE'],
    businessModelFit: [],
    signalDefs: [
      {
        id: 'service_sector_latam',
        label: 'Sector donde WhatsApp es el canal principal de consultas en LATAM',
        severity: 'high',
        source: 'context',
        condition: (ctx) => ['GASTRONOMIA', 'SALUD', 'BELLEZA', 'FITNESS', 'INMOBILIARIA', 'CONSTRUCCION', 'EDUCACION', 'RETAIL', 'LEGAL', 'CONTABLE'].includes(ctx.sector),
      },
    ],
    avgTicketUsd: [200, 600],
  },
  {
    id: 'web-new',
    category: 'web_dev',
    name: 'Sitio Web Nuevo',
    pitch: 'No tenés presencia web — estás perdiendo a todos los clientes que buscan online',
    sectorFit: [],
    businessModelFit: [],
    signalDefs: [
      {
        id: 'no_website_at_all',
        label: 'Sin presencia web detectada',
        severity: 'critical',
        source: 'context',
        condition: (ctx) => !ctx.hasWebsite,
      },
    ],
    avgTicketUsd: [1500, 5000],
  },
  {
    id: 'web-redesign',
    category: 'web_dev',
    name: 'Rediseño Web',
    pitch: 'Tu sitio actual transmite que la empresa está desactualizada',
    sectorFit: [],
    businessModelFit: [],
    signalDefs: [
      {
        id: 'old_site_signals',
        label: 'Sitio existente con señales de antigüedad detectadas en los problemas',
        severity: 'high',
        source: 'context',
        condition: (ctx) =>
          ctx.hasWebsite &&
          ctx.problemasEncontrados.some((p) =>
            /desactualiz|viejo|antiguo|obsolet|sin.?responsive|móvil\s+no|bootstrap\s+[123]|jquery\s+1\./i.test(p),
          ),
      },
    ],
    avgTicketUsd: [1500, 6000],
  },
  {
    id: 'landing-page',
    category: 'web_dev',
    name: 'Landing Page de Conversión',
    pitch: 'Tu sitio no convierte visitas en consultas ni clientes',
    sectorFit: ['INMOBILIARIA', 'LEGAL', 'CONTABLE', 'EDUCACION', 'CONSULTORIA', 'TECNOLOGIA'],
    businessModelFit: ['B2B'],
    signalDefs: [
      {
        id: 'b2b_no_conversion',
        label: 'Empresa B2B sin landing de conversión dedicada',
        severity: 'high',
        source: 'context',
        condition: (ctx) => ctx.businessModel === 'B2B',
      },
    ],
    avgTicketUsd: [800, 2500],
  },
  {
    id: 'seo-technical',
    category: 'seo',
    name: 'SEO Técnico',
    pitch: 'Google tiene dificultades para rastrear e indexar tu sitio correctamente',
    sectorFit: [],
    businessModelFit: [],
    signalDefs: [
      {
        id: 'seo_problems_in_analysis',
        label: 'Problemas de SEO técnico detectados en el análisis del sitio',
        severity: 'high',
        source: 'context',
        condition: (ctx) =>
          ctx.hasWebsite &&
          ctx.problemasEncontrados.some((p) =>
            /\bseo\b|meta.?desc|título.?página|title.?tag|h1\b|canonical|robots\.txt|sitemap|indexac/i.test(p),
          ),
      },
    ],
    avgTicketUsd: [400, 1200],
  },
  {
    id: 'seo-schema',
    category: 'seo',
    name: 'SEO Schema (Datos Estructurados)',
    pitch: 'Tu sitio no aparece con resultados enriquecidos en Google (estrellitas, precios, FAQ)',
    sectorFit: [],
    businessModelFit: [],
    signalDefs: [
      {
        id: 'schema_problems_detected',
        label: 'Sin datos estructurados detectados en el análisis',
        severity: 'high',
        source: 'context',
        condition: (ctx) =>
          ctx.hasWebsite &&
          ctx.problemasEncontrados.some((p) =>
            /schema|datos.?estructurados|json.?ld|structured.?data|markup/i.test(p),
          ),
      },
      {
        id: 'local_biz_schema_opportunity',
        label: 'Negocio local — Schema mejora visibilidad local y genera rich results',
        severity: 'medium',
        source: 'context',
        condition: (ctx) => isLocalBusiness(ctx.sector) && ctx.hasWebsite,
      },
    ],
    avgTicketUsd: [300, 700],
  },
  {
    id: 'hostingguard',
    category: 'security',
    name: 'HostingGuard',
    pitch: 'Tu sitio tiene vulnerabilidades de seguridad que afectan la confianza de tus clientes',
    sectorFit: [],
    businessModelFit: [],
    signalDefs: [
      {
        id: 'security_problems_detected',
        label: 'Problemas de seguridad detectados en el análisis del sitio',
        severity: 'high',
        source: 'context',
        condition: (ctx) =>
          ctx.hasWebsite &&
          ctx.problemasEncontrados.some((p) =>
            /seguridad|security|ssl\b|https\b|certificado|csp\b|hsts|vulnerab|hackeo/i.test(p),
          ),
      },
      {
        id: 'any_website_has_risk',
        label: 'Cualquier sitio web tiene margen de mejora en seguridad',
        severity: 'low',
        source: 'context',
        condition: (ctx) => ctx.hasWebsite,
      },
    ],
    avgTicketUsd: [150, 400],
  },
  {
    id: 'meta-ads',
    category: 'ads',
    name: 'Meta Ads (Facebook + Instagram)',
    pitch: 'No estás alcanzando a tu audiencia objetivo con publicidad en Meta',
    sectorFit: ['GASTRONOMIA', 'BELLEZA', 'FITNESS', 'RETAIL', 'INMOBILIARIA', 'ECOMMERCE', 'TURISMO'],
    businessModelFit: ['B2C'],
    signalDefs: [
      {
        id: 'b2c_visual_sector_ads',
        label: 'Sector B2C con audiencia activa y receptiva en Meta',
        severity: 'high',
        source: 'context',
        condition: (ctx) => ['GASTRONOMIA', 'BELLEZA', 'FITNESS', 'RETAIL', 'TURISMO', 'ECOMMERCE'].includes(ctx.sector),
      },
    ],
    avgTicketUsd: [500, 2000],
  },
  {
    id: 'email-automation',
    category: 'email',
    name: 'Email Marketing y Automatización',
    pitch: 'Perdés clientes que ya compraron porque no mantenés el contacto de forma sistemática',
    sectorFit: ['RETAIL', 'ECOMMERCE', 'EDUCACION', 'FITNESS', 'CONSULTORIA'],
    businessModelFit: [],
    signalDefs: [
      {
        id: 'has_repeat_customer_base',
        label: 'Sector con base de clientes recurrentes donde el email es canal rentable',
        severity: 'medium',
        source: 'context',
        condition: (ctx) =>
          ['RETAIL', 'ECOMMERCE', 'EDUCACION'].includes(ctx.sector) || (ctx.empleadosEstimado ?? 0) >= 10,
      },
    ],
    avgTicketUsd: [300, 1000],
  },
  {
    id: 'booking-automation',
    category: 'automation',
    name: 'Sistema de Turnos Online',
    pitch: 'Perdés consultas porque no podés tomar turnos las 24 horas de forma automática',
    sectorFit: ['SALUD', 'BELLEZA', 'FITNESS', 'LEGAL', 'CONTABLE'],
    businessModelFit: [],
    signalDefs: [
      {
        id: 'appointment_core_sector',
        label: 'Sector B2C donde el turno es la primera acción de compra del cliente',
        severity: 'critical',
        source: 'context',
        condition: (ctx) => ['SALUD', 'BELLEZA', 'FITNESS'].includes(ctx.sector),
      },
      {
        id: 'appointment_consult_sector',
        label: 'Sector profesional donde la consulta agendada es canal de captación',
        severity: 'medium',
        source: 'context',
        condition: (ctx) => ['LEGAL', 'CONTABLE'].includes(ctx.sector),
      },
    ],
    avgTicketUsd: [300, 1000],
  },
  {
    id: 'ecommerce',
    category: 'web_dev',
    name: 'Desarrollo Ecommerce',
    pitch: 'No vendés online — perdés todo el canal digital de ventas mientras tus competidores lo aprovechan',
    sectorFit: ['RETAIL', 'BODEGA', 'ECOMMERCE', 'GASTRONOMIA'],
    businessModelFit: ['B2C'],
    signalDefs: [
      {
        id: 'product_seller_no_store',
        label: 'Negocio de venta de productos sin canal de venta online',
        severity: 'critical',
        source: 'context',
        condition: (ctx) => ['RETAIL', 'BODEGA', 'ECOMMERCE'].includes(ctx.sector) && ctx.hasWebsite,
      },
      {
        id: 'b2c_no_ecommerce_signal',
        label: 'Empresa B2C con problemas de venta online detectados',
        severity: 'critical',
        source: 'context',
        condition: (ctx) =>
          ctx.businessModel === 'B2C' &&
          ctx.problemasEncontrados.some((p) =>
            /ecommerce|tienda.?online|venta.?online|carrito|sin.?tienda/i.test(p),
          ),
      },
    ],
    avgTicketUsd: [2000, 8000],
  },
  {
    id: 'lead-capture',
    category: 'web_dev',
    name: 'Captura de Leads (Formulario + CRM)',
    pitch: 'Tenés visitas web pero no sabés quiénes son — sin un sistema de captura, esos contactos se pierden',
    sectorFit: ['SALUD', 'BELLEZA', 'FITNESS', 'INMOBILIARIA', 'EDUCACION', 'LEGAL'],
    businessModelFit: [],
    signalDefs: [
      {
        id: 'website_no_lead_system',
        label: 'Tiene website pero sin sistema visible de captura de contactos',
        severity: 'high',
        source: 'context',
        condition: (ctx) => ctx.hasWebsite && ctx.problemasEncontrados.some((p) =>
          /formulario|form|contacto|captura|lead|conversión|conversion|sin.?cta/i.test(p)
        ),
      },
      {
        id: 'high_value_local_with_website',
        label: 'Negocio local de alto valor sin sistema de captación de prospectos',
        severity: 'medium',
        source: 'context',
        condition: (ctx) => ctx.hasWebsite && ['INMOBILIARIA', 'LEGAL', 'SALUD'].includes(ctx.sector),
      },
    ],
    avgTicketUsd: [400, 1200],
  },
];
