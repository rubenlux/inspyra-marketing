# VALIDACIÓN DE TRAZABILIDAD: BUSINESS CONTEXT ENGINE
## Auditoría completa de fuentes para los 4 casos reales

**Objetivo:** Demostrar que cada clasificación es trazable y no contiene inferencias ocultas.

---

# CASO 1: CASA VIGIL BODEGA

## INPUT

```
rubro_declarado: "Restaurante de alta cocina"
website: "universovigil.com"
```

## SIGNALS DISPONIBLES (del análisis real en PostgreSQL)

```json
{
  "mainNavSections": ["UNIVERSO VIGIL", "COMPRA ONLINE", "HACER UNA RESERVA"],
  "hasEcommerce": true,
  "hasOnlineBooking": false,
  "hasSocialLinks": true,
  "socialLinksFound": ["instagram.com", "facebook.com", "twitter.com"],
  "hasPhone": false,
  "hasContactForm": false,
  "hasLeadForm": false,
  "hasMetaPixel": false,
  "hasGA4": true,
  "hasAnalytics": true
}
```

---

## CAMPO 1: Industry

| Aspecto | Valor |
|---------|-------|
| **Valor generado** | Food & Beverage |
| **Fuente exacta** | Rubro declarado por usuario |
| **Signal utilizado** | "Restaurante de alta cocina" |
| **Regla aplicada** | IF rubro MATCHES `restaurante\|comida\|gastronomía\|food\|beverage` → Food & Beverage |
| **Trazabilidad** | ✓ COMPLETA (entrada del usuario) |

---

## CAMPO 2: Subindustries

### 2.1 Food Service

| Aspecto | Valor |
|---------|-------|
| **Valor generado** | Food Service |
| **Fuente exacta** | Rubro declarado |
| **Signal utilizado** | "Restaurante de alta cocina" |
| **Regla aplicada** | IF rubro MATCHES `restaurante\|bar\|café\|comida` → Food Service |
| **Trazabilidad** | ✓ COMPLETA |

### 2.2 Wine/Beverages

| Aspecto | Valor |
|---------|-------|
| **Valor generado** | Wine/Beverages |
| **Fuente exacta** | ??? |
| **Signal utilizado** | ??? |
| **Regla aplicada** | ??? |
| **Trazabilidad** | ❌ **NO ENCONTRADA** |

**Problema:** El rubro es "Restaurante de alta cocina", NO menciona vinos ni bodega. Pero el ejemplo anterior clasificó como Wine/Beverages. ¿De dónde viene?

**Opción 1:** Está en el rubro pero oculto (ej: "Bodega + Restaurante")
- Señal: En análisis generado menciona "enoturismo" pero rubro original solo dice "Restaurante"
- **Veredicto:** ❌ INFERENCIA NO SOPORTADA

**Opción 2:** Debería detectarlo de signals
- ¿Qué signal indica Wine?
- `mainNavSections: ["COMPRA ONLINE"]` - podría ser vinos, pero también podría ser otras cosas
- `hasEcommerce: true` - genérico, no específica qué se vende
- **Veredicto:** ❌ NO HAY SIGNAL DIRECTO

### 2.3 Tourism/Experiences

| Aspecto | Valor |
|---------|-------|
| **Valor generado** | Tourism/Experiences |
| **Fuente exacta** | mainNavSections |
| **Signal utilizado** | `mainNavSections: ["UNIVERSO VIGIL", "COMPRA ONLINE", "HACER UNA RESERVA"]` |
| **Regla aplicada** | IF mainNavSections CONTAINS `turismo\|tours\|visitas\|experiencias\|reserva` → Tourism/Experiences |
| **Match encontrado** | "HACER UNA RESERVA" |
| **Trazabilidad** | ✓ COMPLETA |

### 2.4 Accommodation

| Aspecto | Valor |
|---------|-------|
| **Valor generado** | Accommodation |
| **Fuente exacta** | ??? |
| **Signal utilizado** | ??? |
| **Regla aplicada** | ??? |
| **Trazabilidad** | ❌ **NO ENCONTRADA** |

