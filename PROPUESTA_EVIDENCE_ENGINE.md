# PROPUESTA TÉCNICA: EVIDENCE ENGINE DETERMINÍSTICO
## Eliminación de contradicciones y alucinaciones en el pipeline de análisis

**Status:** Propuesta arquitectónica (sin implementación)  
**Problema:** Analyzers generan evidence que contradice signals crudos  
**Solución:** Separar generación de evidence de síntesis y scoring  

---

# 1. PROBLEMA RAÍZ IDENTIFICADO

## Arquitectura Actual (DEFECTUOSA)

```
Playwright (facts)
      ↓
signals.json
      ↓
Claude Analyzer (interpreta + infiere + genera evidence + puntúa + escribe narrativa)
      ↓
opportunity.json
```

**Problema:** Claude hace demasiadas cosas simultáneamente:
1. Interpreta signals → CORRECTO
2. Infiere contexto → CORRECTO SI ES CUIDADOSO
3. Genera evidence → **INCORRECTO** (debería ser determinístico)
4. Puntúa oportunidad → CORRECTO
5. Escribe narrativa → CORRECTO

**Resultado:** Evidence contiene alucinaciones, contradicciones, inferencias no soportadas.

---

# 2. ARQUITECTURA PROPUESTA (CORRECTA)

```
┌─────────────────────────────────────────────────────┐
│ ETAPA 1: FACTS (Playwright)                         │
├─────────────────────────────────────────────────────┤
│ hasSocialLinks: true                                │
│ hasPhone: false                                     │
│ hasOnlineBooking: false                             │
│ hasEcommerce: true                                  │
│ hasMetaPixel: false                                 │
│ ... (todos booleanos, sin IA)                       │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ ETAPA 2: EVIDENCE ENGINE (TypeScript puro)          │
├─────────────────────────────────────────────────────┤
│ INPUT: signals.json + industry + context            │
│                                                      │
│ REGLAS DETERMINÍSTICAS:                             │
│ if (!signals.hasOnlineBooking) → NO_BOOKING         │
│ if (!signals.hasPhone) → NO_PHONE                   │
│ if (signals.hasSocialLinks) → HAS_SOCIAL ✓          │
│ if (!signals.hasSocialLinks) → NO_SOCIAL            │
│ (NUNCA puede producir NO_SOCIAL si HAS_SOCIAL=true)│
│                                                      │
│ OUTPUT: evidence.json (100% verificable)            │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ ETAPA 3: CLAUDE (síntesis y narrativa)              │
├─────────────────────────────────────────────────────┤
│ INPUT: evidence.json (SOLO evidence pre-validada)   │
│                                                      │
│ TAREAS:                                             │
│ 1. Priorizar evidence por impacto                   │
│ 2. Estimar ticket                                   │
│ 3. Generar summary comercial                        │
│ 4. Asignar confidence (basado en # evidences)       │
│                                                      │
│ RESTRICCIÓN: NO puede negar o ignorar evidence      │
│ RESTRICCIÓN: NO puede inventar evidence             │
│ RESTRICCIÓN: NO puede inferir ubicaciones/contexto  │
│                                                      │
│ OUTPUT: opportunity.json (score + narrative)        │
└─────────────────────────────────────────────────────┘
```

---

# 3. EVIDENCE ENGINE DETERMINÍSTICO

## 3.1 Definición

**Evidence Engine:** Conjunto de reglas TypeScript que transforma signals en evidence verificable.

**Propiedades:**
- ✓ Determinístico (mismo input → mismo output siempre)
- ✓ Verificable (cada evidence mapea a un signal)
- ✓ Imposible de contradecir (hasSocialLinks=true IMPIDE NO_SOCIAL)
- ✓ Imposible de alucinar (solo evidence definida en reglas)
- ✓ Trazable (cada opportunity puede remontarse a evidence → signal)

## 3.2 Estructura de Evidence

