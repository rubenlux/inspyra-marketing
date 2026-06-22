# AUDITORÍA FUNCIONAL: BUSINESS CONTEXT ENGINE

**Fecha:** 2026-06-22  
**Datos:** 4 casos reales extraídos de EVIDENCIA_REAL_PIPELINE.md  
**Método:** Ejecutar engine sobre signals reales → Comparar output vs. oportunidades esperadas  

---

## RESUMEN EJECUTIVO

| Métrica | Resultado |
|---------|-----------|
| Casos procesados | 4/4 ✅ |
| Clasificación correcta | 4/4 ✅ |
| Patterns detectados | 6/10 esperados ⚠️ |
| Oportunidades de negocio detectadas | 0/10 ❌ |
| Engine genera "Smart Context"? | NO ❌ |

**Veredicto:** El engine clasifica correctamente el rubro pero **NO detecta oportunidades comerciales**.

---

## ANÁLISIS POR CASO

### CASO 1: Casa Vigil - Restaurante de Alta Cocina

**Clasificación generada:**
- ✅ Industry: `Food & Beverage`
- ✅ Subindustries: `Food Service`
- ✅ Coverage: `FULL`

**Patterns detectados:**
1. `INVITATION_WITHOUT_MECHANISM` (UNVERIFIED) — Nav menciona "HACER UNA RESERVA" pero sin booking real
2. `ECOMMERCE_WITHOUT_RETARGET` (CONFIRMED) — Tiene ecommerce pero sin Meta Pixel
3. `SOCIAL_NOT_OPTIMIZED` (CONFIRMED) — Social links sin lead capture

**Oportunidades que DEBERÍA detectar (según EVIDENCIA_REAL_PIPELINE.md):**
1. **Sistema de Reservas Online** (confidence: 88, impact: HIGH)
2. **Automatización / CRM** (confidence: 78, impact: HIGH)
3. **SEO Técnico** (confidence: 72, impact: HIGH)
4. **UX/UI y CRO** (confidence: 72, impact: HIGH)

**¿Qué detectó el engine?**
- Detectó que hay una invitación a reservar sin mecanismo (GOOD, pero UNVERIFIED)
- Detectó que falta retargeting (GOOD)
- Detectó que social no está optimizado (GOOD)

**¿Qué faltó?**
- ❌ NO detecta **"Sistema de Reservas Online"** como oportunidad comercial específica
- ❌ NO detecta **"Automatización / CRM"** como oportunidad
- ❌ NO detecta **"SEO Técnico"** (h1Count=0, hasSchema=false, hasSitemap=false)
- ❌ NO detecta **"UX/UI y CRO"**

**Brecha conceptual:**
El engine detecta PATTERNS técnicos pero NO traduce esos patterns a OPORTUNIDADES COMERCIALES.

---

### CASO 2: Bodegas López - Bodega de Exportación

**Clasificación generada:**
- ✅ Industry: `Food & Beverage`
- ✅ Subindustries: `Wine/Beverages`
- ✅ Coverage: `FULL`

**Patterns detectados:**
- 0 patterns (porque signals = null)

**Oportunidades que DEBERÍA detectar:**
1. **Ecommerce (tienda online, WooCommerce)** (confidence: 97, impact: HIGH)
2. **SEO Técnico** (confidence: 92, impact: HIGH)
3. **Performance Web** (confidence: 82, impact: MEDIUM)
4. **SEO de Contenidos** (confidence: 76, impact: MEDIUM)
5. **UX/UI / Landing Pages** (confidence: 72, impact: MEDIUM)
6. **Automatización / CRM / Workflows** (confidence: 63, impact: MEDIUM)

**¿Qué detectó el engine?**
- ✅ Clasificó correctamente como "Wine/Beverages"
- ✅ Identificó que no hay signals disponibles

**¿Qué faltó?**
- ❌ NO PUEDE detectar oportunidades porque signals = null
- ⚠️ **CRÍTICO:** Sin signals, el engine no genera análisis de sitio

**Observación importante:**
El documento EVIDENCIA_REAL_PIPELINE.md dice "signals: NULL" pero luego lista 6 oportunidades reales encontradas. Esto significa que el análisis real fue hecho MANUALMENTE o con OTRA herramienta, no con el Business Context Engine.

---

### CASO 3: Norton - Bodega

**Clasificación generada:**
- ✅ Industry: `Food & Beverage`
- ✅ Subindustries: `Wine/Beverages`
- ✅ Coverage: `FULL`

**Patterns detectados:**
1. `ECOMMERCE_WITHOUT_RETARGET` (CONFIRMED) — Tiene ecommerce sin Meta Pixel
2. `SOCIAL_NOT_OPTIMIZED` (CONFIRMED) — Social sin lead capture

**Oportunidades que DEBERÍA detectar:**
1. **Sistema de Reservas Online** (confidence: 90, impact: HIGH)
2. **Automatización / CRM** (confidence: 82, impact: HIGH)
3. **SEO Técnico** (confidence: 75, impact: MEDIUM)
4. **UX/UI y CRO** (confidence: 65, impact: MEDIUM)

**¿Qué detectó el engine?**
- ✅ Detectó falta de Meta Pixel
- ✅ Detectó social sin optimización

**¿Qué faltó?**
- ❌ NO detecta **"Sistema de Reservas Online"** (hasOnlineBooking=false pero es una bodega con turismo)
- ❌ NO detecta **"SEO Técnico"** (hasMetaDescription=false, hasSchema=false, hasSitemap=false, h1Count=2)
- ❌ NO detecta **"UX/UI y CRO"**

**Brecha conceptual:**
El engine tiene los signals crudos (hasOnlineBooking=false, hasSchema=false) pero NO los interpreta como "esto es una bodega con demanda de turismo → necesita reservas online".

