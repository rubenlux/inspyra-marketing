# PROPUESTA: BUSINESS CONTEXT ENGINE
## Clasificación objetiva y verificable de empresas

**Principio:** Clasificar empresas SOLO basado en:
1. Signals observables (Playwright)
2. Datos declarativos (usuario ingresa: rubro)
3. Reglas determinísticas (no estimaciones, no inferencias)

---

# 1. ARQUITECTURA

```
┌──────────────────────────────────────────┐
│ INPUT                                    │
├──────────────────────────────────────────┤
│ signals.json (de Playwright)             │
│ rubro (string, del usuario)              │
│ website (string)                         │
└──────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────┐
│ BUSINESS CONTEXT ENGINE                  │
├──────────────────────────────────────────┤
│ Rule 1: Clasificar Industry              │
│ Rule 2: Detectar subrubros               │
│ Rule 3: Detectar capacidades (tourism,   │
│         ecommerce, hospitality, etc.)    │
│ Rule 4: Detectar modelos de negocio      │
└──────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────┐
│ OUTPUT: BusinessContext                  │
├──────────────────────────────────────────┤
│ {                                        │
│   industry: string                       │
│   subindustries: string[]                │
│   capabilities: Capability[]             │
│   businessModels: BusinessModel[]        │
│   observedPatterns: Pattern[]            │
│ }                                        │
└──────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────┐
│ Claude recibe:                           │
│ { context, evidence }                    │
│ → Genera oportunidades específicas       │
└──────────────────────────────────────────┘
```

---

# 2. DEFINICIONES

## 2.1 BusinessContext

```typescript
interface BusinessContext {
  // Clasificación principal (del rubro declarado)
  industry: IndustryType;
  
  // Subrubros detectados automáticamente
  subindustries: SubindustryType[];
  
  // Capacidades DETECTADAS en signals (no adivinadas)
  capabilities: {
    hasOnlineBooking: boolean;      // signal directo
    hasEcommerce: boolean;          // signal directo
    hasSocialPresence: boolean;     // signal directo
    hasLeadCapture: boolean;        // signal directo
    hasPhoneContact: boolean;       // signal directo
    hasDirectContact: boolean;      // signal directo
  };
  
  // Patrones observables (combinaciones de signals)
  observedPatterns: Pattern[];
  
  // Canales de ingreso de clientes (observable)
  customerAcquisitionChannels: Channel[];
  
  // Modelos de negocio (observable)
  businessModels: BusinessModel[];
}

type IndustryType = 
  | "Hospitality"
  | "Retail"
  | "Services"
  | "Manufacturing"
  | "Software/Tech"
  | "Professional Services"
  | "Healthcare"
  | "Education"
  | "Food & Beverage"
  | "Other";

type SubindustryType =
  | "Accommodation"      // hospedaje
  | "Food Service"       // restaurante, bar
  | "Wine/Beverages"     // bodega, viñedo
  | "Retail Commerce"    // tienda
  | "Tourism/Experiences"// tours, actividades
  | "Professional Consulting"
  | "Local Services"
  | "Other";

type Pattern =
  | "MULTI_CHANNEL_SALES"         // tiene ecommerce + reservas + contacto
  | "SINGLE_CONTACT_POINT"        // solo un canal
  | "NO_CONTACT_MECHANISM"        // sin forma de contacto
  | "DIGITAL_FIRST"               // ecommerce, redes, etc.
  | "ANALOG_ONLY"                 // solo teléfono/email
  | "HYBRID_ONLINE_OFFLINE";      // mix

type BusinessModel =
  | "DIRECT_SALES"                // venta directa (ecommerce)
  | "SERVICE_BOOKING"             // reserva de servicios
  | "LEAD_GENERATION"             // captura de contactos
  | "REFERRAL"                    // por recomendación
  | "OFFLINE_ONLY";               // sin digital

type Channel =
  | "WEBSITE_DIRECT"
  | "SOCIAL_MEDIA"
  | "PHONE_CONTACT"
  | "EMAIL_CONTACT"
  | "FORM_SUBMISSION"
  | "WALK_IN";

interface Pattern {
  code: string;
  description: string;
  signals: string[];  // qué signals lo indican
}
```

