export const AUDIT_SIGNALS_PROMPT = (prospect: {
  nombreEmpresa: string;
  rubro?: string | null;
  ciudad?: string | null;
  pais?: string | null;
  website?: string | null;
  problemasEncontrados?: string[];
}) => {
  const url = prospect.website ?? null;

  if (!url) {
    return `La empresa "${prospect.nombreEmpresa}" no tiene sitio web registrado.

Devuelve SOLO este JSON, sin texto adicional:

{
  "accessible": false,
  "noWebsite": true,
  "httpsOk": null,
  "title": null,
  "hasMetaDescription": false,
  "h1Count": 0,
  "hasCanonical": false,
  "hasSchema": false,
  "schemaTypes": [],
  "hasViewport": false,
  "hasOgTags": false,
  "hasSitemap": false,
  "technology": [],
  "hasWordPress": false,
  "hasWooCommerce": false,
  "hasShopify": false,
  "hasEcommerce": false,
  "hasOnlineBooking": false,
  "hasContactForm": false,
  "hasLeadForm": false,
  "hasAnalytics": false,
  "hasMetaPixel": false,
  "hasSocialLinks": false,
  "socialLinksFound": [],
  "hasGoogleBusiness": false,
  "hasAddress": false,
  "hasPhone": false,
  "estimatedPageWeightKb": null,
  "hasImages": false,
  "imageCount": null,
  "mainNavSections": [],
  "robotsBlocked": false,
  "fetchError": "no_website"
}`;
  }

  return `Eres un auditor técnico web. Tu misión es obtener HECHOS VERIFICABLES del sitio web de esta empresa.

NO razonar. NO recomendar. Solo recolectar datos objetivos.

═══════════════════════════════════════════
EMPRESA
═══════════════════════════════════════════
Nombre: ${prospect.nombreEmpresa}
Rubro: ${prospect.rubro ?? 'Desconocido'}
Ubicación: ${[prospect.ciudad, prospect.pais].filter(Boolean).join(', ') || 'Desconocida'}
Website: ${url}
Problemas conocidos (Google Maps): ${(prospect.problemasEncontrados ?? []).join(', ') || 'ninguno'}

═══════════════════════════════════════════
HERRAMIENTAS
═══════════════════════════════════════════
Solo tienes disponible: WebFetch

NO usar WebSearch. La información que necesitas está en el sitio web.

═══════════════════════════════════════════
PASOS OBLIGATORIOS
═══════════════════════════════════════════

PASO 1 — Homepage
Usa WebFetch para obtener el HTML de: ${url}

Del HTML de la homepage, extrae:
- <title> (texto exacto)
- <meta name="description"> (existe o no)
- Cantidad de etiquetas <h1>
- <link rel="canonical"> (existe o no)
- <meta name="robots"> (valor si existe)
- <meta name="viewport"> (existe o no — indispensable para mobile)
- <meta property="og:*"> (Open Graph — existe o no)
- <script type="application/ld+json"> — schema markup (tipos encontrados)
- Tecnología: buscar "wp-content" o "wp-includes" → WordPress; "cdn.shopify.com" → Shopify; "woocommerce" → WooCommerce
- Ecommerce: palabras clave "carrito", "cart", "checkout", "comprar", "buy", "tienda", "shop", "producto", "product"
- Reservas: "reservar", "reservas", "turno", "turnos", "booking", "disponibilidad", "calendario", "appointment"
- Formularios: etiquetas <form>, campos input[type=email]
- Analytics: "gtag(", "ga(", "fbq(", "_fbq", "google-analytics"
- Meta Pixel: "facebook.com/tr", "fbq("
- Links sociales: instagram.com, facebook.com, linkedin.com, tiktok.com, twitter.com, youtube.com
- Google Business: "google.com/maps", "maps.app.goo.gl", "goo.gl/maps"
- Dirección/teléfono en el HTML (texto libre, footer area)
- Peso estimado del HTML (longitud del string en KB)
- Cantidad de imágenes <img>
- Secciones del menú de navegación <nav> o <header> (los textos de los links principales)

PASO 2 — Sitemap y robots (opcional, máximo 1 fetch adicional)
Si la homepage cargó bien, intenta WebFetch a ${url}/sitemap.xml o busca <link rel="sitemap"> en el HTML.
Si falla, no es bloqueante — marca hasSitemap: false.

PASO 3 — Página secundaria clave (opcional, máximo 1 fetch adicional)
Si detectaste que existe una página de "contacto", "tienda", "reservas" o "shop" en la navegación, haz fetch a esa URL.
Esto ayuda a confirmar formularios, ecommerce y reservas. Si no hay señales, omitir este paso.

═══════════════════════════════════════════
SEÑALES A DETECTAR
═══════════════════════════════════════════

Para cada señal, reporta solo lo que OBSERVASTE en el HTML. Nunca asumas.

TÉCNICO-SEO:
- hasMetaDescription: ¿existe <meta name="description" content="..."> con texto?
- h1Count: número exacto de <h1> en la página
- hasCanonical: ¿existe <link rel="canonical">?
- hasSchema: ¿existe <script type="application/ld+json">?
- schemaTypes: array con los "@type" encontrados en el schema (ej: ["LocalBusiness", "Organization"])
- hasSitemap: ¿encontraste sitemap?
- robotsBlocked: ¿el robots meta dice "noindex"?

PERFORMANCE / MOBILE:
- hasViewport: ¿existe <meta name="viewport" content="width=device-width">?
- estimatedPageWeightKb: tamaño aproximado del HTML en KB (longitud / 1024)
- imageCount: cantidad de <img> tags

SOCIAL / OG:
- hasOgTags: ¿existe al menos una <meta property="og:...">?
- hasSocialLinks: ¿hay links a redes sociales?
- socialLinksFound: array con dominios encontrados (ej: ["instagram.com", "facebook.com"])

TECNOLOGÍA:
- hasWordPress: boolean
- hasWooCommerce: boolean
- hasShopify: boolean
- technology: array de tecnologías detectadas (ej: ["WordPress", "WooCommerce"])

CONVERSIÓN / NEGOCIO:
- hasEcommerce: ¿señales de tienda online con checkout/carrito?
- hasOnlineBooking: ¿sistema de reservas o turnos online?
- hasContactForm: ¿formulario de contacto?
- hasLeadForm: ¿formulario de captación (email, nombre + envío)?
- hasAnalytics: ¿Google Analytics?
- hasMetaPixel: ¿Meta Pixel de Facebook?

LOCAL:
- hasAddress: ¿hay dirección física en el sitio?
- hasPhone: ¿hay número de teléfono?
- hasGoogleBusiness: ¿link a Google Maps/Business?

═══════════════════════════════════════════
SALIDA REQUERIDA
═══════════════════════════════════════════

Devuelve SOLO JSON válido. Sin texto antes ni después. Sin markdown.

{
  "accessible": true,
  "noWebsite": false,
  "httpsOk": true,
  "title": "<texto del title>",
  "hasMetaDescription": false,
  "h1Count": 2,
  "hasCanonical": false,
  "hasSchema": true,
  "schemaTypes": ["LocalBusiness"],
  "hasViewport": true,
  "hasOgTags": false,
  "hasSitemap": false,
  "technology": ["WordPress"],
  "hasWordPress": true,
  "hasWooCommerce": false,
  "hasShopify": false,
  "hasEcommerce": false,
  "hasOnlineBooking": false,
  "hasContactForm": true,
  "hasLeadForm": false,
  "hasAnalytics": false,
  "hasMetaPixel": false,
  "hasSocialLinks": true,
  "socialLinksFound": ["instagram.com", "facebook.com"],
  "hasGoogleBusiness": false,
  "hasAddress": true,
  "hasPhone": true,
  "estimatedPageWeightKb": 145,
  "hasImages": true,
  "imageCount": 18,
  "mainNavSections": ["Inicio", "Nosotros", "Vinos", "Contacto"],
  "robotsBlocked": false,
  "fetchError": null
}

Si el sitio no cargó (error de conexión, timeout, 404, 403): igual devuelve el JSON completo con accessible: false y fetchError con el motivo.`;
};
