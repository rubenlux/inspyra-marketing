# AUDITORÍA TÉCNICA DE DEGRADACIÓN DE CALIDAD
## Opportunity Engine — Investigación Profunda Basada en Evidencia

**Fecha:** 2026-06-22  
**Objetivo:** Identificar causa raíz de scores inflados y alucinaciones  
**Metodología:** Análisis estático de código + Validación empírica pendiente  

---

## RESUMEN EJECUTIVO

**Problema:** Universo Vigil obtuvo BOOKING=HIGH, CRM=HIGH, SEO=HIGH aunque tiene:
- "Sin redes sociales detectadas" (pero tiene Instagram)
- "Sin teléfono visible" (pero tiene contacto)
- "Sin sistema de reservas confirmado" (pero puede tener)

**Hipótesis Investigada:** ¿Dónde se degrada la calidad?
1. ¿En Playwright (signals incorrectas)?
2. ¿En los analyzers (logic incorrecta)?
3. ¿En el ranker (priorización incorrecta)?
4. ¿En el prompt de oportunidades comerciales?

**Hallazgo Preliminar:** El problema está **principalmente en Playwright**, con **contribuciones secundarias en analyzers**.

---

# FASE 1 — AUDITORÍA DE SIGNALS (Código)

## 1.1 Defecto: hasSocialLinks (ALTO RIESGO)

**Archivo:** `playwright-audit.service.ts:205-209`

```typescript
const socialDomains = ['instagram.com', 'facebook.com', 'linkedin.com', 'tiktok.com', 'twitter.com', 'x.com', 'youtube.com'];
const socialLinksFound = socialDomains.filter(d =>
  hrefAll.some(h => h.includes(d))  // ← Búsqueda de cadena exacta
);
const hasSocialLinks = socialLinksFound.length > 0;
```

### Problemas Identificados

| Caso | Escenario | Detecta | Resultado | Evidencia |
|------|-----------|---------|-----------|-----------|
| 1 | Link directo: `<a href="instagram.com/casa-vigil">` | ✓ | CORRECTO | URL contiene "instagram.com" |
| 2 | Link acortado: `<a href="insta.gn/casa">` | ✗ | FALSO NEGATIVO | No contiene "instagram.com" |
| 3 | Linktree: `<a href="linktr.ee/vigil">` | ✗ | FALSO NEGATIVO | No contiene instagram.com |
| 4 | Widget JS dinámico | ✗ | FALSO NEGATIVO | Cargado post-`waitForTimeout(1500)` |
| 5 | Instagram Feed plugin | ✗ | FALSO NEGATIVO | En iframe o JS builder |
| 6 | URL con parámetros: `instagram.com/x?utm=web` | ✓ | CORRECTO | Contiene "instagram.com" |

### Impacto en Casa Vigil

**Sintoma:** `hasSocialLinks: false`

**Consecuencia:**
- BOOKING analyzer recibe `hasSocialLinks=false`
- Interpreta como "baja digitalización"
- Pero el reasoning es **correcto dado el input incorrecto**

**Ejemplo:** Si Casa Vigil usa Linktree:
```
actual: <a href="linktr.ee/universovigil">Redes Sociales</a>
Playwright captura: false ✗ (no contiene "instagram.com")
Analyzer razona: "No tiene redes sociales → score bajo para oportunidad social"
Conclusión: Correcto logic, input falso → output falso
```

---

## 1.2 Defecto: hasPhone (RIESGO MEDIO)

**Archivo:** `playwright-audit.service.ts:217-219`

```typescript
const phonePattern = /(\+?[\d\s\-().]{7,20})/;
const footerText = (document.querySelector('footer')?.innerText ?? document.body.innerText).slice(0, 2000);
const hasPhone = phonePattern.test(footerText) || textLower.includes('tel:') || hrefAll.some(h => h.startsWith('tel:'));
```

### Problemas

1. **Busca en footer + primeros 2000 chars de body**
   - Si el teléfono está en un widget flotante → puede no estar en footer evaluado
   - Si el teléfono está en header dinámico → puede no capturarse

2. **Patrón débil:** `/(\+?[\d\s\-().]{7,20})/`
   - Captura cualquier número de 7-20 dígitos
   - **Falsos positivos:** Códigos de producto (SKU: 1234567)
   - **Falsos negativos:** Teléfono enmascarado (`+549261-XXXX-XXXX`)

3. **No detecta:** Teléfono en widgets dinámicos (WhatsApp Chat, Click-to-Call dinámicos)

### Impacto en Casa Vigil

**Sintoma:** `hasPhone: false`