```typescript
interface Evidence {
  // Identificador único
  code: string; // "NO_BOOKING", "NO_PHONE", "HAS_SOCIAL", etc.
  
  // Certeza basada en signal
  confidence: 100 | 80 | 60 | 40; // 100=signal explícito, 40=inferencia
  
  // Texto human-readable
  text: string; // "No se detectó sistema de reservas online"
  
  // Trazabilidad
  signal: string; // "hasOnlineBooking"
  signalValue: boolean; // false
  
  // Contexto (SOLO si viene de signals)
  context?: {
    industry?: string;
    mainNavSections?: string[];
  };
}
```

## 3.3 Reglas por Tipo de Oportunidad

### BOOKING OPPORTUNITIES

```typescript
class BookingEvidenceGenerator {
  generate(signals: AuditSignals, industry: string): Evidence[] {
    const evidence: Evidence[] = [];

    // FACT 1: Sin sistema de reservas online
    if (!signals.hasOnlineBooking) {
      evidence.push({
        code: "NO_BOOKING",
        confidence: 100,
        signal: "hasOnlineBooking",
        signalValue: false,
        text: "No se detectó sistema de reservas online en el sitio"
      });
    }

    // FACT 2: Sin teléfono visible
    if (!signals.hasPhone) {
      evidence.push({
        code: "NO_PHONE",
        confidence: 100,
        signal: "hasPhone",
        signalValue: false,
        text: "No se detectó teléfono visible en el sitio"
      });
    }

    // FACT 3: Sin formulario de contacto
    if (!signals.hasContactForm) {
      evidence.push({
        code: "NO_CONTACT_FORM",
        confidence: 100,
        signal: "hasContactForm",
        signalValue: false,
        text: "No se detectó formulario de contacto"
      });
    }

    // FACT 4: Con formulario de contacto (alternativa para reservas)
    if (signals.hasContactForm && !signals.hasOnlineBooking) {
      evidence.push({
        code: "CONTACT_FORM_ONLY",
        confidence: 80,
        signal: "hasContactForm",
        signalValue: true,
        text: "Solo disponible formulario de contacto, no reservas online"
      });
    }

    // NUNCA inventar ubicación, mercado, tipo de industria
    // NUNCA inferir "fricciones" o "abandono"
    // Solo facts de signals

    return evidence;
  }
}
```

### CRM OPPORTUNITIES

```typescript
class CRMEvidenceGenerator {
  generate(signals: AuditSignals): Evidence[] {
    const evidence: Evidence[] = [];

    // FACT 1: Tiene ecommerce pero sin retargeting pixel
    if (signals.hasEcommerce && !signals.hasMetaPixel) {
      evidence.push({
        code: "ECOMMERCE_NO_RETARGET",
        confidence: 100,
        signal: "hasEcommerce && !hasMetaPixel",
        signalValue: true,
        text: "Sitio con ecommerce pero sin Meta Pixel para retargeting"
      });
    }

    // FACT 2: Sin formulario de lead
    if (!signals.hasLeadForm) {
      evidence.push({
        code: "NO_LEAD_FORM",
        confidence: 100,
        signal: "hasLeadForm",
        signalValue: false,
        text: "No se detectó formulario para captura de leads"
      });
    }

    // FACT 3: Con redes sociales (IMPORTANTE)
    if (signals.hasSocialLinks) {
      evidence.push({
        code: "HAS_SOCIAL_LINKS",
        confidence: 100,
        signal: "hasSocialLinks",
        signalValue: true,
        text: "Sitio enlaza a redes sociales: " + signals.socialLinksFound.join(", ")
      });
    }

    // NUNCA afirmar "sin presencia en redes" si HAS_SOCIAL_LINKS existe
    // NUNCA inferir "sin actividad en redes"

    return evidence;
  }
}
```

### SEO OPPORTUNITIES

