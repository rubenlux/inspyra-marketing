# SERVICES CATALOG — INSPYRA

**Versión:** 1.0  
**Fecha:** 2026-06-22  
**Estado:** Borrador para aprobación  
**Fuente de verdad:** Este documento es el único origen de verdad para las reglas de detección de oportunidades.

---

## ÍNDICE

1. [ECOMMERCE](#ecommerce)
2. [ONLINE BOOKING SYSTEM](#online-booking-system)
3. [CRM + AUTOMATIZACIÓN](#crm--automatización)
4. [GOOGLE BUSINESS PROFILE (GBP)](#google-business-profile-gbp)
5. [SEO LOCAL](#seo-local)
6. [SEO TÉCNICO](#seo-técnico)
7. [SEO SCHEMA](#seo-schema)
8. [SITIO WEB NUEVO](#sitio-web-nuevo)
9. [REDISEÑO WEB](#rediseño-web)
10. [LANDING PAGES DE CONVERSIÓN](#landing-pages-de-conversión)
11. [GESTIÓN DE REDES SOCIALES](#gestión-de-redes-sociales)
12. [SEGURIDAD WEB (HOSTINGGUARD)](#seguridad-web-hostingguard)

---

## ECOMMERCE

### Identificador
`ecommerce`

### Categoría
Ecommerce

### Problema que resuelve
No vender productos online. Perder ingresos por no tener canal de venta directo.

### Ticket estimado
USD 3,000 - 8,000

### Prioridad comercial
🔴 CRÍTICA

### Industrias objetivo
- Wine/Beverages (bodegas)
- Food Service (restaurantes)
- Retail (tiendas, boutiques)
- Tourism (agencias, alojamientos)

### Señales requeridas
- `hasEcommerce = false`
- Industria que típicamente vende productos

### Señales opcionales
- `hasMetaPixel = false` (si tuviera ecommerce, no tendría retargeting)
- `mainNav` contiene "TIENDA", "PRODUCTOS", "VENTA"

### Evidencia que debemos mostrar al vendedor
1. **Competencia vende online** — 80% de bodegas de la región tienen ecommerce
2. **Formato de venta** — Qué productos pueden venderse (botellas de vino, gift boxes, experiencias)
3. **Caso de éxito** — Bodega similar que implementó y aumentó ventas 35%
4. **Inversión inicial** — Plataforma + primeros 3 meses de operación

### Reglas de activación
```
IF
  hasEcommerce = false
AND
  industry IN (
    'Wine/Beverages',
    'Food Service',
    'Retail',
    'Tourism'
  )

THEN
  opportunity = ECOMMERCE
  priority = CRITICAL
  matchType = EXACT_MATCH
  businessImpact = CRITICAL
```

### Reglas de exclusión
- ❌ Si es B2B puro (vende solo a otras empresas, no a consumidores)
- ❌ Si ya tiene múltiples canales de venta online consolidados
- ❌ Si es una PyME muy pequeña sin presencia digital

### Casos reales donde aplicaría
- **Bodegas López** — Bodega exportadora que vende en MercadoLibre, no en su sitio
- **Norton** — Bodega con WooCommerce infraestructura lista pero sin ecommerce activo

---

## ONLINE BOOKING SYSTEM

### Identificador
`online-booking` (no está en INSPYRA_SERVICE_IDS actual — **PENDIENTE AGREGAR**)

### Categoría
Conversión / Reservas

### Problema que resuelve
Las reservas se gestionan manualmente (email, WhatsApp, teléfono). Se pierde capacidad de conversión por fricción.

### Ticket estimado
USD 1,500 - 3,500

### Prioridad comercial
🔴 CRÍTICA

### Industrias objetivo
- Wine/Beverages (tours de bodega, enoturismo)
- Food Service (restaurantes, catering)
- Tourism (hoteles, alojamientos)
- Health & Wellness (salones de belleza, spas)

### Señales requeridas
- `hasOnlineBooking = false`
- Nav contiene "RESERVA", "RESERVAS", "BOOKING", "TOURS", "VISITAS"

### Señales opcionales
- `hasPhone = false` (agravante: ni teléfono visible)
- `hasContactForm = false` (no hay forma de contactar)
- `mainNav menciona reservas pero sin mecanismo claro`

### Evidencia que debemos mostrar al vendedor
1. **Fricción en conversión** — "HACER UNA RESERVA" en nav pero proceso manual
2. **Pérdida de ventas** — Visitantes que buscan horarios y disponibilidad no encuentran
3. **Competencia tiene sistema** — Bodegas/restaurantes cercanos con booking automatizado
4. **ROI** — Reducción de emails/llamadas perdidas + aumento de confirmadas

### Reglas de activación
```
IF
  hasOnlineBooking = false
AND
  industry IN (
    'Wine/Beverages',
    'Food Service',
    'Tourism',
    'Health & Wellness'
  )
AND
  (mainNav contiene 'reserva' OR nav contiene 'tour' OR tourism=true)

THEN
  opportunity = ONLINE_BOOKING_SYSTEM
  priority = CRITICAL
  matchType = EXACT_MATCH
  businessImpact = CRITICAL
```

### Reglas de exclusión
- ❌ Si es servicio sin reserva previas (food truck, venta callejera)
- ❌ Si toda la operación es walk-in sin reservas

### Casos reales donde aplicaría
- **Casa Vigil** — Restaurante de alta cocina con "HACER UNA RESERVA" en nav pero sin sistema
- **Norton** — Bodega con tours pero sin sistema de reservas digitales

---

## CRM + AUTOMATIZACIÓN

### Identificador
`crm-automation` (no está en INSPYRA_SERVICE_IDS actual — **PENDIENTE AGREGAR**)

### Categoría
Conversión / Retención

### Problema que resuelve
Vende pero no tiene seguimiento post-venta. Clientes olvidados, sin retargeting, sin automatización.

### Ticket estimado
USD 1,500 - 4,000

### Prioridad comercial
🔴 CRÍTICA

### Industrias objetivo
- Wine/Beverages (ecommerce, tours)
- Food Service (catering, delivery)
- Retail (cualquiera con ecommerce)
- Tourism (reservas, experiencias)

### Señales requeridas
- `hasEcommerce = true`
- `hasMetaPixel = false`

### Señales opcionales
- `hasLeadForm = false` (no captura leads)
- `hasContactForm = false` (no sigue up)
- `hasHubSpot = false` o `hasMautic = false`

### Evidencia que debemos mostrar al vendedor
1. **Pérdida post-compra** — Vendió pero visitante no vuelve
2. **Retargeting perdido** — Sin Meta Pixel, no puede recuperar carrito abandonado
3. **Nuestra función** — Implementar pixel + CRM básico + 2-3 flujos de automatización
4. **Impacto** — +15-25% en repeat purchases

### Reglas de activación
```
IF
  hasEcommerce = true
AND
  (
    hasMetaPixel = false
    OR hasLeadForm = false
    OR (hasHubSpot = false AND hasMautic = false)
  )

THEN
  opportunity = CRM_AUTOMATION
  priority = CRITICAL
  matchType = EXACT_MATCH or STRONG_MATCH
  businessImpact = HIGH
```

### Reglas de exclusión
- ❌ Si ya tiene CRM profesional instalado
- ❌ Si es modelo de negocio one-time purchase (sin repeat)

### Casos reales donde aplicaría
- **Casa Vigil** — Ecommerce pero sin Meta Pixel ni lead capture
- **Norton** — WooCommerce sin Meta Pixel

---

## GOOGLE BUSINESS PROFILE (GBP)

### Identificador
`gbp-management`

### Categoría
SEO Local / Google Business

### Problema que resuelve
No aparece en Google Maps. Clientes que buscan tu rubro por zona van a competencia con GBP activo.

### Ticket estimado
USD 800 - 1,500

### Prioridad comercial
🔴 CRÍTICA

### Industrias objetivo
- Wine/Beverages (con enoturismo)
- Food Service (restaurantes)
- Tourism (hoteles, guías)
- Health & Wellness (salones, spas)
- Retail (tiendas, boutiques)
- Real Estate (inmobiliarias)

### Señales requeridas
- `hasGoogleBusiness = false`
- Industria que depende de búsquedas locales

### Señales opcionales
- `tourism = true` (agravante: debería estar en Maps pero no está)
- `mainNav contiene "TURISMO"` o `"VISITANOS"`

### Evidencia que debemos mostrar al vendedor
1. **Brecha vs competencia** — Competencia aparece en Maps, vos no
2. **Volumen de búsquedas** — "Bodegas en Maipú" → 1,200 búsquedas/mes
3. **Impacto** — 40-60% de clientes nuevos buscan en Maps antes de visitar
4. **Nuestra función** — Crear/optimizar perfil + gestión de reseñas

### Reglas de activación
```
IF
  hasGoogleBusiness = false
AND
  (
    industry IN ('Wine/Beverages', 'Food Service', 'Tourism', 'Health & Wellness')
    OR tourism = true
  )

THEN
  opportunity = GBP_MANAGEMENT
  priority = CRITICAL
  matchType = EXACT_MATCH
  businessImpact = HIGH
```

### Reglas de exclusión
- ❌ Si es empresa B2B sin ubicación física (consultora remota)
- ❌ Si ya tiene GBP activo con reseñas regulares

### Casos reales donde aplicaría
- **Pulenta Estate** — Bodega con turismo activo pero sin GBP
- **Cualquier bodega/restaurante** sin presencia en Maps

---

## SEO LOCAL

### Identificador
`seo-local`

### Categoría
SEO / Posicionamiento

### Problema que resuelve
No aparece en resultados de búsqueda para tu rubro + ciudad.

### Ticket estimado
USD 1,200 - 2,500

### Prioridad comercial
🟠 ALTA

### Industrias objetivo
- Wine/Beverages
- Food Service
- Tourism
- Health & Wellness
- Real Estate

### Señales requeridas
- `industry IN (Wine/Beverages, Food Service, Tourism, Health & Wellness)`
- `hasWebsite = true`
- `(hasSchema = false OR hasSitemap = false OR hasMetaDescription = false)` (SEO técnico deficiente)

### Señales opcionales
- `tourism = true`
- `h1Count = 0` (sin H1s)

### Evidencia que debemos mostrar al vendedor
1. **Búsquedas locales** — "Bodega en Maipú" generan 2,500 búsquedas/mes
2. **Posición actual** — Estás en página 3, competencia en página 1
3. **Beneficiario** — Turistas + compradores locales que buscan online
4. **Inversión** — 3 meses de optimización + contenido local

### Reglas de activación
```
IF
  industry IN ('Wine/Beverages', 'Food Service', 'Tourism')
AND
  hasWebsite = true
AND
  (
    hasSchema = false
    OR hasSitemap = false
    OR h1Count = 0
  )

THEN
  opportunity = SEO_LOCAL
  priority = HIGH
  matchType = EXACT_MATCH or STRONG_MATCH
  businessImpact = HIGH
```

### Reglas de exclusión
- ❌ Si no tiene website
- ❌ Si es empresa nacional sin focus geográfico

### Casos reales donde aplicaría
- **Cualquier bodega/restaurante** con sitio pero sin SEO local implementado

---

## SEO TÉCNICO

### Identificador
`seo-technical`

### Categoría
SEO / Técnico

### Problema que resuelve
Sitio tiene problemas técnicos que impiden que Google lo indexe y lo rankee correctamente.

### Ticket estimado
USD 1,000 - 2,500

### Prioridad comercial
🟠 ALTA

### Industrias objetivo
- Todas las que venden

### Señales requeridas
- `hasWebsite = true`
- Mínimo 2 de:
  - `h1Count = 0`
  - `hasMetaDescription = false`
  - `hasSitemap = false`
  - `hasCanonical = false`

### Señales opcionales
- `hasSchema = false`
- `estimatedPageWeightKb > 500` (sitio muy pesado)

### Evidencia que debemos mostrar al vendedor
1. **Auditoría técnica** — Lista de 5-10 problemas encontrados
2. **Impacto en ranking** — "Sin meta descriptions, Google no sabe de qué habla tu página"
3. **Competencia** — Competencia ya tiene SEO técnico hecho
4. **Métrica** — Después: +200% en impresiones, +50% en clicks

### Reglas de activación
```
IF
  hasWebsite = true
AND
  (
    (h1Count = 0 OR h1Count > 2)
    OR hasMetaDescription = false
    OR hasSitemap = false
    OR hasCanonical = false
  )

THEN
  opportunity = SEO_TECHNICAL
  priority = HIGH
  matchType = STRONG_MATCH
  businessImpact = MEDIUM or HIGH
```

### Reglas de exclusión
- ❌ Si no tiene website

### Casos reales donde aplicaría
- **Casa Vigil** — h1Count=0, hasSchema=false, hasSitemap=false
- **Norton** — hasMetaDescription=false, hasSchema=false
- **Pulenta** — hasMetaDescription=false, hasCanonical=false

---

## SEO SCHEMA

### Identificador
`seo-schema`

### Categoría
SEO / Técnico

### Problema que resuelve
Sitio tiene contenido pero Google no entiende la estructura. No aparece en rich results.

### Ticket estimado
USD 500 - 1,200

### Prioridad comercial
🟡 MEDIA

### Industrias objetivo
- Wine/Beverages (Product schema, LocalBusiness)
- Food Service (Organization, LocalBusiness)
- Tourism (Event, LocalBusiness)
- Ecommerce (Product, Offer)

### Señales requeridas
- `hasWebsite = true`
- `hasSchema = false`

### Señales opcionales
- `hasEcommerce = true` (urgente tener Product schema)
- `tourism = true` (importante para Event/LocalBusiness)

### Evidencia que debemos mostrar al vendedor
1. **Rich results** — Aparecer con estrellas, precios, horarios en búsqueda
2. **Google Search Console** — "Tu sitio no tiene structured data"
3. **Competencia** — Competencia aparece con información expandida
4. **Implementación** — 2-3 días de trabajo

### Reglas de activación
```
IF
  hasSchema = false
AND
  (
    hasEcommerce = true
    OR tourism = true
    OR industry IN ('Wine/Beverages', 'Food Service')
  )

THEN
  opportunity = SEO_SCHEMA
  priority = MEDIUM
  matchType = STRONG_MATCH
  businessImpact = MEDIUM
```

### Reglas de exclusión
- ❌ Si no tiene website
- ❌ Si es sitio estático sin contenido dinámico

### Casos reales donde aplicaría
- **Todos los casos** — Ninguna bodega/restaurante tiene schema completo

---

## SITIO WEB NUEVO

### Identificador
`web-new`

### Categoría
Web / Desarrollo

### Problema que resuelve
No tiene sitio web. Pierde todos los clientes que buscan online.

### Ticket estimado
USD 2,500 - 6,000

### Prioridad comercial
🔴 CRÍTICA

### Industrias objetivo
- Todas

### Señales requeridas
- `hasWebsite = false`
- `noWebsite = true` OR `website = null`

### Señales opcionales
- Tiene presencia en redes (es negocio real, no fraud)
- Tiene volumen de búsquedas para su rubro

### Evidencia que debemos mostrar al vendedor
1. **Brecha abismal** — Competencia está online, vos no
2. **Costo de oportunidad** — X clientes potenciales no te encuentran
3. **Mínimo viable** — No necesita ser un monumento, necesita ser funcional
4. **Timeline** — 4-6 semanas

### Reglas de activación
```
IF
  hasWebsite = false
OR
  noWebsite = true

THEN
  opportunity = WEB_NEW
  priority = CRITICAL
  matchType = EXACT_MATCH
  businessImpact = CRITICAL
```

### Reglas de exclusión
- Ninguna (si no tiene web, es oportunidad)

### Casos reales donde aplicaría
- Cualquier negocio que no tenga website

---

## REDISEÑO WEB

### Identificador
`web-redesign`

### Categoría
Web / Desarrollo

### Problema que resuelve
Sitio web existe pero está desactualizado, con problemas técnicos, o UX deficiente.

### Ticket estimado
USD 3,000 - 7,000

### Prioridad comercial
🟠 ALTA

### Industrias objetivo
- Todas (especialmente premium: Wine, Turismo, Inmobiliaria)

### Señales requeridas
- `hasWebsite = true`
- Mínimo una de:
  - Sitio no responsive (`hasViewport = false`)
  - Sitio muy antiguo (evidencia visual)
  - Performance pobre (`estimatedPageWeightKb > 500`)
  - UX deficiente

### Señales opcionales
- `imageCount < 3` (contenido visual muy pobre)
- `technology` incluye plataformas antiguas (Joomla, Drupal)

### Evidencia que debemos mostrar al vendedor
1. **Análisis comparativo** — "Tu sitio vs competencia"
2. **Impacto en conversión** — Sitio lento pierde 40% de visitantes
3. **Percepción de marca** — Sitio antiguo = empresa antigua
4. **Modernización** — Diseño actual + móvil optimizado + CMS moderno

### Reglas de activación
```
IF
  hasWebsite = true
AND
  (
    hasViewport = false
    OR estimatedPageWeightKb > 500
    OR (hasDesignIssues = true)
  )

THEN
  opportunity = WEB_REDESIGN
  priority = HIGH
  matchType = EXACT_MATCH or STRONG_MATCH
  businessImpact = HIGH
```

### Reglas de exclusión
- ❌ Si sitio es ya moderno y responsive

### Casos reales donde aplicaría
- **Sitios que se ven viejos** (visual assessment)

---

## LANDING PAGES DE CONVERSIÓN

### Identificador
`landing-page`

### Categoría
Web / Conversión

### Problema que resuelve
Sitio general es OK pero no convierte. Necesita landing pages específicas para cada tipo de cliente.

### Ticket estimado
USD 1,200 - 3,000

### Prioridad comercial
🟠 ALTA

### Industrias objetivo
- Wine/Beverages (tours, membresías, regalos)
- Food Service (catering, eventos)
- Tourism (paquetes, experiencias)

### Señales requeridas
- `hasWebsite = true`
- `hasLeadForm = false` OR `hasEcommerce = true pero bajo engagement`

### Señales opcionales
- `mainNav` genérico sin CTAs claros
- Sin diferenciación de productos/servicios

### Evidencia que debemos mostrar al vendedor
1. **Análisis de conversión** — "Tu homepage pierde X visitantes porque no es específica"
2. **Segmentación** — Landing page para cada público (B2B vs B2C, turistas vs locales)
3. **Caso de éxito** — Bodega similar +300% en leads
4. **Versión A/B** — Test rápido antes de full rollout

### Reglas de activación
```
IF
  hasWebsite = true
AND
  (
    hasLeadForm = false
    OR hasOnlineBooking = false (for service businesses)
  )
AND
  (
    hasContactForm = false
    OR mainNav es genérico
  )

THEN
  opportunity = LANDING_PAGE
  priority = HIGH
  matchType = STRONG_MATCH
  businessImpact = HIGH
```

### Reglas de exclusión
- ❌ Si sitio ya tiene landing pages por segmento

### Casos reales donde aplicaría
- **Casa Vigil** — Tiene ecommerce pero necesita landing page para catering
- **Bodegas con turismo** — Necesita landing page "TOURS Y EXPERIENCIAS"

---

## GESTIÓN DE REDES SOCIALES

### Identificador
`social-management`

### Categoría
Redes Sociales

### Problema que resuelve
No tiene presencia en redes o está abandonada. Pierde clientes que descubren en Instagram/Facebook.

### Ticket estimado
USD 800 - 2,500

### Prioridad comercial
🟠 ALTA

### Industrias objetivo
- Wine/Beverages (Instagram es canal principal)
- Food Service (Instagram, TikTok)
- Retail (Instagram, Facebook)
- Tourism (Instagram, Pinterest)
- Beauty (Instagram, TikTok)

### Señales requeridas
- `hasSocialLinks = false` OR redes abandonadas

### Señales opcionales
- `hasInstagram = false` (para negocio visual)
- Redes existen pero con baja actividad (posteos viejos)

### Evidencia que debemos mostrar al vendedor
1. **Competencia capta clientes en Instagram** — 1,500 seguidores de competencia
2. **Tu ausencia** — Clientes no te encuentran en donde buscan
3. **Casos de éxito** — Bodega con 5k followers genera X ventas/mes
4. **Contenido estratégico** — No es solo fotos, es conversión

### Reglas de activación
```
IF
  industry IN (
    'Wine/Beverages',
    'Food Service',
    'Retail',
    'Tourism',
    'Beauty'
  )
AND
  (
    hasSocialLinks = false
    OR socialLinks inactivas (posteos > 3 meses)
  )

THEN
  opportunity = SOCIAL_MANAGEMENT
  priority = HIGH
  matchType = EXACT_MATCH or STRONG_MATCH
  businessImpact = HIGH
```

### Reglas de exclusión
- ❌ Si tiene redes activas con >500 followers y posteos regulares
- ❌ Si es B2B puro

### Casos reales donde aplicaría
- **Pulenta Estate** — Tiene Instagram pero sin actividad detectada
- **Casa Vigil** — Tiene redes pero no optimizadas

---

## SEGURIDAD WEB (HOSTINGGUARD)

### Identificador
`hostingguard`

### Categoría
Seguridad / Infraestructura

### Problema que resuelve
Sitio con problemas de seguridad (SSL vencido, malware, vulnerabilidades) que afectan conversión y marca.

### Ticket estimado
USD 500 - 2,000

### Prioridad comercial
🔴 CRÍTICA

### Industrias objetivo
- Todas las que procesan pagos online
- Todas las que recopilan datos

### Señales requeridas
- `httpsOk = false` (SSL inválido/vencido) OR
- Malware detectado OR
- Headers de seguridad ausentes

### Señales opcionales
- `hasEcommerce = true` (agravante: procesa pagos)

### Evidencia que debemos mostrar al vendedor
1. **Advertencia en navegador** — "Sitio no seguro" mata conversión
2. **Riesgo para datos** — Clientes desconfían, dejan de comprar
3. **Caso real** — Bodega con SSL vencido perdió 60% de conversión
4. **Solución** — Certificado SSL + monitoreo + backups

### Reglas de activación
```
IF
  httpsOk = false
OR
  hasSSLError = true
OR
  malware detectado

THEN
  opportunity = HOSTINGGUARD
  priority = CRITICAL
  matchType = EXACT_MATCH
  businessImpact = CRITICAL
```

### Reglas de exclusión
- Ninguna (si hay problema de seguridad, es crítico)

### Casos reales donde aplicaría
- **Cualquier sitio** con SSL vencido o inválido

---

## MATRIZ DE DECISIÓN

Use esta matriz cuando una oportunidad podría mapear a múltiples servicios:

| Situación | Servicio 1 | Servicio 2 | Ganador | Razón |
|-----------|-----------|-----------|--------|-------|
| Bodega sin ecommerce | ECOMMERCE | SEO_LOCAL | ECOMMERCE | Ingresos directos > ranking |
| Restaurante sin reservas online | ONLINE_BOOKING | WEB_REDESIGN | ONLINE_BOOKING | Conversión > diseño |
| Ecommerce sin Meta Pixel | CRM_AUTOMATION | SEO_TECHNICAL | CRM_AUTOMATION | Retargeting > ranking |
| Sitio sin schema + sin GBP | SEO_SCHEMA | GBP_MANAGEMENT | GBP_MANAGEMENT | GBP genera clientes hoy |

---

## PRÓXIMO PASO

Después de aprobación de este catálogo:
1. Construir el Opportunity Engine determinístico basado en estas reglas
2. Cada regla de activación se convierte en una función
3. Claude entra solo para generar la narrativa comercial