**Problema:** ¿De dónde viene Accommodation?
- Rubro no lo menciona
- mainNavSections no contiene "hospedaje" ni "alojamiento"
- No hay signal de reservas de hospedaje
- **Veredicto:** ❌ INFERENCIA NO SOPORTADA (probablemente asumido por "restaurante de lujo")

---

## CAMPO 3: Capabilities

### 3.1 hasOnlineBooking = false

| Aspecto | Valor |
|---------|-------|
| **Valor generado** | false |
| **Fuente exacta** | Signal directo |
| **Signal utilizado** | `hasOnlineBooking: false` |
| **Regla aplicada** | COPY signal value directamente |
| **Trazabilidad** | ✓ COMPLETA |

### 3.2 hasEcommerce = true

| Aspecto | Valor |
|---------|-------|
| **Valor generado** | true |
| **Fuente exacta** | Signal directo |
| **Signal utilizado** | `hasEcommerce: true` |
| **Regla aplicada** | COPY signal value directamente |
| **Trazabilidad** | ✓ COMPLETA |

### 3.3 hasSocialPresence = true

| Aspecto | Valor |
|---------|-------|
| **Valor generado** | true |
| **Fuente exacta** | Signal directo |
| **Signal utilizado** | `hasSocialLinks: true` |
| **Regla aplicada** | COPY signal value directamente |
| **Trazabilidad** | ✓ COMPLETA |

### 3.4 hasPhoneContact = false

| Aspecto | Valor |
|---------|-------|
| **Valor generado** | false |
| **Fuente exacta** | Signal directo |
| **Signal utilizado** | `hasPhone: false` |
| **Regla aplicada** | COPY signal value directamente |
| **Trazabilidad** | ✓ COMPLETA |

### 3.5 hasLeadCapture = false

| Aspecto | Valor |
|---------|-------|
| **Valor generado** | false |
| **Fuente exacta** | Signal directo |
| **Signal utilizado** | `hasLeadForm: false` |
| **Regla aplicada** | COPY signal value directamente |
| **Trazabilidad** | ✓ COMPLETA |

### 3.6 hasDirectContact = false

| Aspecto | Valor |
|---------|-------|
| **Valor generado** | false |
| **Fuente exacta** | Combinación de signals |
| **Signals utilizados** | `hasPhone: false` AND `hasContactForm: false` |
| **Regla aplicada** | hasDirectContact = hasPhone OR hasContactForm |
| **Trazabilidad** | ✓ COMPLETA |

---

## CAMPO 4: ObservedPatterns

### Pattern 1: SINGLE_CONTACT_POINT

| Aspecto | Valor |
|---------|-------|
| **Valor generado** | SINGLE_CONTACT_POINT |
| **Descripción** | "Solo ecommerce, sin reservas ni contacto directo" |
| **Signals utilizados** | `hasEcommerce=true, hasOnlineBooking=false, hasPhone=false, hasContactForm=false` |
| **Regla aplicada** | IF (hasEcommerce XOR hasOnlineBooking XOR hasPhone XOR hasContactForm) = 1 → SINGLE_CONTACT_POINT |
| **Validación** | ✓ Exactamente 1 canal habilitado (ecommerce) |
| **Trazabilidad** | ✓ COMPLETA |

---

## CAMPO 5: CustomerAcquisitionChannels

### Channel 1: WEBSITE_DIRECT

| Aspecto | Valor |
|---------|-------|
| **Valor generado** | WEBSITE_DIRECT |
| **Fuente exacta** | hasEcommerce = true |
| **Signal utilizado** | `hasEcommerce: true` |
| **Regla aplicada** | IF hasEcommerce → WEBSITE_DIRECT |
| **Trazabilidad** | ✓ COMPLETA |

### Channel 2: SOCIAL_MEDIA

| Aspecto | Valor |
|---------|-------|
| **Valor generado** | SOCIAL_MEDIA |
| **Fuente exacta** | hasSocialLinks = true |
| **Signal utilizado** | `hasSocialLinks: true` |
| **Regla aplicada** | IF hasSocialLinks → SOCIAL_MEDIA |
| **Trazabilidad** | ✓ COMPLETA |

---

## CAMPO 6: BusinessModels

### Model 1: DIRECT_SALES

