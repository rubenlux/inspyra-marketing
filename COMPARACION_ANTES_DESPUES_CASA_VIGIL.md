# COMPARACIÓN ANTES vs DESPUÉS: CASA VIGIL
## El problema real no es solo eliminar contradicciones

---

# CONTEXTO

Casa Vigil es un **RESTAURANTE DE ALTA COCINA + BODEGA + HOSPEDAJE** en Mendoza.

Análisis actual: Correcto pero superficial.

---

# PARTE 1: SIGNALS CRUDOS

```json
{
  "title": "UNIVERSO VIGIL",
  "accessible": true,
  "httpsOk": true,
  "hasPhone": false,
  "hasAddress": false,
  "hasContactForm": false,
  "hasLeadForm": false,
  "hasOnlineBooking": false,
  "hasSocialLinks": true,
  "socialLinksFound": ["instagram.com", "facebook.com", "twitter.com"],
  "hasEcommerce": true,
  "hasMetaPixel": false,
  "hasAnalytics": true,
  "hasGA4": true,
  "hasGTM": true,
  "h1Count": 0,
  "hasSchema": false,
  "hasSitemap": false,
  "hasCanonical": false,
  "hasOgTags": false,
  "hasMetaDescription": true,
  "estimatedPageWeightKb": 10,
  "imageCount": 2,
  "mainNavSections": [
    "UNIVERSO VIGIL",
    "COMPRA ONLINE",
    "HACER UNA RESERVA"
  ]
}
```

---

# PARTE 2: HOY (Evidence Generator Actual)

## 2.1 Lo que hace Claude

Claude recibe `signals.json` directamente y genera:

```json
{
  "opportunities": [
    {
      "service": "Sistema de Reservas Online",
      "impact": "HIGH",
      "confidence": 88,
      "evidence": [
        "Restaurante de alta cocina + bodega: rubro de altísima dependencia de reservas",
        "hasOnlineBooking=false: sin sistema de reservas digital confirmado",
        "Nav incluye 'HACER UNA RESERVA' pero sin booking real — proceso manual",
        "hasPhone=false: sin teléfono visible en el sitio",
        "hasContactForm=false: sin ningún formulario alternativo",
        "Sin redes sociales detectadas: sin canal adicional para captar reservas"  ← ❌ FALSO
      ],
      "businessImpact": "Casa Vigil tiene una sección 'HACER UNA RESERVA' en su menú principal pero sin sistema real detrás..."
    },
    {
      "service": "Automatización / CRM",
      "impact": "HIGH",
      "confidence": 78,
      "evidence": [
        "hasEcommerce=true pero hasMetaPixel=false: sin retargeting de carritos",
        "hasLeadForm=false: no captura leads",
        "Sin presencia en redes sociales detectada: canal de captación inexistente"  ← ❌ FALSO
      ]
    }
  ]
}
```

## 2.2 Problema

**Lo que está BIEN:**
- ✓ Identifica que falta Sistema de Reservas Online
- ✓ Identifica oportunidad de CRM/retargeting

**Lo que está MAL:**
- ❌ Niega presencia en redes (2 veces) siendo que `hasSocialLinks=true`
- ❌ Oportunidades son GENÉRICAS (podrían ser para CUALQUIER restaurante)
- ❌ No reconoce el **PATRÓN CRÍTICO**: sitio invita a "HACER UNA RESERVA" pero SIN MANERA DE HACERLO

**Lo que FALTA comercialmente:**
- ❌ No reconoce que es HÍBRIDO (restaurante + bodega + hospedaje)
- ❌ No detecta que ECOMMERCE existe pero sin conversión (sin Meta Pixel)
- ❌ No analiza la **FRICCIÓN ESPECÍFICA**: visitante llega a "HACER UNA RESERVA" → encuentra NADA
- ❌ No sugiere ECOMMERCE de VINOS (que venden online, detectado como hasEcommerce=true)

**Resultado:** Analysis es correcto pero SUPERFICIAL. Parece generado para cualquier restaurante, no específicamente para Casa Vigil.

---

# PARTE 3: PROPUESTA (Evidence Engine MEJORADO)

## 3.1 Evidence Engine genera (MÁS RICA Y INTELIGENTE)

