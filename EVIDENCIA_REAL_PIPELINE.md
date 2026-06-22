# EVIDENCIA REAL DEL PIPELINE
## Datos históricos extraídos de PostgreSQL

**Fecha de extracción:** 2026-06-22  
**Fuente:** Base de datos PostgreSQL (tablas enrichment_results y prospects)  
**Casos:** 4 empresas reales analizadas  

---

# RESUMEN EJECUTIVO

Se extrajeron datos REALES de 4 análisis completados en el sistema:

| Empresa | Fecha Análisis | Score | Priority | Ticket | Confianza |
|---------|---|---|---|---|---|
| Casa Vigil Bodega | 2026-06-22 11:32:31 | 72 | HIGH | $10,000 | ALTA |
| Bodegas López | 2026-06-21 19:45:35 | 74 | HIGH | $5,500 | ALTA |
| Bodega Norton | 2026-06-22 00:25:26 | 72 | HIGH | $7,000 | ALTA |
| Bodega Pulenta Estate | 2026-06-21 23:57:41 | 68 | HIGH | $5,000 | ALTA |

---

# CASO 1: CASA VIGIL BODEGA

**Website:** https://universovigil.com/  
**Rubro:** Restaurante de alta cocina  
**Análisis:** 2026-06-22 11:32:31

## SIGNALS.JSON (RAW)

```json
{
  "title": "UNIVERSO VIGIL",
  "hasGA4": true,
  "hasGTM": true,
  "h1Count": 0,
  "httpsOk": true,
  "hasPhone": false,
  "hasReact": false,
  "hasHotjar": false,
  "hasMautic": false,
  "hasNextJs": false,
  "hasOgTags": false,
  "hasSchema": false,
  "noWebsite": false,
  "accessible": true,
  "fetchError": null,
  "hasAddress": false,
  "hasHubSpot": false,
  "hasShopify": false,
  "hasSitemap": false,
  "imageCount": 2,
  "technology": ["GTM"],
  "hasLeadForm": false,
  "hasViewport": true,
  "schemaTypes": [],
  "hasAnalytics": true,
  "hasCanonical": false,
  "hasEcommerce": true,
  "hasElementor": false,
  "hasMetaPixel": false,
  "hasWordPress": false,
  "robotsBlocked": false,
  "hasContactForm": false,
  "hasSocialLinks": true,
  "hasSocialLinksFound": ["instagram.com", "facebook.com", "twitter.com"],
  "hasWooCommerce": false,
  "mainNavSections": ["UNIVERSO VIGIL", "COMPRA ONLINE", "HACER UNA RESERVA"],
  "hasOnlineBooking": false,
  "hasGoogleBusiness": false,
  "hasMetaDescription": true,
  "hasMicrosoftClarity": false,
  "estimatedPageWeightKb": 10
}
```

## ANÁLISIS GENERADO (RAW OUTPUT)

**OPPORTUNITIES DETECTADAS:**

1. **Sistema de Reservas Online** (confidence: 88, impact: HIGH)
   - Evidence: Restaurante de alta cocina sin sistema digital de reservas
   - Evidence: hasOnlineBooking=false
   - Evidence: Nav menciona "HACER UNA RESERVA" pero sin booking real
   - Evidence: hasPhone=false — sin teléfono visible
   - Estimated Value: $3,200

2. **Automatización / CRM** (confidence: 78, impact: HIGH)
   - Evidence: hasEcommerce=true pero hasMetaPixel=false — sin retargeting
   - Evidence: hasLeadForm=false y hasContactForm=false — no capturan leads
   - Evidence: Sin CRM activo (hasHubSpot=false, hasMautic=false)
   - Estimated Value: $2,400

3. **SEO Técnico** (confidence: 72, impact: HIGH)
   - Evidence: h1Count=0 — sin H1 en homepage
   - Evidence: hasSchema=false — sin Schema markup
   - Evidence: hasSitemap=false
   - Estimated Value: $2,500

4. **UX/UI y CRO** (confidence: 72, impact: HIGH)
   - Evidence: Sin formulario de contacto
   - Evidence: hasMetaPixel=false — sin retargeting
   - Evidence: estimatedPageWeightKb=10 con solo 2 imágenes
   - Estimated Value: $1,800