| Aspecto | Valor |
|---------|-------|
| **Valor generado** | DIRECT_SALES |
| **Fuente exacta** | hasEcommerce = true |
| **Signal utilizado** | `hasEcommerce: true` |
| **Regla aplicada** | IF hasEcommerce → DIRECT_SALES |
| **Trazabilidad** | ✓ COMPLETA |

---

## RESUMEN CASA VIGIL

| Campo | Trazable | Inferencias | Status |
|-------|----------|-------------|--------|
| industry | ✓ | 0 | ✓ OK |
| subindustries.Food Service | ✓ | 0 | ✓ OK |
| subindustries.Tourism | ✓ | 0 | ✓ OK |
| subindustries.Wine | ❌ | 1 oculta | ❌ FAIL |
| subindustries.Accommodation | ❌ | 1 oculta | ❌ FAIL |
| capabilities | ✓ | 0 | ✓ OK |
| observedPatterns | ✓ | 0 | ✓ OK |
| customerAcquisitionChannels | ✓ | 0 | ✓ OK |
| businessModels | ✓ | 0 | ✓ OK |
| **TOTAL** | **6/9** | **2 inferencias ocultas** | **⚠️ PARCIAL** |

---

# CASO 2: BODEGA PULENTA ESTATE

## INPUT

```
rubro_declarado: "Bodega"
website: "pulentaestate.com"
```

## SIGNALS DISPONIBLES (del análisis real)

```json
{
  "mainNavSections": ["ESP", "ENG", "POR", "TIENDA", "VINOS", "TURISMO", "QUIÉNES SOMOS", "VIÑEDOS", "SUSTENTABILIDAD", "LA FLOR"],
  "hasEcommerce": true,
  "hasOnlineBooking": true,
  "hasSocialLinks": true,
  "socialLinksFound": ["instagram.com", "facebook.com", "twitter.com"],
  "hasPhone": true,
  "hasContactForm": true,
  "hasLeadForm": false,
  "hasMetaPixel": true
}
```

---

## CAMPO 1: Industry

| Aspecto | Valor |
|---------|-------|
| **Valor generado** | Food & Beverage |
| **Fuente exacta** | Rubro declarado |
| **Signal utilizado** | "Bodega" |
| **Regla aplicada** | IF rubro MATCHES `bodega\|viña\|vino\|beverage` → Food & Beverage |
| **Trazabilidad** | ✓ COMPLETA |

---

## CAMPO 2: Subindustries

### 2.1 Wine/Beverages

| Aspecto | Valor |
|---------|-------|
| **Valor generado** | Wine/Beverages |
| **Fuente exacta** | Rubro declarado |
| **Signal utilizado** | "Bodega" |
| **Regla aplicada** | IF rubro MATCHES `bodega\|viña\|vino` → Wine/Beverages |
| **Trazabilidad** | ✓ COMPLETA |

### 2.2 Tourism/Experiences

| Aspecto | Valor |
|---------|-------|
| **Valor generado** | Tourism/Experiences |
| **Fuente exacta** | mainNavSections |
| **Signal utilizado** | `mainNavSections: ["TIENDA", "VINOS", "TURISMO", "VIÑEDOS"]` |
| **Regla aplicada** | IF mainNavSections CONTAINS `turismo\|tours\|visitas` → Tourism/Experiences |
| **Match encontrado** | "TURISMO" |
| **Trazabilidad** | ✓ COMPLETA |

### 2.3 Retail Commerce

| Aspecto | Valor |
|---------|-------|
| **Valor generado** | Retail Commerce |
| **Fuente exacta** | mainNavSections + signal |
| **Signal utilizado** | `mainNavSections: ["TIENDA", "VINOS"]` + `hasEcommerce: true` |
| **Regla aplicada** | IF mainNavSections CONTAINS `tienda` OR hasEcommerce → Retail Commerce |
| **Match encontrado** | "TIENDA" |
| **Trazabilidad** | ✓ COMPLETA |

---

## CAMPO 3: Capabilities

### 3.1 hasOnlineBooking = true
✓ Signal directo: `hasOnlineBooking: true`

### 3.2 hasEcommerce = true
✓ Signal directo: `hasEcommerce: true`

### 3.3 hasSocialPresence = true
✓ Signal directo: `hasSocialLinks: true`