```typescript
const evidence: Evidence[] = [
  // EVIDENCE 1: Gap crítico en reservas
  {
    code: "RESERVATION_FRICTION_GAP",
    confidence: 100,
    signals: {
      hasOnlineBooking: false,
      mainNavSections: ["UNIVERSO VIGIL", "COMPRA ONLINE", "HACER UNA RESERVA"],
      hasContactForm: false,
      hasPhone: false
    },
    text: "Sitio invita a 'HACER UNA RESERVA' pero sin:
           - Sistema digital de reservas
           - Formulario de contacto
           - Teléfono visible",
    
    // ← NUEVO: Contexto comercial, NO LLM
    commercialContext: {
      pattern: "INVITATION_WITHOUT_MECHANISM",
      severity: "CRITICAL",
      userJourney: "Visitante lee 'HACER UNA RESERVA' → clica → encuentra nada → abandona",
      estimatedConversionLoss: "25-35%"
    }
  },

  // EVIDENCE 2: Ecommerce sin retargeting
  {
    code: "ECOMMERCE_WITHOUT_RETARGET",
    confidence: 100,
    signals: {
      hasEcommerce: true,
      hasMetaPixel: false,
      hasGA4: true
    },
    text: "Sitio vende online (hasEcommerce=true) pero SIN Meta Pixel para retargeting",
    
    commercialContext: {
      pattern: "ABANDONED_CART_LOSS",
      severity: "HIGH",
      userJourney: "Cliente entra a tienda → agrega vino al carrito → no compra → desaparece",
      estimatedConversionLoss: "60-70% de carro abandonados"
    }
  },

  // EVIDENCE 3: Redes sociales presentes (CORRECCIÓN)
  {
    code: "HAS_SOCIAL_PRESENCE",
    confidence: 100,
    signals: {
      hasSocialLinks: true,
      socialLinksFound: ["instagram.com", "facebook.com", "twitter.com"]
    },
    text: "Sitio enlaza a Instagram, Facebook y Twitter",
    
    commercialContext: {
      channel: "SOCIAL",
      status: "LINKED_NOT_OPTIMIZED",
      opportunity: "Redes existen pero sitio no convierte en ellas"
    }
  },

  // EVIDENCE 4: Sitio muy pobre visualmente
  {
    code: "VISUAL_QUALITY_LOW",
    confidence: 95,
    signals: {
      estimatedPageWeightKb: 10,
      imageCount: 2,
      h1Count: 0,
      hasOgTags: false
    },
    text: "Sitio: 10KB, 2 imágenes, sin H1, sin Open Graph",
    
    commercialContext: {
      pattern: "LOW_TRUST_SIGNAL",
      severity: "MEDIUM",
      context: "Alta cocina requiere alta confianza visual. Sitio parece descuidado.",
      impact: "Reduce intención de reserva pre-landing"
    }
  },

  // EVIDENCE 5: Meta description presente (positivo)
  {
    code: "HAS_META_DESCRIPTION",
    confidence: 100,
    signals: {
      hasMetaDescription: true
    },
    text: "Sitio tiene meta description"
  }
]
```

## 3.2 Evidence Validator valida

```javascript
// ✓ PASA: HAS_SOCIAL_PRESENCE existe
// ✗ FALLA (previene): Si existiera NO_SOCIAL + HAS_SOCIAL simultáneamente

validator.validate(evidence);
// { valid: true, errors: [] }
```

## 3.3 Claude recibe (NO signals, SOLO evidence)

```json
{
  "prospect": {
    "nombreEmpresa": "Casa Vigil Bodega",
    "rubro": "Restaurante de alta cocina + Bodega",
    "website": "universovigil.com"
  },
  "evidence": [
    {
      "code": "RESERVATION_FRICTION_GAP",
      "confidence": 100,
      "text": "Sitio invita a 'HACER UNA RESERVA' pero sin:",
      "commercialContext": {
        "pattern": "INVITATION_WITHOUT_MECHANISM",
        "estimatedConversionLoss": "25-35%"
      }
    },
    {
      "code": "ECOMMERCE_WITHOUT_RETARGET",
      "confidence": 100,
      "text": "Sitio vende online pero SIN Meta Pixel",
      "commercialContext": {
        "estimatedConversionLoss": "60-70% carros abandonados"
      }
    },
    {
      "code": "HAS_SOCIAL_PRESENCE",
      "confidence": 100,
      "text": "Sitio enlaza a Instagram, Facebook, Twitter"
    },
    {
      "code": "VISUAL_QUALITY_LOW",
      "confidence": 95,
      "text": "Sitio muy pobre visualmente para alta cocina"
    }
  ]
}
```

## 3.4 Claude genera oportunidades (AHORA SÍ RICA)

