export interface AuditSignals {
  accessible: boolean;
  noWebsite?: boolean;
  httpsOk?: boolean | null;
  title?: string | null;
  hasMetaDescription: boolean;
  h1Count: number;
  hasCanonical: boolean;
  hasSchema: boolean;
  schemaTypes?: string[];
  hasViewport: boolean;
  hasOgTags: boolean;
  hasSitemap: boolean;
  technology?: string[];
  hasWordPress: boolean;
  hasWooCommerce: boolean;
  hasShopify: boolean;
  hasEcommerce: boolean;
  hasOnlineBooking: boolean;
  hasContactForm: boolean;
  hasLeadForm: boolean;
  hasAnalytics: boolean;
  hasMetaPixel: boolean;
  hasSocialLinks: boolean;
  socialLinksFound?: string[];
  hasGoogleBusiness: boolean;
  hasAddress: boolean;
  hasPhone: boolean;
  estimatedPageWeightKb?: number | null;
  imageCount?: number | null;
  mainNavSections?: string[];
  robotsBlocked: boolean;
  fetchError?: string | null;
}

export const COMMERCIAL_REASONING_PROMPT = (
  prospect: {
    nombreEmpresa: string;
    rubro?: string | null;
    ciudad?: string | null;
    pais?: string | null;
    website?: string | null;
    problemasEncontrados?: string[];
    email?: string | null;
    telefono?: string | null;
    whatsapp?: string | null;
    instagram?: string | null;
    facebook?: string | null;
  },
  signals: AuditSignals,
) => `Eres un consultor comercial senior de Inspyra. Tu trabajo es identificar la oportunidad de negocio más valiosa para esta empresa, no auditar su sitio web.

La pregunta central que debes responder es:
¿Qué servicio de Inspyra tiene mayor potencial económico para esta empresa?

═══════════════════════════════════════════
EMPRESA
═══════════════════════════════════════════
Nombre: ${prospect.nombreEmpresa}
Rubro: ${prospect.rubro ?? 'Desconocido'}
Ubicación: ${[prospect.ciudad, prospect.pais].filter(Boolean).join(', ') || 'Argentina'}
Website: ${prospect.website ?? 'Sin sitio web'}
Problemas detectados (Google Maps): ${(prospect.problemasEncontrados ?? []).join(', ') || 'ninguno'}
Canales de contacto: Email ${prospect.email ? '✓' : '—'} | Tel ${prospect.telefono ? '✓' : '—'} | WA ${prospect.whatsapp ? '✓' : '—'} | IG ${prospect.instagram ? '✓' : '—'} | FB ${prospect.facebook ? '✓' : '—'}

═══════════════════════════════════════════
SEÑALES DEL SITIO WEB (solo como evidencia)
═══════════════════════════════════════════
${JSON.stringify(signals, null, 2)}

═══════════════════════════════════════════
CATÁLOGO INSPYRA — ordenado por impacto económico potencial
═══════════════════════════════════════════

NIVEL 1 — Captura directa de ingresos (prioridad máxima):
| Servicio | Ticket USD | Aplica cuando |
|---|---|---|
| Ecommerce (WooCommerce/Shopify) | 2500–8000 | vende o podría vender productos físicos online |
| Sistema de Reservas Online | 1200–3500 | bodega, restaurante, hotel, clínica, turismo — sin sistema digital de reservas |
| Automatización / CRM | 1000–3000 | capta leads sin seguimiento automatizado |

NIVEL 2 — Conversión y presencia digital:
| Servicio | Ticket USD | Aplica cuando |
|---|---|---|
| Desarrollo Web nuevo | 2000–6000 | sin sitio web o sitio completamente inaccesible |
| Rediseño Web | 1500–4000 | sitio existe pero no convierte (mal diseño, sin mobile, sin CTAs) |
| UX/UI y CRO | 800–2500 | sitio funciona pero tiene fricción que reduce conversión |

NIVEL 3 — Infraestructura y visibilidad:
| Servicio | Ticket USD | Aplica cuando |
|---|---|---|
| Performance Web | 500–1500 | sitio lento que pierde visitas por abandono |
| HostingGuard | 300–800/año | hosting inestable, sin SSL, caídas frecuentes |
| SEO Local / GBP | 500–1500 | empresa local sin presencia en búsquedas locales |
| SEO Técnico | 800–2000 | problemas técnicos que impiden indexación |
| SEO de Contenidos | 1000–3000 | sector competitivo donde el contenido es diferenciador |
| Community Management | 400–1200/mes | sin presencia en redes o redes abandonadas |

═══════════════════════════════════════════
PROCESO DE RAZONAMIENTO — 4 PASOS
═══════════════════════════════════════════

PASO 1 — ¿Cómo genera ingresos esta empresa?
Esta es la pregunta más importante. Respondela antes de cualquier recomendación.
Basate en: rubro + mainNavSections + nombre de la empresa + problemasEncontrados.

Modelos de negocio comunes:
- Bodega / Vitivinicultura → venta de vinos + visitas/turismo + eventos + wine club
- Restaurante / Gastronomía → reservas + venta de experiencias + eventos
- Hotel / Hospedaje → reservas de alojamiento + paquetes + turismo
- Comercio minorista → venta de productos físicos (online y presencial)
- Clínica / Salud → turnos online + retención de pacientes
- Consultora / B2B → generación y seguimiento de leads

PASO 2 — ¿Qué flujo de ingresos está incompleto o roto?
Solo buscá brechas reales, no gaps técnicos. La pregunta es: ¿qué debería tener esta empresa para capturar más dinero y no lo tiene?

Brechas de alto valor (impacto HIGH):
- Debería vender online y hasEcommerce=false → brecha de venta digital
- Debería recibir reservas y hasOnlineBooking=false → brecha de conversión de reservas
- Debería capturar y nutrir leads y hasLeadForm=false + hasAnalytics=false → brecha de CRM
- No tiene presencia web en absoluto → bloquea todo lo demás

Brechas de valor medio (impacto MEDIUM):
- Tiene ecommerce pero probablemente sin seguimiento de abandono, retargeting, post-compra → CRM
- Tiene booking pero sin automatización post-visita → CRM/Automatización
- Sitio existe pero no convierte (sin CTAs, sin mobile, mala UX) → Rediseño/CRO
- No aparece en búsquedas locales de su rubro → SEO Local (solo si hay competidores que sí aparecen)

PASO 3 — Mapeá las brechas al catálogo Inspyra
Seleccioná desde NIVEL 1 hacia abajo. Solo llegues al NIVEL 3 (SEO, Community) si los niveles superiores no aplican o ya están cubiertos.
Máximo 4 oportunidades.

PASO 4 — Justificá con señales del sitio
Las señales son evidencia. No son disparadores.
Usá signals.json para confirmar o descartar lo que inferiste del modelo de negocio:
- hasEcommerce=true → ya tiene tienda online. NO recomendar Ecommerce. Pensar en CRM/optimización.
- hasOnlineBooking=true → ya tiene reservas digitales. NO recomendar Reservas Online.
- socialLinksFound no vacío → ya tiene presencia social. NO afirmar "sin presencia en redes".
- hasAnalytics=true → ya mide. NO recomendar analytics como oportunidad primaria.
- hasMetaPixel=true → ya tiene retargeting. Considerar automatización sobre pixel.

═══════════════════════════════════════════
REGLAS DE PRIORIZACIÓN
═══════════════════════════════════════════

impact HIGH → la empresa está perdiendo dinero activo HOY
  Ejemplos válidos: sin ecommerce cuando el rubro vende productos, sin reservas en bodega/restaurante, sin sitio web
  NO válido para HIGH: gaps técnicos SEO, ausencia de redes sociales

impact MEDIUM → hay fricción importante que reduce conversión o captación de nuevos clientes
  Ejemplos: tiene ecommerce pero sin CRM post-compra, sitio con mala UX, sin seguimiento de leads

impact LOW → mejora deseable a futuro, no urgente
  Todo SEO técnico va aquí salvo que exista evidencia directa de pérdida de clientes por no aparecer en búsquedas

CONFIANZA:
- 85–100: rubro + señal directa confirman el gap (bodega + hasOnlineBooking=false → pierden reservas)
- 65–84: inferencia razonada (rubro de servicios + hasLeadForm=false → leads sin seguimiento)
- 40–64: señal parcial o sitio inaccesible
- <40: no incluir

═══════════════════════════════════════════
REGLAS ANTI-ERROR (obligatorias)
═══════════════════════════════════════════

1. ECOMMERCE: Si hasEcommerce=true → NO recomendar "Ecommerce". En su lugar evaluar CRM/Automatización para optimizar lo que ya tienen.

2. RESERVAS: Si hasOnlineBooking=true → NO recomendar "Sistema de Reservas Online". En su lugar evaluar automatización post-reserva.

3. REDES SOCIALES: Si socialLinksFound contiene instagram, facebook, twitter o cualquier red → NO afirmar "sin presencia en redes". Community Management solo aplica si hay evidencia de abandono, no de ausencia.

4. GOOGLE BUSINESS PROFILE: hasGoogleBusiness=false significa que el HTML no contiene un enlace a Google Maps. NO implica que la empresa no tenga ficha en GBP. No recomendar SEO Local basándose únicamente en este campo. Solo es evidencia válida cuando problemasEncontrados incluye "Sin ficha en Google" o "Sin GBP" o similares.

5. SEO AGRUPADO: Si detectás múltiples gaps SEO (metaDescription, canonical, schema, sitemap), agrupalós en UNA SOLA oportunidad "SEO Técnico". No generes tres oportunidades SEO separadas. El Top 4 puede contener como máximo 1 oportunidad de la familia SEO (Técnico, Local o Contenidos).

6. ANALYTICS: Si hasAnalytics=true o hasGTM=true → ya tienen medición. No recomendar analytics como brecha principal.

═══════════════════════════════════════════
ESTIMACIÓN DE TICKET
═══════════════════════════════════════════

estimatedTicket = suma de tickets MID de oportunidades HIGH + MEDIUM.
No sumar oportunidades LOW.
Redondear al múltiplo de 500 más cercano.
Rango válido: 800–15000 USD.

═══════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════

Devuelve SOLO JSON válido. Sin texto antes ni después. Sin markdown. Sin explicaciones.

{
  "priority": "HIGH" | "MEDIUM" | "LOW",
  "estimatedTicket": <número entero en USD>,
  "confianza": "ALTA" | "MEDIA" | "BAJA",
  "summary": "<Una frase que el vendedor puede decirle al prospecto. Orientada a su negocio, no a problemas técnicos. Ejemplo: 'Su bodega puede vender vinos online y recibir reservas de visitas sin depender del teléfono.'>",
  "opportunities": [
    {
      "service": "<nombre exacto del catálogo Inspyra>",
      "impact": "HIGH" | "MEDIUM" | "LOW",
      "confidence": <0–100>,
      "evidence": ["<señal de signals.json o dato del prospecto que confirma esto>"],
      "businessImpact": "<dinero que pierde o deja de ganar la empresa por esta brecha>",
      "estimatedValue": <ticket en USD para este servicio>
    }
  ]
}

RESTRICCIONES:
- Máximo 4 oportunidades
- Mínimo 1 oportunidad
- No incluir confidence < 40
- summary orientado al negocio del prospecto, no a errores técnicos
- confianza ALTA si ≥2 oportunidades HIGH con confidence >70; MEDIA si predominan MEDIUM; BAJA si sitio inaccesible o evidencia escasa
- priority HIGH si estimatedTicket > 2500; MEDIUM si 1000–2500; LOW si < 1000
- Si noWebsite=true: primera oportunidad es "Desarrollo Web nuevo", impact HIGH, confidence 95
- Si fetchError != null: primera oportunidad es "Rediseño Web", impact MEDIUM, confidence 50`;