---

# 3. REGLAS DETERMINÍSTICAS

## 3.1 Clasificación de Industry

```typescript
class IndustryClassifier {
  classify(rubroDeclarado: string): IndustryType {
    // Mapeo exacto (usuario declara rubro)
    const industryMap = {
      "restaurante": "Food & Beverage",
      "bodega": "Food & Beverage",
      "bar": "Food & Beverage",
      "café": "Food & Beverage",
      "hotel": "Hospitality",
      "hospedaje": "Hospitality",
      "airbnb": "Hospitality",
      "tienda": "Retail",
      "comercio": "Retail",
      "agencia de viajes": "Hospitality",
      "tour operador": "Hospitality",
      "consultor": "Professional Services",
      "abogado": "Professional Services",
      "clínica": "Healthcare",
      "médico": "Healthcare",
      // ... etc
    };
    
    return industryMap[rubroDeclarado.toLowerCase()] || "Other";
  }
}
```

## 3.2 Detección de Subindustries

```typescript
class SubindustryDetector {
  detect(rubro: string, signals: AuditSignals): SubindustryType[] {
    const subs: SubindustryType[] = [];
    
    // ACCOMMODATION
    if (rubro.match(/hotel|hospedaje|airbnb|posada|alojamiento/i)) {
      subs.push("Accommodation");
    }
    
    // FOOD SERVICE
    if (rubro.match(/restaurante|bar|café|comida|cocina|gastronomía/i)) {
      subs.push("Food Service");
    }
    
    // WINE/BEVERAGES
    if (rubro.match(/bodega|viña|vino|bebida|bodega-taller/i)) {
      subs.push("Wine/Beverages");
    }
    
    // RETAIL COMMERCE
    if (rubro.match(/tienda|comercio|minorista|retail|shop/i)) {
      subs.push("Retail Commerce");
    }
    
    // TOURISM (observable en signals)
    if (signals.mainNavSections?.some(s => s.match(/turismo|tours|visitas|experiencias/i))) {
      subs.push("Tourism/Experiences");
    }
    
    return subs;
  }
}
```

## 3.3 Detección de Capabilities

```typescript
class CapabilityDetector {
  detect(signals: AuditSignals): BusinessContext["capabilities"] {
    return {
      // Directo de signals, sin interpretación
      hasOnlineBooking: signals.hasOnlineBooking,
      hasEcommerce: signals.hasEcommerce,
      hasSocialPresence: signals.hasSocialLinks,
      hasLeadCapture: signals.hasLeadForm,
      hasPhoneContact: signals.hasPhone,
      hasDirectContact: signals.hasContactForm || signals.hasPhone
    };
  }
}
```

## 3.4 Detección de Patrones

```typescript
class PatternDetector {
  detect(signals: AuditSignals, capabilities: Capabilities): Pattern[] {
    const patterns: Pattern[] = [];
    
    // PATTERN: MULTI_CHANNEL_SALES
    const channels = [
      capabilities.hasEcommerce,
      capabilities.hasOnlineBooking,
      capabilities.hasPhoneContact,
      capabilities.hasLeadCapture
    ].filter(Boolean).length;
    
    if (channels >= 3) {
      patterns.push({
        code: "MULTI_CHANNEL_SALES",
        description: "Empresa accesible por múltiples canales",
        signals: ["hasEcommerce", "hasOnlineBooking", "hasPhoneContact", "hasLeadCapture"]
      });
    }
    
    // PATTERN: NO_CONTACT_MECHANISM
    if (!capabilities.hasPhoneContact && 
        !capabilities.hasLeadCapture && 
        !capabilities.hasOnlineBooking) {
      patterns.push({
        code: "NO_CONTACT_MECHANISM",
        description: "Empresa sin forma clara de contacto/compra",
        signals: ["!hasPhone", "!hasLeadForm", "!hasOnlineBooking"]
      });
    }
    
    // PATTERN: SINGLE_CONTACT_POINT
    const contactPoints = [
      capabilities.hasPhoneContact,
      capabilities.hasLeadCapture,
      capabilities.hasOnlineBooking,
      capabilities.hasEcommerce
    ].filter(Boolean).length;
    
    if (contactPoints === 1) {
      patterns.push({
        code: "SINGLE_CONTACT_POINT",
        description: "Empresa con solo un canal de contacto",
        signals: [] // depende del caso
      });
    }
    
    return patterns;
  }
}
```