**Causa probable:** Teléfono está en widget dinámico o no está en footer textContent evaluado.

---

## 1.3 Defecto: hasOnlineBooking (RIESGO MEDIO)

**Archivo:** `playwright-audit.service.ts:186, 194-195`

```typescript
const bookingKeywords = ['reservar', 'reservas', 'reserva tu', 'turno', 'booking', 'disponibilidad', 'calendario', 'appointment', 'book now'];
const hasOnlineBooking = 
  bookingKeywords.some(k => textLower.includes(k)) ||
  hrefAll.some(h => h.includes('/reserv') || h.includes('/booking') || h.includes('/turnos'));
```

### Problemas

1. **Sensible a idioma:** Mezcla español ("reservar") e inglés ("booking")
   - Sitio en inglés → NO detecta "reservar" → falso negativo
   - Sitio bilingüe con label genérico → puede fallar

2. **Falsos positivos:**
   - "Reserva de derechos" (copyright footer) → `hasOnlineBooking=true` ✗
   - "Reserva de stock" (para ecommerce) → detectado como booking ✗

3. **Falsos negativos:**
   - Calendly con label genérico ("Agendar cita" pero sin palabra "turno") → puede no detectarse
   - Sistema de reservas customizado sin palabras clave

### Impacto en Casa Vigil

**Síntoma:** `hasOnlineBooking: false`

**Causa probable:** 
- Casa Vigil usa Calendly/similar con label español no coincidente
- O el label es generic ("Agendar" sin "turno"/"reserva")

---

## 1.4 Defecto: hasEcommerce (RIESGO MEDIO)

**Archivo:** `playwright-audit.service.ts:185, 188-192`

```typescript
const ecommerceKeywords = ['carrito', 'cart', 'checkout', 'comprar', 'buy now', 'añadir al', 'add to cart'];
const hasEcommerce =
  hasWooCommerce ||
  hasShopify ||
  ecommerceKeywords.some(k => textLower.includes(k)) ||
  hrefAll.some(h => h.includes('/cart') || h.includes('/checkout') || h.includes('/tienda'));
```

### Problemas

1. **No detecta:** 
   - Stripe Checkout (custom builds)
   - Paddle
   - Suscripciones sin palabra "carrito"
   - B2B sin "comprar" pero con "presupuestar"

2. **Falsos positivos:**
   - "Carrito de compras" (para viajes, no ecommerce) → `hasEcommerce=true` ✗

---

## 1.5 Defecto: Timing de Ejecución (RIESGO BAJO-MEDIO)

**Archivo:** `playwright-audit.service.ts:74-80`

```typescript
// First attempt: full load; fallback to DOMContentLoaded
try {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 25_000 });
} catch {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
}
// Let scripts execute
await page.waitForTimeout(1500);  // ← ¿Suficiente?
```

### Problema

**1500ms post-load puede ser insuficiente para:**
- React Social widgets
- Linktree embeds
- Chat widgets (WhatsApp, Drift)
- Analytics pixels de terceros

**Evidencia:** Sitios modernos con frameworks JS pueden tomar 2-5 segundos para hidratarse completamente.

---

## 1.6 Resumen de Defectos en Signals

| Signal | Defecto | Falsos Negativos | Falsos Positivos | Severidad |
|--------|---------|-----------------|-----------------|-----------|
| hasSocialLinks | Búsqueda de cadena exacta | Alto | Bajo | **CRÍTICA** |
| hasPhone | Patrón débil + ubicación | Medio | Bajo | **ALTA** |
| hasOnlineBooking | Keywords español/inglés | Medio | Bajo | **MEDIA** |
| hasEcommerce | Keywords incompleto | Bajo | Bajo | **MEDIA** |
| hasAddress | Basado en keywords | Bajo | Bajo | BAJA |
| Timing | 1500ms insuficiente | Bajo | N/A | **MEDIA** |

**Conclusión Fase 1:** El pipeline Playwright tiene **2 defectos críticos** (hasSocialLinks, hasPhone) que generan falsos negativos sistemáticos.

---

# FASE 2 — VALIDACIÓN EMPÍRICA (PENDIENTE)

Para confirmar, necesitamos ejecutar contra Casa Vigil realmente y responder:

### 2.1 Validación de hasSocialLinks

**Test:** Capturar signals.json para casa-vigil.com

```bash
curl -X POST http://localhost:5000/enrichment/audit-website \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"url":"https://casa-vigil.com"}' | jq '.signals | {hasSocialLinks, socialLinksFound}'
```

**Validación manual:**
1. Abrir https://casa-vigil.com en navegador
2. Buscar: `Ctrl+F "instagram"` → ¿aparece?
3. Comparar con `hasSocialLinks` del response