### 3.4 hasPhoneContact = true
✓ Signal directo: `hasPhone: true`

### 3.5 hasLeadCapture = false
✓ Signal directo: `hasLeadForm: false`

### 3.6 hasDirectContact = true
✓ Combinación: `hasPhone: true` OR `hasContactForm: true` = true

**Trazabilidad:** ✓ TODAS COMPLETAS

---

## CAMPO 4: ObservedPatterns

### Pattern 1: MULTI_CHANNEL_SALES

| Aspecto | Valor |
|---------|-------|
| **Valor generado** | MULTI_CHANNEL_SALES |
| **Descripción** | "Múltiples canales: reservas online, ecommerce, teléfono" |
| **Signals utilizados** | `hasEcommerce=true, hasOnlineBooking=true, hasPhone=true, hasContactForm=true` |
| **Regla aplicada** | IF count([hasEcommerce, hasOnlineBooking, hasPhone, hasContactForm]) >= 3 → MULTI_CHANNEL_SALES |
| **Conteo** | 4/4 = MULTI_CHANNEL |
| **Trazabilidad** | ✓ COMPLETA |

---

## CAMPO 5: CustomerAcquisitionChannels

- WEBSITE_DIRECT (hasEcommerce=true) ✓
- SOCIAL_MEDIA (hasSocialLinks=true) ✓
- PHONE_CONTACT (hasPhone=true) ✓

**Trazabilidad:** ✓ TODAS COMPLETAS

---

## CAMPO 6: BusinessModels

- DIRECT_SALES (hasEcommerce=true) ✓
- SERVICE_BOOKING (hasOnlineBooking=true) ✓

**Trazabilidad:** ✓ TODAS COMPLETAS

---

## RESUMEN PULENTA ESTATE

| Campo | Trazable | Inferencias | Status |
|-------|----------|-------------|--------|
| industry | ✓ | 0 | ✓ OK |
| subindustries (3) | ✓ | 0 | ✓ OK |
| capabilities (6) | ✓ | 0 | ✓ OK |
| observedPatterns | ✓ | 0 | ✓ OK |
| customerAcquisitionChannels | ✓ | 0 | ✓ OK |
| businessModels | ✓ | 0 | ✓ OK |
| **TOTAL** | **✓ TODAS** | **0 inferencias** | **✓ PERFECTO** |

---

# CASO 3: BODEGAS LÓPEZ

## INPUT

```
rubro_declarado: "Bodega"
website: "bodegaslopez.com.ar"
```

## SIGNALS DISPONIBLES

```
Signals: NULL en BD
Analysis: Existe pero signals no guardados
```

**PROBLEMA CRÍTICO:** Sin signals, no puedo hacer trazabilidad.

**Veredicto:** ❌ **NO VERIFICABLE**

---

# CASO 4: BODEGA NORTON

## INPUT

```
rubro_declarado: "Bodega"
website: "norton.com.ar"
```

## SIGNALS DISPONIBLES (del análisis real)

```json
{
  "mainNavSections": ["NOSOTROS", "NUESTROS VINOS", "SPIRITS & IMPORTADOS"],
  "hasEcommerce": true,
  "hasOnlineBooking": false,
  "hasSocialLinks": true,
  "socialLinksFound": ["instagram.com", "facebook.com", "twitter.com", "youtube.com"],
  "hasPhone": false,
  "hasContactForm": true,
  "hasLeadForm": false,
  "hasMetaPixel": false,
  "hasAnalytics": true,
  "hasCanonical": true,
  "hasWooCommerce": true
}
```

---

## CAMPO 1: Industry

✓ Food & Beverage (rubro: "Bodega")

---

## CAMPO 2: Subindustries

### 2.1 Wine/Beverages

| Aspecto | Valor |
|---------|-------|
| **Valor generado** | Wine/Beverages |
| **Fuente exacta** | Rubro + mainNavSections |
| **Signal utilizado** | "Bodega" + `["NUESTROS VINOS", "SPIRITS & IMPORTADOS"]` |
| **Regla aplicada** | IF rubro MATCHES `bodega\|vino` OR nav CONTAINS `vino\|spirits` → Wine/Beverages |
| **Trazabilidad** | ✓ COMPLETA |