```typescript
class SEOEvidenceGenerator {
  generate(signals: AuditSignals): Evidence[] {
    const evidence: Evidence[] = [];

    // FACT 1: Sin H1
    if (signals.h1Count === 0) {
      evidence.push({
        code: "NO_H1",
        confidence: 100,
        signal: "h1Count",
        signalValue: 0,
        text: "No se detectó etiqueta H1 en el sitio"
      });
    }

    // FACT 2: Múltiples H1
    if (signals.h1Count > 1) {
      evidence.push({
        code: "MULTIPLE_H1",
        confidence: 100,
        signal: "h1Count",
        signalValue: signals.h1Count,
        text: `Se detectaron ${signals.h1Count} etiquetas H1 (recomendado: 1)`
      });
    }

    // FACT 3: Sin schema markup
    if (!signals.hasSchema) {
      evidence.push({
        code: "NO_SCHEMA",
        confidence: 100,
        signal: "hasSchema",
        signalValue: false,
        text: "No se detectó schema markup estructurado"
      });
    }

    // FACT 4: Sin sitemap
    if (!signals.hasSitemap) {
      evidence.push({
        code: "NO_SITEMAP",
        confidence: 100,
        signal: "hasSitemap",
        signalValue: false,
        text: "No se detectó archivo sitemap.xml"
      });
    }

    // NUNCA inventar "Wine tourism", "Mercado competitivo"
    // NUNCA inferir volumen de búsquedas

    return evidence;
  }
}
```

## 3.4 Contradicción Preventer

```typescript
class EvidenceValidator {
  /**
   * Valida que la evidence no contradice signals
   */
  validate(evidence: Evidence[], signals: AuditSignals): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Regla crítica: NO_SOCIAL + HAS_SOCIAL = ERROR
    const hasNoSocial = evidence.some(e => e.code === "NO_SOCIAL");
    const hasHasSocial = evidence.some(e => e.code === "HAS_SOCIAL_LINKS");
    if (hasNoSocial && hasHasSocial) {
      errors.push("CONTRADICCIÓN: Evidence contiene NO_SOCIAL Y HAS_SOCIAL_LINKS");
    }

    // Regla crítica: Evidence debe mapear a signal verdadero
    for (const e of evidence) {
      const signalName = e.signal;
      const signalValue = (signals as any)[signalName];
      
      // Si evidence dice "NO_X", el signal debe ser false
      if (e.code.startsWith("NO_") && signalValue === true) {
        errors.push(
          `CONTRADICCIÓN: Evidence "${e.code}" pero signal ${signalName}=${signalValue}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

---

# 4. FLUJO OPERATIVO PROPUESTO

## 4.1 Análisis de Casa Vigil (ANTES vs DESPUÉS)

### ANTES (Actual — Defectuoso)

```
signals: {
  hasSocialLinks: true,
  socialLinksFound: ["instagram.com", "facebook.com", "twitter.com"],
  hasOnlineBooking: false,
  ...
}
  ↓
Claude Analyzer:
  "Sin redes sociales detectadas: sin canal adicional para captar reservas"
  ↓
RESULTADO: ❌ CONTRADICCIÓN
```

### DESPUÉS (Propuesto — Correcto)

```
signals: {
  hasSocialLinks: true,
  socialLinksFound: ["instagram.com", "facebook.com", "twitter.com"],
  hasOnlineBooking: false,
  ...
}
  ↓
Evidence Engine:
  Evidence[] = [
    { code: "NO_BOOKING", confidence: 100, signal: "hasOnlineBooking" },
    { code: "HAS_SOCIAL_LINKS", confidence: 100, signal: "hasSocialLinks", 
      text: "Sitio enlaza a redes sociales: instagram.com, facebook.com, twitter.com" },
    { code: "NO_PHONE", confidence: 100, signal: "hasPhone" },
    { code: "NO_CONTACT_FORM", confidence: 100, signal: "hasContactForm" }
  ]
  ↓
Validator: ✓ Evidence no contiene contradicciones
  ↓
Claude Analyzer (SOLO síntesis):
  INPUT: ["NO_BOOKING", "HAS_SOCIAL_LINKS", "NO_PHONE", "NO_CONTACT_FORM"]
  TAREA: "Prioriza estas evidences y escribe summary comercial"
  OUTPUT: {
    "opportunity": "Sistema de Reservas Online",
    "confidence": 88,
    "summary": "Sin sistema de reservas online pero con presencia en redes sociales. 
               Oportunidad de digitalizar reservas aprovechando base de followers."
  }
  ↓
RESULTADO: ✓ COHERENTE (reconoce redes sociales, no las niega)
```