## 3.5 Detección de Business Models

```typescript
class BusinessModelDetector {
  detect(signals: AuditSignals, subindustries: SubindustryType[]): BusinessModel[] {
    const models: BusinessModel[] = [];
    
    // DIRECT_SALES: tiene ecommerce
    if (signals.hasEcommerce) {
      models.push("DIRECT_SALES");
    }
    
    // SERVICE_BOOKING: tiene reservas online
    if (signals.hasOnlineBooking) {
      models.push("SERVICE_BOOKING");
    }
    
    // LEAD_GENERATION: tiene formulario
    if (signals.hasLeadForm) {
      models.push("LEAD_GENERATION");
    }
    
    // OFFLINE_ONLY: nada digital
    const hasDigital = signals.hasEcommerce || 
                       signals.hasOnlineBooking || 
                       signals.hasLeadForm;
    if (!hasDigital) {
      models.push("OFFLINE_ONLY");
    }
    
    return models;
  }
}
```

---

# 4. EJEMPLOS REALES

## 4.1 CASA VIGIL BODEGA

**Input:**
```typescript
{
  rubro: "Restaurante de alta cocina",
  website: "universovigil.com",
  signals: {
    hasOnlineBooking: false,
    hasEcommerce: true,
    hasSocialLinks: true,
    hasLeadForm: false,
    hasPhone: false,
    hasContactForm: false,
    mainNavSections: ["UNIVERSO VIGIL", "COMPRA ONLINE", "HACER UNA RESERVA"]
  }
}
```

**Output: BusinessContext**
```json
{
  "industry": "Food & Beverage",
  "subindustries": [
    "Food Service",
    "Wine/Beverages",
    "Tourism/Experiences",
    "Accommodation"
  ],
  "capabilities": {
    "hasOnlineBooking": false,
    "hasEcommerce": true,
    "hasSocialPresence": true,
    "hasLeadCapture": false,
    "hasPhoneContact": false,
    "hasDirectContact": false
  },
  "observedPatterns": [
    {
      "code": "SINGLE_CONTACT_POINT",
      "description": "Solo ecommerce, sin reservas ni contacto directo",
      "signals": ["hasEcommerce=true", "hasOnlineBooking=false", "hasPhone=false", "hasContactForm=false"]
    }
  ],
  "customerAcquisitionChannels": [
    "WEBSITE_DIRECT",
    "SOCIAL_MEDIA"
  ],
  "businessModels": [
    "DIRECT_SALES"
  ]
}
```

---

## 4.2 BODEGA PULENTA ESTATE

**Input:**
```typescript
{
  rubro: "Bodega",
  website: "pulentaestate.com",
  signals: {
    hasOnlineBooking: true,
    hasEcommerce: true,
    hasSocialLinks: true,
    hasLeadForm: false,
    hasPhone: true,
    hasContactForm: true,
    mainNavSections: ["ESP", "ENG", "POR", "TIENDA", "VINOS", "TURISMO", "QUIÉNES SOMOS", "VIÑEDOS", "SUSTENTABILIDAD", "LA FLOR"]
  }
}
```