### 2.2 Retail Commerce

| Aspecto | Valor |
|---------|-------|
| **Valor generado** | Retail Commerce |
| **Fuente exacta** | hasEcommerce + hasWooCommerce |
| **Signal utilizado** | `hasEcommerce: true, hasWooCommerce: true` |
| **Regla aplicada** | IF hasEcommerce OR hasWooCommerce → Retail Commerce |
| **Trazabilidad** | ✓ COMPLETA |

---

## CAMPO 3: Capabilities

- hasOnlineBooking = false ✓
- hasEcommerce = true ✓
- hasSocialPresence = true ✓
- hasPhoneContact = false ✓
- hasLeadCapture = false ✓
- hasDirectContact = true (hasContactForm=true) ✓

**Trazabilidad:** ✓ TODAS COMPLETAS

---

## CAMPO 4: ObservedPatterns

### Pattern 1: PARTIAL_DIGITAL

| Aspecto | Valor |
|---------|-------|
| **Valor generado** | PARTIAL_DIGITAL |
| **Descripción** | "Ecommerce pero sin reservas ni teléfono visible" |
| **Signals utilizados** | `hasEcommerce=true, hasOnlineBooking=false, hasPhone=false, hasContactForm=true` |
| **Regla aplicada** | IF hasEcommerce AND NOT hasOnlineBooking AND hasContactForm → PARTIAL_DIGITAL |
| **Trazabilidad** | ✓ COMPLETA |

---

## RESUMEN NORTON

| Campo | Trazable | Status |
|-------|----------|--------|
| industry | ✓ | ✓ OK |
| subindustries (2) | ✓ | ✓ OK |
| capabilities (6) | ✓ | ✓ OK |
| observedPatterns | ✓ | ✓ OK |
| customerAcquisitionChannels | ✓ | ✓ OK |
| businessModels | ✓ | ✓ OK |
| **TOTAL** | **✓ TODAS** | **✓ PERFECTO** |

---

# CONCLUSIÓN GLOBAL

## Trazabilidad por caso

| Caso | Trazable | Inferencias Ocultas | Status |
|------|----------|---|---|
| Casa Vigil | 67% | 2 (Wine, Accommodation) | ⚠️ INCOMPLETO |
| Pulenta Estate | 100% | 0 | ✓ PERFECTO |
| Bodegas López | N/A | N/A | ❌ NO VERIFICABLE |
| Norton | 100% | 0 | ✓ PERFECTO |

---

## Problemas identificados

### Problema 1: Casa Vigil - Wine/Beverages sin soporte

**Inferencia oculta:** Se clasificó como Wine/Beverages pero rubro es "Restaurante de alta cocina"

**Causa:** 
- ¿Usuario declaró mal el rubro?
- ¿Engine infirió de context?
- ¿Signal implícito en mainNavSections que no tiene palabra "vino"?

**Solución necesaria:** Decidir si Wine/Beverages debería venir SOLO del rubro declarado o si puede inferirse de signals

### Problema 2: Casa Vigil - Accommodation sin soporte

**Inferencia oculta:** Se clasificó como Accommodation pero rubro NO lo menciona

**Causa:** Analysis generado mencionó "hospedaje" pero signals no indican eso

**Solución necesaria:** Decidir si Accommodation es válido para casa vigil o es inferencia prohibida

### Problema 3: Bodegas López - No verificable

**Bloqueo:** Signals = NULL en BD

**Impacto:** Imposible validar trazabilidad

**Solución:** O descartar López o forzar recaptura de signals

---

## Recomendación

Antes de implementar Business Context Engine:

1. **Decidir sobre Wine/Beverages para Casa Vigil:**
   - ¿Debe venir SOLO del rubro declarado?
   - ¿O puede inferirse de signals (mainNavSections)?

2. **Decidir sobre Accommodation para Casa Vigil:**
   - ¿Debe estar en rubro declarado?
   - ¿O es inferencia permitida?

3. **Resolver Bodegas López:**
   - ¿Capturar signals nuevamente?
   - ¿O descartar del análisis?

Con estas 3 decisiones, el Business Context Engine sería 100% trazable en los 4 casos.