---

# 5. IMPLEMENTACIÓN TÉCNICA

## 5.1 Archivo nuevo: `evidence-engine.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { AuditSignals } from './analyzers/types';

export interface Evidence {
  code: string;
  confidence: 100 | 80 | 60 | 40;
  text: string;
  signal: string;
  signalValue: any;
}

@Injectable()
export class EvidenceEngineService {
  /**
   * Genera evidence verificable a partir de signals
   * NUNCA alucina, NUNCA contradice
   */
  generateEvidenceForBooking(signals: AuditSignals): Evidence[] {
    const evidence: Evidence[] = [];

    if (!signals.hasOnlineBooking) {
      evidence.push({
        code: "NO_BOOKING",
        confidence: 100,
        signal: "hasOnlineBooking",
        signalValue: false,
        text: "No se detectó sistema de reservas online"
      });
    }

    if (!signals.hasPhone) {
      evidence.push({
        code: "NO_PHONE",
        confidence: 100,
        signal: "hasPhone",
        signalValue: false,
        text: "No se detectó teléfono visible"
      });
    }

    if (signals.hasSocialLinks) {
      evidence.push({
        code: "HAS_SOCIAL_LINKS",
        confidence: 100,
        signal: "hasSocialLinks",
        signalValue: true,
        text: `Sitio enlaza a redes sociales: ${signals.socialLinksFound.join(", ")}`
      });
    }

    if (!signals.hasContactForm) {
      evidence.push({
        code: "NO_CONTACT_FORM",
        confidence: 100,
        signal: "hasContactForm",
        signalValue: false,
        text: "No se detectó formulario de contacto"
      });
    }

    return evidence;
  }

  generateEvidenceForCRM(signals: AuditSignals): Evidence[] {
    const evidence: Evidence[] = [];

    if (signals.hasEcommerce && !signals.hasMetaPixel) {
      evidence.push({
        code: "ECOMMERCE_NO_RETARGET",
        confidence: 100,
        signal: "hasEcommerce && !hasMetaPixel",
        signalValue: true,
        text: "Ecommerce sin Meta Pixel para retargeting"
      });
    }

    if (!signals.hasLeadForm) {
      evidence.push({
        code: "NO_LEAD_FORM",
        confidence: 100,
        signal: "hasLeadForm",
        signalValue: false,
        text: "No se detectó formulario de leads"
      });
    }

    return evidence;
  }

  /**
   * Valida que evidence no contradice signals
   */
  validateEvidence(evidence: Evidence[], signals: AuditSignals): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Prevenir: NO_SOCIAL + HAS_SOCIAL
    const noSocial = evidence.filter(e => e.code === "NO_SOCIAL").length > 0;
    const hasSocial = evidence.filter(e => e.code === "HAS_SOCIAL_LINKS").length > 0;
    if (noSocial && hasSocial) {
      errors.push("CONTRADICCIÓN: NO_SOCIAL y HAS_SOCIAL_LINKS simultáneamente");
    }