**Output: BusinessContext**
```json
{
  "industry": "Food & Beverage",
  "subindustries": [
    "Wine/Beverages",
    "Tourism/Experiences",
    "Retail Commerce"
  ],
  "capabilities": {
    "hasOnlineBooking": true,
    "hasEcommerce": true,
    "hasSocialPresence": true,
    "hasLeadCapture": false,
    "hasPhoneContact": true,
    "hasDirectContact": true
  },
  "observedPatterns": [
    {
      "code": "MULTI_CHANNEL_SALES",
      "description": "Múltiples canales: reservas online, ecommerce, teléfono",
      "signals": ["hasOnlineBooking=true", "hasEcommerce=true", "hasPhone=true", "hasContactForm=true"]
    }
  ],
  "customerAcquisitionChannels": [
    "WEBSITE_DIRECT",
    "SOCIAL_MEDIA",
    "PHONE_CONTACT"
  ],
  "businessModels": [
    "DIRECT_SALES",
    "SERVICE_BOOKING"
  ]
}
```

---

## 4.3 BODEGAS LÓPEZ

**Input:**
```typescript
{
  rubro: "Bodega",
  website: "bodegaslopez.com.ar",
  signals: {
    hasOnlineBooking: false,
    hasEcommerce: false,  // No detecta tienda en home, aunque existe en experiencias.bodegaslopez.com.ar
    hasSocialLinks: true,
    hasLeadForm: false,
    hasPhone: false,  // Datos de contacto no en HTML estructurado
    hasContactForm: false,
    mainNavSections: ["HISTORIA", "VINOS", "EXPERIENCIAS", "EVENTOS", "EMPRESA"]
  }
}
```

**Output: BusinessContext**
```json
{
  "industry": "Food & Beverage",
  "subindustries": [
    "Wine/Beverages",
    "Tourism/Experiences"
  ],
  "capabilities": {
    "hasOnlineBooking": false,
    "hasEcommerce": false,
    "hasSocialPresence": true,
    "hasLeadCapture": false,
    "hasPhoneContact": false,
    "hasDirectContact": false
  },
  "observedPatterns": [
    {
      "code": "NO_CONTACT_MECHANISM",
      "description": "Sin reservas online, sin ecommerce, sin teléfono visible",
      "signals": ["hasOnlineBooking=false", "hasEcommerce=false", "hasPhone=false", "hasContactForm=false"]
    }
  ],
  "customerAcquisitionChannels": [
    "SOCIAL_MEDIA"
  ],
  "businessModels": []
}
```

---

## 4.4 BODEGA NORTON

**Input:**
```typescript
{
  rubro: "Bodega",
  website: "norton.com.ar",
  signals: {
    hasOnlineBooking: false,
    hasEcommerce: true,
    hasSocialLinks: true,
    hasLeadForm: false,
    hasPhone: false,
    hasContactForm: true,
    mainNavSections: ["NOSOTROS", "NUESTROS VINOS", "SPIRITS & IMPORTADOS"]
  }
}
```

**Output: BusinessContext**
```json
{
  "industry": "Food & Beverage",
  "subindustries": [
    "Wine/Beverages",
    "Retail Commerce"
  ],
  "capabilities": {
    "hasOnlineBooking": false,
    "hasEcommerce": true,
    "hasSocialPresence": true,
    "hasLeadCapture": false,
    "hasPhoneContact": false,
    "hasDirectContact": true
  },
  "observedPatterns": [
    {
      "code": "PARTIAL_DIGITAL",
      "description": "Ecommerce pero sin reservas ni teléfono visible",
      "signals": ["hasEcommerce=true", "hasOnlineBooking=false", "hasPhone=false", "hasContactForm=true"]
    }
  ],
  "customerAcquisitionChannels": [
    "WEBSITE_DIRECT",
    "SOCIAL_MEDIA",
    "FORM_SUBMISSION"
  ],
  "businessModels": [
    "DIRECT_SALES"
  ]
}
```