## SCORES FINALES

- **opportunityScore:** 72
- **priority:** HIGH
- **confianza:** ALTA
- **estimatedTicket:** $10,000

## SUMMARY (TEXTO GENERADO POR SISTEMA)

> "Casa Vigil tiene una sección 'HACER UNA RESERVA' en su menú principal pero sin sistema real detrás: los visitantes llegan con intención de reservar y encuentran un proceso manual (probablemente un email o WhatsApp). En un restaurante de alta cocina con demanda internacional, cada fricción es una reserva perdida. Sin disponibilidad en tiempo real, sin confirmación automática y sin teléfono visible, el restaurante opera con un embudo roto: atrae interés pero no lo convierte."

---

# CASO 2: BODEGAS LÓPEZ

**Website:** http://www.bodegaslopez.com.ar/  
**Rubro:** Bodega  
**Análisis:** 2026-06-21 19:45:35

## SIGNALS.JSON

**Status:** NULL (no guardado en BD)

## ANÁLISIS GENERADO (RAW OUTPUT)

**OPPORTUNITIES DETECTADAS:**

1. **Ecommerce (tienda online, WooCommerce)** (confidence: 97, impact: HIGH)
   - Evidence: Catálogo de vinos sin precios ni botón de compra
   - Evidence: Vinos se venden en terceros (MercadoLibre, espaciovino.com.ar) no en su sitio
   - Evidence: Infraestructura WooCommerce existe en experiencias.bodegaslopez.com.ar
   - Estimated Value: IMPLÍCITO (no especificado)

2. **SEO Técnico** (confidence: 92, impact: HIGH)
   - Evidence: Meta description completamente ausente
   - Evidence: Open Graph tags no detectados
   - Evidence: Sin Schema markup (LocalBusiness, Product, Winery)
   - Evidence: Múltiples H1 en la misma página (error grave)
   - Evidence: Title genérico sin keywords de intención
   - Evidence: Rev Slider en homepage degrada Core Web Vitals

3. **Performance Web** (confidence: 82, impact: MEDIUM)
   - Evidence: Rev Slider genera JavaScript y CSS bloqueantes
   - Evidence: WordPress con múltiples plugins pesados sin caché
   - Evidence: Sin CDN detectado
   - Estimated Value: IMPLÍCITO

4. **SEO de Contenidos** (confidence: 76, impact: MEDIUM)
   - Evidence: 1.401 posts en Instagram no reutilizados como contenido web
   - Evidence: Sin hreflang tags para multilenguaje (ES/EN/PT)

5. **UX/UI / Landing Pages** (confidence: 72, impact: MEDIUM)
   - Evidence: Journey fragmentado entre bodegaslopez.com.ar y experiencias.bodegaslopez.com.ar
   - Evidence: Páginas de producto sin precios ni CTA
   - Evidence: Botón de reserva lleva a WhatsApp

6. **Automatización / CRM / Workflows** (confidence: 63, impact: MEDIUM)
   - Evidence: Mautic instalado pero sin workflows de nurturing
   - Evidence: Múltiples emails por departamento sin CRM centralizado

## SCORES FINALES

- **opportunityScore:** 74
- **priority:** HIGH
- **confianza:** ALTA
- **estimatedTicket:** $5,500

## SUMMARY

> "Bodega centenaria con marca sólida y 68K seguidores en Instagram, pero sin canal de venta directa de vinos online y con SEO técnico deficiente que le impide capturar demanda de enoturismo y D2C."

---

# CASO 3: BODEGA NORTON

**Website:** http://www.norton.com.ar/  
**Rubro:** Bodega  
**Análisis:** 2026-06-22 00:25:26

## SIGNALS.JSON (RAW)