---

### CASO 4: Pulenta Estate - Bodega Premium

**Clasificación generada:**
- ✅ Industry: `Food & Beverage`
- ✅ Subindustries: `Wine/Beverages`
- ✅ Coverage: `FULL`

**Patterns detectados:**
1. `SOCIAL_NOT_OPTIMIZED` (CONFIRMED) — Social sin lead capture

**Oportunidades que DEBERÍA detectar:**
1. **SEO Local / GBP** (confidence: 90, impact: HIGH) — hasGoogleBusiness=false
2. **Community Management** (confidence: 75, impact: HIGH)
3. **SEO de Contenidos** (confidence: 65, impact: MEDIUM)
4. **SEO Técnico** (confidence: 60, impact: MEDIUM)

**¿Qué detectó el engine?**
- ✅ Detectó social sin optimización

**¿Qué faltó?**
- ❌ NO detecta **"SEO Local / GBP"** (hasGoogleBusiness=false es un signal clave)
- ❌ NO detecta **"Community Management"** aunque tiene sección "TURISMO" en nav
- ❌ NO detecta **"SEO de Contenidos"** (trilingüe sin meta descriptions)
- ❌ NO detecta **"SEO Técnico"** (hasMetaDescription=false, hasCanonical=false, hasSchema=false)

**Brecha conceptual:**
El engine tiene el patrón hasGoogleBusiness=false pero no genera una oportunidad "SEO Local".

---

## SÍNTESIS DE GAPS

### 1. **El engine NO mapea signals a oportunidades comerciales**

| Signal del engine | Oportunidad esperada | ¿Detecta? |
|-------------------|---------------------|-----------|
| `hasOnlineBooking=false` | Sistema de Reservas Online | ❌ NO |
| `hasMetaPixel=false` | Automatización / CRM | ⚠️ PARCIAL (detecta pattern, no oportunidad) |
| `hasSchema=false` | SEO Técnico | ❌ NO |
| `hasSitemap=false` | SEO Técnico | ❌ NO |
| `h1Count=0 o 2` | SEO Técnico (H1 structure) | ❌ NO |
| `hasGoogleBusiness=false` | SEO Local / GBP | ❌ NO |
| `hasLeadForm=false` | Lead Capture / Conversion | ⚠️ PARCIAL |

### 2. **El engine NO entiende contexto de negocio**

El engine clasifica rubro ("Bodega", "Restaurante") pero no entiende:
- Una **bodega con turismo** necesita reservas online
- Una **bodega exportadora** necesita ecommerce D2C
- Un **restaurante de alta cocina** necesita experiencia sin fricción
- Un sitio **multilingüe (ES/ENG/POR)** necesita meta descriptions en todos los idiomas

### 3. **El engine genera patterns, no oportunidades**

Diferencia crítica:
```
Pattern:        "hasEcommerce=true pero hasMetaPixel=false"
Oportunidad:    "Implementar Meta Pixel para retargeting post-compra" 
                → Business case, timeline, investimento, ROI
```

El engine detecta lo primero, no lo segundo.

### 4. **El engine genera 0-3 patterns por caso**

Esperado: 4-6 oportunidades claras  
Realidad: 1-3 patterns detectados  

---

## CONCLUSIÓN

**¿El Business Context Engine genera contexto útil para detectar oportunidades comerciales?**

**Respuesta: NO.**

El engine:
- ✅ Compila
- ✅ Clasifica rubro correctamente
- ✅ Detecta algunos patterns técnicos
- ❌ NO mapea signals a oportunidades comerciales
- ❌ NO entiende contexto de industria
- ❌ NO genera lista de oportunidades accionables

**El cuello de botella no es arquitectura o compilación.**

**El cuello de botella es que el engine es demasiado simple: es un clasificador de rubro + detector de patterns, pero NO es un generador de oportunidades.**

---

## RECOMENDACIONES

### Próximo paso: NO Stage B (50 casos)

Hacer Stage B sobre un engine que no detecta oportunidades comerciales sería desperdiciar tiempo.

### Opción 1: Extender el engine

Agregar reglas que mapeen signals → oportunidades:

```typescript
// Ejemplo: regla para Reservas Online
if (rubro.includes("bodega") || rubro.includes("restaurante")) {
  if (!signals.hasOnlineBooking && signals.hasSocialLinks) {
    opportunities.push({
      type: "ONLINE_BOOKING_SYSTEM",
      confidence: 88,
      impact: "HIGH",
      evidence: [
        `Negocio de tipo ${industry} sin sistema de reservas digital`,
        `Tiene presencia social (${signals.socialLinksFound.join(", ")})`,
        `Nav menciona reservas pero sin mecanismo real`
      ]
    });
  }
}
```

### Opción 2: Cambiar arquitectura

El engine actual es:
```
Rubro → Industry classification
Signals → Pattern detection
```

Debería ser:
```
Rubro + Signals + Context → Opportunity ranking
```

Agregar:
- **Contexto de industria:** qué oportunidades son típicas para cada rubro
- **Confidence scoring:** basado en múltiples signals
- **Business impact:** no solo técnico, también comercial

### Opción 3: Usar un agente IA

El Business Context Engine quizás no debería ser código estático, sino un agente que pueda:
1. Recibir rubro + signals
2. Razonar: "esto es una bodega sin GBP → oportunidad SEO Local"
3. Generar lista de oportunidades con business cases

---

## Evidencia

**Ejecutado:** 2026-06-22 18:40:00 UTC  
**Script:** `run-business-context-real-evidence.js`  
**Datos:** EVIDENCIA_REAL_PIPELINE.md (4 casos, signals reales extraídas de PostgreSQL)  
**Output:** Arriba ↑