---

# 5. DIFERENCIAS CLAVE

## Comparación de contextos

| Aspecto | Casa Vigil | Pulenta | Bodegas López | Norton |
|---------|-----------|---------|--------------|--------|
| **Industry** | Food & Beverage | Food & Beverage | Food & Beverage | Food & Beverage |
| **Subrubros** | 4 (Food, Wine, Tourism, Accommodation) | 3 (Wine, Tourism, Retail) | 2 (Wine, Tourism) | 2 (Wine, Retail) |
| **Business Models** | DIRECT_SALES | DIRECT_SALES + SERVICE_BOOKING | NONE | DIRECT_SALES |
| **Contact Channels** | 2 (Web, Social) | 3 (Web, Social, Phone) | 1 (Social) | 2 (Web, Form, Social) |
| **Pattern** | SINGLE_CONTACT_POINT | MULTI_CHANNEL_SALES | NO_CONTACT_MECHANISM | PARTIAL_DIGITAL |

---

# 6. CÓMO CLAUDE USARÍA ESTO

Claude recibe:

```json
{
  "prospect": {
    "nombreEmpresa": "Casa Vigil",
    "rubro": "Restaurante"
  },
  "context": {
    "industry": "Food & Beverage",
    "subindustries": ["Food Service", "Wine/Beverages", "Tourism/Experiences", "Accommodation"],
    "businessModels": ["DIRECT_SALES"],
    "observedPatterns": [
      {
        "code": "SINGLE_CONTACT_POINT",
        "description": "Solo ecommerce, sin reservas ni contacto directo"
      }
    ]
  },
  "evidence": [
    {
      "code": "NO_BOOKING",
      "confidence": 100,
      "signal": "hasOnlineBooking",
      "signalValue": false,
      "text": "No se detectó sistema de reservas online"
    },
    {
      "code": "HAS_ECOMMERCE",
      "confidence": 100,
      "signal": "hasEcommerce",
      "signalValue": true,
      "text": "Sitio tiene ecommerce"
    },
    {
      "code": "HAS_SOCIAL_PRESENCE",
      "confidence": 100,
      "signal": "hasSocialLinks",
      "signalValue": true,
      "text": "Sitio enlaza a redes sociales"
    }
  ]
}
```

Claude AHORA puede razonar:

- "Es Food & Beverage con 4 subrubros (incluyendo Tourism)"
- "PATTERN: SINGLE_CONTACT_POINT → solo ecommerce, sin reservas"
- "EVIDENCE: NO_BOOKING pero HAS_ECOMMERCE"
- "Para un restaurante de turismo, falta Sistema de Reservas Online"

Sin inventar números, sin alucinar user journeys, SOLO usando datos verificables.

---

# 7. IMPLEMENTACIÓN

Crear `business-context-engine.service.ts`:

```typescript
@Injectable()
export class BusinessContextEngineService {
  classify(
    rubro: string,
    signals: AuditSignals
  ): BusinessContext {
    const industry = new IndustryClassifier().classify(rubro);
    const subindustries = new SubindustryDetector().detect(rubro, signals);
    const capabilities = new CapabilityDetector().detect(signals);
    const patterns = new PatternDetector().detect(signals, capabilities);
    const models = new BusinessModelDetector().detect(signals, subindustries);
    
    return {
      industry,
      subindustries,
      capabilities,
      observedPatterns: patterns,
      customerAcquisitionChannels: this.detectChannels(signals),
      businessModels: models
    };
  }
}
```

---

# CONCLUSIÓN

**Business Context Engine:**
- ✓ 100% determinístico (solo reglas)
- ✓ 100% verificable (basado en signals + rubro declarado)
- ✓ Sin estimaciones
- ✓ Sin inferencias económicas
- ✓ Específico por empresa (House Vigil ≠ Norton)

**Resultado:** Claude tiene contexto objetivo para generar análisis ESPECÍFICO sin alucinar.