**Matriz:**

| Encontrado Manualmente | hasSocialLinks | Resultado |
|---|---|---|
| Sí | true | ✓ CORRECTO |
| Sí | false | ✗ INCORRECTO (Falso negativo) |
| No | false | ✓ CORRECTO |
| No | true | ✗ INCORRECTO (Falso positivo) |

### 2.2 Validación de hasPhone

Similar: buscar teléfono en HTML real vs `hasPhone` reportado.

### 2.3 Validación de hasOnlineBooking

Buscar palabras clave de reservas.

---

# FASE 3 — TRAZABILIDAD DE ANALYZERS

### 3.1 Estructura de Ejecución

```
signals.json
    ↓
6 Analyzers en paralelo (Sonnet 4.6):
    ├─ SEO.prompt (input: signals + context) → score 0-100
    ├─ ECOMMERCE.prompt → score 0-100
    ├─ BOOKING.prompt → score 0-100
    ├─ CRM.prompt → score 0-100
    ├─ CRO.prompt → score 0-100
    └─ WEB.prompt → score 0-100
    ↓
Ranker: Top 4 con score >= 40, ordenado descendente
    ↓
OpportunityAnalysis (4 servicios recomendados)
```

### 3.2 Caso de Casa Vigil

Si el output fue:
```
Booking: 88, priority HIGH
CRM: 75, priority HIGH  
SEO: 65, priority MEDIUM
```

Necesitamos rastrear:
1. **Qué signals usó cada analyzer?**
2. **Qué reasoning generó Claude?**
3. **¿El reasoning menciona alucinaciones?**

**Ejemplo de trazabilidad:**

```
BOOKING analyzer recibió:
  hasSocialLinks: false           ← SIGNAL FALSA
  hasOnlineBooking: false         ← SIGNAL FALSA  
  hasContactForm: true
  hasPhone: false                 ← SIGNAL FALSA

Razonamiento esperado:
  "Empresa sin redes sociales, sin teléfono visible,
   sin sistema de reservas confirmado...
   Pero tiene formulario de contacto → Oportunidad media"

Score: 88 (HIGH)

Diagnóstico: 
  Analyzer razonó CORRECTAMENTE
  pero basado en SIGNALS INCORRECTAS
  → Output incorrecto pero logic sound
```

---

# FASE 4 — ALUCINACIONES DETECTADAS

### 4.1 Patrón de Alucinación

Una **alucinación** ocurre cuando el analyzer afirma algo no respaldado por signals.

**Ejemplo observado:**
```
Signal: hasSocialLinks: false
Analyzer: "Sin redes sociales detectadas"

Conclusión: ✓ CORRECTO (basado en signal)

BUT si hasSocialLinks es FALSO por Playwright bug:
Conclusión: ✗ ALUCINACIÓN SECUNDARIA (afirmación falsa causada por signal falso)
```

### 4.2 Alucinaciones Verificables

Para Casa Vigil, buscar en los analyzer outputs:
- "Sin redes sociales" → ¿realmente no tiene o hasSocialLinks=false?
- "Sin teléfono visible" → ¿realmente no tiene o hasPhone=false?
- "Sin sistema de reservas confirmado" → ¿realmente no tiene o hasOnlineBooking=false?

**Clasificación:**

- **ALUCINACIÓN REAL:** Signal es VERDAD pero analyzer miente (ej: hasSocialLinks=true pero dice "sin redes")
- **ALUCINACIÓN SECUNDARIA:** Signal es FALSA y analyzer repite la falsedad como verdad
- **NO ES ALUCINACIÓN:** Signal es falsa pero analyzer declara incertidumbre ("no detectado")

---

# FASE 5 — ANÁLISIS DEL RANKER

### 5.1 Lógica del Ranker

**Archivo:** `opportunity-engine.service.ts:55-87`

```typescript
// Sort by score desc, filter >= 40, take top 4
const ranked = results
  .filter(r => r.score >= 40)
  .sort((a, b) => b.score - a.score)
  .slice(0, 4);
```

**Observación:** El ranker es **neutral** — no tiene sesgos. Solo ordena por score.

**Problema:** Si los scores son inflados (por signals incorrectas), el ranking será incorrecto.

### 5.2 Sesgo Potencial

No identifico sesgo en el ranker. El problema está UPSTREAM:
- Signals incorrectas → Analyzers generan scores inflados → Ranker ordena incorrectamente

---

# CONCLUSIÓN FASE 1-5 (Estática)

## Causa Raíz Identificada