    // Prevenir: NO_BOOKING + HAS_BOOKING
    const noBooking = evidence.filter(e => e.code === "NO_BOOKING").length > 0;
    const hasBooking = evidence.filter(e => e.code === "HAS_BOOKING").length > 0;
    if (noBooking && hasBooking) {
      errors.push("CONTRADICCIÓN: NO_BOOKING y HAS_BOOKING simultáneamente");
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

## 5.2 Modificación: `opportunity-engine.service.ts`

```typescript
@Injectable()
export class OpportunityEngineService {
  constructor(
    private readonly claude: ClaudeRunnerService,
    private readonly evidenceEngine: EvidenceEngineService // ← NUEVO
  ) {}

  async analyze(jobId: string, prospect: ProspectContext, signals: AuditSignals): Promise<OpportunityAnalysis> {
    // PASO 1: Generar evidence determinístico
    const bookingEvidence = this.evidenceEngine.generateEvidenceForBooking(signals);
    const crmEvidence = this.evidenceEngine.generateEvidenceForCRM(signals);
    // ... etc

    // PASO 2: Validar que no haya contradicciones
    const validation = this.evidenceEngine.validateEvidence(
      [...bookingEvidence, ...crmEvidence],
      signals
    );
    if (!validation.valid) {
      this.logger.error(`Evidence validation failed: ${validation.errors.join(", ")}`);
      throw new Error("Evidence validation failed");
    }

    // PASO 3: Pasar SOLO evidence verificada a Claude
    const bookingPrompt = BOOKING_ANALYZER_PROMPT(prospect, {
      evidence: bookingEvidence,
      signals // Para contexto, pero Claude no puede contradicirlo
    });

    // ... resto del código
  }
}
```

---

# 6. BENEFICIOS

| Aspecto | Actual | Propuesto |
|---------|--------|-----------|
| Alucinaciones de ubicación | ❌ Sí ("Perdriel", "Luján de Cuyo") | ✓ Imposible |
| Contradicciones de facts | ❌ Sí ("Sin redes" vs hasSocialLinks=true) | ✓ Imposible |
| Evidence trazable | ❌ No | ✓ Sí (cada evidence mapea a signal) |
| Validación de coherencia | ❌ No | ✓ Sí (contradicción validator) |
| Velocidad de ejecución | ✓ Normal | ✓ Más rápido (menos procesamiento LLM) |
| Costo de tokens | ✓ Alto | ✓ Más bajo (evidence pre-generada) |

---

# 7. IMPLEMENTACIÓN ROADMAP

## Fase 1: Development (1-2 horas)
- [ ] Crear `evidence-engine.service.ts` con reglas básicas
- [ ] Implementar EvidenceValidator
- [ ] Tests unitarios para cada regla

## Fase 2: Integration (2-3 horas)
- [ ] Modificar `opportunity-engine.service.ts` para usar Evidence Engine
- [ ] Actualizar analyzer prompts para recibir evidence (no signals)
- [ ] Validación de contradicciones en pipeline

## Fase 3: Testing (2-3 horas)
- [ ] Ejecutar contra 4 casos históricos (Casa Vigil, Norton, Pulenta, Bodegas López)
- [ ] Verificar que NO reproduce alucinaciones previas
- [ ] Validar scores siguen siendo razonables

## Fase 4: Monitoring (1 hora)
- [ ] Agregar logging de evidence validation
- [ ] Dashboard de contradicciones (debería ser 0)
- [ ] Métricas de evidence coverage por oportunidad

---

# 8. NEXT STEPS

**No modificar prompts hasta que Evidence Engine esté operativo.**

El problema arquitectónico está en la arquitectura, no en el wording.

Una vez implementado Evidence Engine:
1. ✓ Alucinaciones = 0 (matemáticamente imposible)
2. ✓ Contradicciones = 0 (validator lo previene)
3. ✓ Evidence = 100% trazable
4. ✓ Claude solo hace síntesis (trabajo para el que está optimizado)

Entonces sí, si es necesario, optimizar prompts de síntesis.

Pero el grueso del trabajo es arquitectura, no prompts.