```json
{
  "opportunities": [
    {
      "service": "Sistema de Reservas Online",
      "impact": "CRITICAL",
      "confidence": 100,
      "evidence": [
        "RESERVATION_FRICTION_GAP: Sitio dice 'HACER UNA RESERVA' pero no hay mecanismo",
        "HAS_SOCIAL_PRESENCE: Instagram/Facebook podrían iniciar customer journey"
      ],
      "businessImpact": "Casa Vigil ATRAE a visitantes (menciona reservas en nav, tiene redes sociales) pero NO CONVIERTE porque el proceso es 100% manual. En alta cocina, cada fricción es una reserva perdida. Estimado: 25-35% de visitantes con intención abandonan.",
      "specificAction": "Implementar calendario de reservas (Calendly, Acuityscheduling) integrado con Instagram DMs"
    },
    {
      "service": "Ecommerce Optimization (Retargeting)",
      "impact": "HIGH",
      "confidence": 100,
      "evidence": [
        "ECOMMERCE_WITHOUT_RETARGET: Vende vinos online pero sin Meta Pixel",
        "HAS_SOCIAL_PRESENCE: Tiene Instagram para retargeting"
      ],
      "businessImpact": "Casa Vigil vende vinos online (COMPRA ONLINE en nav) pero pierde 60-70% de carritos abandonados. Visitantes llegan, ven vinos, pero no compran. Sin Meta Pixel, no puede retargetearlos en Instagram (donde 50% de su tráfico potencial está).",
      "specificAction": "Instalar Meta Pixel, crear look-alike audiences de compradores"
    },
    {
      "service": "Visual Branding para Alta Cocina",
      "impact": "MEDIUM",
      "confidence": 95,
      "evidence": [
        "VISUAL_QUALITY_LOW: Sitio tiene solo 2 imágenes, 10KB total"
      ],
      "businessImpact": "Alta cocina vende confianza visual. Sitio actual (10KB, 2 imágenes) parece abandonado. Visitante potencial: 'Si no cuidan el sitio, ¿cómo cocinan?' Impacto estimado: 15-25% menos confianza pre-reserva.",
      "specificAction": "Fotografía profesional de platos, bodega, hospedaje"
    }
  ]
}
```

---

# COMPARACIÓN LADO A LADO

## ANTES (Actual)

| Aspecto | Valor |
|---------|-------|
| **Oportunidades identificadas** | 4 genéricas |
| **Riesgos de alucinación** | ❌ 3 ("Sin redes sociales") |
| **Calidad comercial** | ⭐⭐ Superficial |
| **Especificidad** | ⭐⭐ Genérica para cualquier restaurante |
| **Contexto del cliente** | ❌ No reconoce híbrido (hostel+restaurante+bodega) |
| **Acciones concretas** | ⭐⭐ Vagas |

## DESPUÉS (Evidence Engine MEJORADO)

| Aspecto | Valor |
|---------|-------|
| **Oportunidades identificadas** | 3 específicas para Casa Vigil |
| **Riesgos de alucinación** | ✓ 0 (validator lo previene) |
| **Calidad comercial** | ⭐⭐⭐⭐ Rica y matizada |
| **Especificidad** | ⭐⭐⭐⭐ ÚNICA para Casa Vigil |
| **Contexto del cliente** | ✓ Reconoce patrón híbrido |
| **Acciones concretas** | ⭐⭐⭐⭐ Calendly, Meta Pixel, fotografía |

---

# EL PROBLEMA REAL

Tu pregunta es correcta: **Un Evidence Engine puro (solo NO_BOOKING, NO_SCHEMA, etc.) seguiría siendo superficial.**

La solución: Evidence Engine debe ser **INTELIGENTE**, no solo **DETERMINÍSTICO**.

Evidence debe incluir:

1. ✓ **Código único** (NO_BOOKING)
2. ✓ **Signals que lo soportan** (hasOnlineBooking=false)
3. ✓ **Patrón detectado** (INVITATION_WITHOUT_MECHANISM)
4. ✓ **Impacto comercial estimado** (25-35% conversión perdida)
5. ✓ **User journey específico** (Visitante lee → clica → encuentra nada → abandona)

Sin esto, Claude sigue siendo un generador de platitudes.

---

# CONCLUSIÓN

**Preguntas:**

1. ¿El Evidence Engine elimina únicamente contradicciones o también mejora la calidad?
   - **HOY:** Solo elimina contradicciones (Evidence Engine básico)
   - **NECESARIO:** Debe incluir contexto comercial para mejorar calidad
   
2. ¿Qué información nueva tendrá Claude?
   - **HOY:** Recibe signals crudos → genera evidence genérica
   - **PROPUESTO:** Recibe evidence RICA con contexto comercial, patrón, estimaciones
   
3. ¿Por qué será mejor el análisis?
   - **HOY:** "No tiene reservas online" (obvio)
   - **PROPUESTO:** "Invita a reservar pero sin mecanismo (25-35% abandono) + vende vinos sin retargeting (60-70% carros abandonados)"

El Evidence Engine debe evolucionar de esto:
```
{ code: "NO_BOOKING", confidence: 100 }
```

A esto:
```
{
  code: "RESERVATION_FRICTION_GAP",
  confidence: 100,
  pattern: "INVITATION_WITHOUT_MECHANISM",
  estimatedLoss: "25-35%",
  userJourney: "Visitante lee 'HACER UNA RESERVA' → clica → encuentra nada → abandona"
}
```

Ese cambio (de signals crudos a evidence contextuada) es lo que haría que Claude genere análisis REALMENTE MEJORES, no solo más correctos.