```json
{
  "title": "Bodega Norton - Norton",
  "hasGA4": true,
  "hasGTM": true,
  "h1Count": 2,
  "httpsOk": true,
  "hasPhone": false,
  "hasReact": false,
  "hasHotjar": false,
  "hasMautic": false,
  "hasNextJs": false,
  "hasOgTags": true,
  "hasSchema": false,
  "noWebsite": false,
  "accessible": true,
  "fetchError": null,
  "hasAddress": false,
  "hasHubSpot": false,
  "hasShopify": false,
  "hasSitemap": false,
  "imageCount": 14,
  "technology": ["WordPress", "WooCommerce", "GTM"],
  "hasLeadForm": false,
  "hasViewport": true,
  "schemaTypes": [],
  "hasAnalytics": true,
  "hasCanonical": true,
  "hasEcommerce": true,
  "hasElementor": false,
  "hasMetaPixel": false,
  "hasWordPress": true,
  "robotsBlocked": false,
  "hasContactForm": true,
  "hasSocialLinks": true,
  "hasSocialLinksFound": ["instagram.com", "facebook.com", "twitter.com", "youtube.com"],
  "hasWooCommerce": true,
  "mainNavSections": ["NOSOTROS", "NUESTROS VINOS", "SPIRITS & IMPORTADOS"],
  "hasOnlineBooking": false,
  "hasGoogleBusiness": false,
  "hasMetaDescription": false,
  "hasMicrosoftClarity": false,
  "estimatedPageWeightKb": 372
}
```

## ANÁLISIS GENERADO (RAW OUTPUT)

**OPPORTUNITIES DETECTADAS:**

1. **Sistema de Reservas Online** (confidence: 90, impact: HIGH)
   - Evidence: hasOnlineBooking=false — sin sistema digital de reservas
   - Evidence: Bodega en Perdriel (zona turística) — demanda sostenida de visitas
   - Evidence: hasWooCommerce=true — infraestructura activa sin módulo de reservas
   - Estimated Value: $2,000

2. **Automatización / CRM** (confidence: 82, impact: HIGH)
   - Evidence: hasEcommerce=true pero hasMetaPixel=false — sin retargeting
   - Evidence: hasLeadForm=false — no captura leads
   - Evidence: Sin HubSpot, Mautic ni automatización
   - Estimated Value: $2,000

3. **SEO Técnico** (confidence: 75, impact: MEDIUM)
   - Evidence: hasMetaDescription=false
   - Evidence: hasSchema=false
   - Evidence: hasSitemap=false
   - Evidence: h1Count=2 — múltiples H1
   - Estimated Value: $1,400

4. **UX/UI y CRO** (confidence: 65, impact: MEDIUM)
   - Evidence: hasLeadForm=false
   - Evidence: hasPhone=false
   - Evidence: mainNavSections solo muestra catálogo
   - Estimated Value: $1,500

## SCORES FINALES

- **opportunityScore:** 72
- **priority:** HIGH
- **confianza:** ALTA
- **estimatedTicket:** $7,000

## SUMMARY

> "Bodega Norton ya vende online y está en redes, pero pierde reservas de enoturismo por no tener sistema digital y deja ir compradores que no reciben ningún seguimiento post-compra — dos brechas que representan ingresos perdidos hoy."

---

# CASO 4: BODEGA PULENTA ESTATE

**Website:** http://www.pulentaestate.com/  
**Rubro:** Bodega  
**Análisis:** 2026-06-21 23:57:41

## SIGNALS.JSON (RAW)

```json
{
  "title": "Pulenta Estate | Mendoza - Argentina",
  "hasGA4": true,
  "hasGTM": true,
  "h1Count": 2,
  "httpsOk": true,
  "hasPhone": true,
  "hasReact": false,
  "hasHotjar": false,
  "hasMautic": false,
  "hasNextJs": false,
  "hasOgTags": true,
  "hasSchema": false,
  "noWebsite": false,
  "accessible": true,
  "fetchError": null,
  "hasAddress": false,
  "hasHubSpot": false,
  "hasShopify": false,
  "hasSitemap": false,
  "imageCount": 21,
  "technology": ["GTM"],
  "hasLeadForm": false,
  "hasViewport": true,
  "schemaTypes": [],
  "hasAnalytics": true,
  "hasCanonical": false,
  "hasEcommerce": true,
  "hasElementor": false,
  "hasMetaPixel": true,
  "hasWordPress": false,
  "robotsBlocked": false,
  "hasContactForm": true,
  "hasSocialLinks": true,
  "hasSocialLinksFound": ["instagram.com", "facebook.com", "twitter.com"],
  "hasWooCommerce": false,
  "mainNavSections": ["ESP", "ENG", "POR", "TIENDA", "VINOS", "TURISMO", "QUIÉNES SOMOS", "VIÑEDOS", "SUSTENTABILIDAD", "LA FLOR"],
  "hasOnlineBooking": true,
  "hasGoogleBusiness": false,
  "hasMetaDescription": false,
  "hasMicrosoftClarity": false,
  "estimatedPageWeightKb": 25
}
```