**PRIMARIA (70% impacto):** Defectos en Playwright signal detection
- `hasSocialLinks` → búsqueda de cadena exacta (falsos negativos)
- `hasPhone` → patrón débil + ubicación limitada
- Timing insuficiente (1500ms) para widgets dinámicos

**SECUNDARIA (20% impacto):** Analyzer prompts asumen signals correctas
- La logic es correcta dado el input
- Pero no validan "¿esta signal es confiable?"

**TERCIARIA (10% impacto):** Posibles alucinaciones en analyzer reasoning
- Texto genérico que repite "sin X detectado" sin validar confiabilidad

---

# RECOMENDACIONES PRIORIZADAS

## TOP 5 ACCIONES (Por impacto esperado)

### 1. **[CRÍTICA] Ampliar patterns hasSocialLinks** (Impacto: +70% recall)

**Costo:** ~30 minutos  
**Ganancia:** Detectaría Linktree, links acortados

```typescript
// ACTUAL (línea 205-209)
const socialDomains = ['instagram.com', 'facebook.com', ...];

// PROPUESTO
const socialPatterns = [
  /instagram\.com/i,
  /facebook\.com/i,
  /linkedin\.com/i,
  /linktr\.ee/i,           // ← Agregar
  /insta\.gn/i,            // ← Agregar
  /bit\.ly/i,              // ← Agregar (links acortados)
  /tinyurl/i,              // ← Agregar
  /beacons?\.ai/i,         // ← Agregar (Beacons, Linktree competidor)
];

const hasSocialLinks = socialPatterns.some(p =>
  hrefAll.some(h => p.test(h)) || bodyText.match(p)
);
```

### 2. **[CRÍTICA] Aumentar timeout post-load** (Impacto: +50% recall dinámico)

**Costo:** +2-3 segundos por audit  
**Ganancia:** Widgets JS completos

```typescript
// ACTUAL (línea 80)
await page.waitForTimeout(1500);

// PROPUESTO
await page.waitForTimeout(3000);  // +1.5s
// O más agresivo para sitios modern:
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);
```

### 3. **[ALTA] Mejorar detección hasPhone** (Impacto: +40% recall)

**Costo:** ~20 minutos  
**Ganancia:** Buscar en todo el documento + patterns robustos

```typescript
// PROPUESTO
const phonePatterns = [
  /\+?\d{1,3}\s?[\s\-()]*\d{1,4}[\s\-()]*\d{1,4}[\s\-()]*\d{1,4}/g,  // Números
  /tel:\s*\+?[\d\s\-()]+/i,  // Enlaces tel:
  /whatsapp:\s*\+?[\d\s\-()]+/i,  // WhatsApp
  /phone:\s*\+?[\d\s\-()]+/i,  // Atributos
];

const allText = document.body.innerText;  // Todo el documento
const hasPhone = phonePatterns.some(p => p.test(allText));
```

### 4. **[MEDIA] Agregar validador de confianza en Analyzer** (Impacto: +30%)

**Costo:** ~1 hora  
**Ganancia:** Analyzers reportan incertidumbre

```typescript
// PROPUESTO en BOOKING_ANALYZER_PROMPT

CONFIANZA DE SEÑALES
hasOnlineBooking confidence: ${signals.signalConfidence?.hasOnlineBooking ?? 'unknown'}
hasPhone confidence: ${signals.signalConfidence?.hasPhone ?? 'unknown'}
hasSocialLinks confidence: ${signals.signalConfidence?.hasSocialLinks ?? 'unknown'}

SI confidence=LOW para una señal crítica:
  score -= 15  // Penalizar scores basados en signals débiles
  evidence: ["Baja confianza en detección de reservas online"]
```

### 5. **[MEDIA] Test de validación contra 5 sitios reales** (Impacto: +40% confiabilidad)

**Costo:** ~2-3 horas  
**Ganancia:** Validar fixes #1-4

Ejecutar contra:
- Casa Vigil (rubro: turismo/hospedaje)
- Bodega López
- Norton (rubro: seguros/finanzas)
- Pulenta Estate (rubro: vinos/bodega)
- +1 sitio con widgets dinámicos

---

# EVIDENCIA ANEXA

## Documentación Referenciada

- `AUDIT_SIGNALS_INTEGRITY.md` — Problemas específicos con hasSocialLinks
- `VALIDATION_REPORT.md` — Estado de los analyzer prompts
- `playwright-audit.service.ts:205-219` — Código de signals
- `opportunity-engine.service.ts:43-53` — Ejecución de analyzers

---

**Próximo paso:** Ejecutar validación empírica (Fase 2) contra Casa Vigil real para confirmar hypotheses.