## ANÁLISIS GENERADO (RAW OUTPUT)

**OPPORTUNITIES DETECTADAS:**

1. **SEO Local / GBP** (confidence: 90, impact: HIGH)
   - Evidence: hasGoogleBusiness=false — sin ficha en Google Maps
   - Evidence: Bodega con turismo activo (sección TURISMO en nav)
   - Evidence: Ubicación Luján de Cuyo: mercado competitivo de wine tourism
   - Estimated Value: $1,000

2. **Community Management** (confidence: 75, impact: HIGH)
   - Evidence: Sin presencia detectada en redes sociales
   - Evidence: Sitio enlaza a IG/FB/Twitter pero sin actividad
   - Evidence: Wine tourism = Instagram es canal principal de discovery
   - Estimated Value: $800

3. **SEO de Contenidos** (confidence: 65, impact: MEDIUM)
   - Evidence: Sitio trilingual (ES/ENG/POR) sin meta descriptions
   - Evidence: hasSitemap=false
   - Evidence: Alto volumen de búsquedas internacionales (wine tours)
   - Estimated Value: $2,000

4. **SEO Técnico** (confidence: 60, impact: MEDIUM)
   - Evidence: hasMetaDescription=false
   - Evidence: hasCanonical=false
   - Evidence: hasSchema=false
   - Evidence: hasSitemap=false
   - Estimated Value: $1,400

## SCORES FINALES

- **opportunityScore:** 68
- **priority:** HIGH
- **confianza:** ALTA
- **estimatedTicket:** $5,000

## SUMMARY

> "Pulenta Estate no aparece en Google Maps mientras miles de turistas buscan experiencias vitivinícolas en Mendoza — y su presencia en redes no está convirtiendo en nuevas reservas ni ventas de vinos."

---

# ANÁLISIS COMPARATIVO

## Signals CORRECTOS vs INCORRECTOS

| Signal | Casa Vigil | Bodegas López | Norton | Pulenta | ¿Parece correcto? |
|--------|-----------|---|---|---|---|
| hasSocialLinks | **true** | null | true | **true** | ✓ VERIFICADO (Instagram visible) |
| hasPhone | **false** | null | **false** | true | ❌ Casa Vigil tiene contacto visible |
| hasOnlineBooking | **false** | null | **false** | true | ❌ Casa Vigil nav dice "HACER UNA RESERVA" |
| hasEcommerce | true | null | true | true | ✓ Todos tienen secciones de compra |
| hasMetaPixel | false | null | **false** | true | ⚠️ Norton y Casa sin Meta Pixel |
| h1Count | **0** | null | **2** | **2** | ❌ Casa Vigil debería tener H1s |

## Scores vs Realidad

**Todos obtuvieron HIGH priority:** ✓ CORRECTO
- Todos son negocios con oportunidades reales
- Ticket promedio: $6,500 (rango: $5,000 - $10,000)

**Confidence ALTA en todos:** ✓ APARENTEMENTE CORRECTO
- Los análisis contienen evidencia específica y detallada
- Opportunities están respaldadas por signals

---

# CONCLUSIÓN

**Los datos REALES muestran:**

1. ✅ El sistema FUNCIONA y genera análisis detallados
2. ✅ Las opportunities están respaldadas por evidence específica
3. ❌ Algunos signals son INCORRECTOS (hasPhone=false para Casa Vigil)
4. ⚠️ El sistema marca como ALTA confianza casos donde hay errores evidentes

**Problema confirmado:** Signals incorrectos → Análisis detallado pero potencialmente basado en premisas falsas

