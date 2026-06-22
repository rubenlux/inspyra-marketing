# SERVICES CATALOG — MACHINE VERSION

**Versión:** 2.0 (Orientada a máquina)  
**Fecha:** 2026-06-22  
**Estado:** Estructura determinística para Opportunity Engine  
**Fuente de verdad:** Este documento + SERVICES_CATALOG_MACHINE.json

---

## DEFINICIONES

### TIER (Jerarquía global)

```
TIER 1 — Ingresos directos hoy
TIER 2 — Presencia digital / Conversión
TIER 3 — Localización / Redes
TIER 4 — Optimización técnica

Regla dura: Si hay 1+ oportunidad TIER 1, no mostrar TIER 4.
```

### Señales

**requiredSignals** — AND (todos deben cumplirse)
**optionalSignals** — OR (al menos 1 agravante = más confianza)
**forbiddenSignals** — AND NOT (si existe cualquiera, no aplica)

### minEvidenceCount

Mínimo de signals que deben cumplirse para activar oportunidad.

```
minEvidenceCount = 1: Solo requiredSignals
minEvidenceCount = 2: requiredSignals + al menos 1 optionalSignal
minEvidenceCount = 3: requiredSignals + al menos 2 optionalSignals
```

---

## SERVICIOS CONSOLIDADOS

### TIER 1 — Ingresos / Conversión directa

#### ECOMMERCE
```json
{
  "id": "ecommerce",
  "tier": 1,
  "name": "Ecommerce",
  "problem": "No vender productos online",
  "estimatedValueUSD": [3000, 8000],
  "requiredSignals": [
    "hasEcommerce=false"
  ],
  "optionalSignals": [
    "industry=Wine/Beverages",
    "industry=Food Service",
    "industry=Retail",
    "navContains=TIENDA",
    "navContains=PRODUCTOS"
  ],
  "forbiddenSignals": [
    "isB2BPure=true"
  ],
  "minEvidenceCount": 2,
  "industries": [
    "Wine/Beverages",
    "Food Service",
    "Retail",
    "Tourism"
  ],
  "vendorEvidence": [
    "Signals: no tiene ecommerce",
    "Industria: {industry} típicamente vende productos",
    "Oportunidad: abrir canal de venta online"
  ],
  "realCases": [
    "Bodegas López",
    "Norton"
  ]
}
```

#### ONLINE_BOOKING_SYSTEM
```json
{
  "id": "online-booking",
  "tier": 1,
  "name": "Sistema de Reservas Online",
  "problem": "Las reservas se gestionan manualmente (email/WhatsApp)",
  "estimatedValueUSD": [1500, 3500],
  "requiredSignals": [
    "hasOnlineBooking=false",
    "navContainsReservation=true"
  ],
  "optionalSignals": [
    "industry=Wine/Beverages",
    "industry=Food Service",
    "industry=Tourism",
    "tourism=true",
    "hasPhone=false"
  ],
  "forbiddenSignals": [
    "isWalkInOnly=true"
  ],
  "minEvidenceCount": 2,
  "industries": [
    "Wine/Beverages",
    "Food Service",
    "Tourism",
    "Health & Wellness"
  ],
  "vendorEvidence": [
    "Signals: nav menciona reservas pero hasOnlineBooking=false",
    "Industria: {industry} requiere reservas para operación",
    "Impacto: fricción en conversión por proceso manual"
  ],
  "realCases": [
    "Casa Vigil",
    "Norton"
  ]
}
```

#### CRM_AUTOMATION
```json
{
  "id": "crm-automation",
  "tier": 1,
  "name": "CRM + Automatización",
  "problem": "Vende pero sin seguimiento post-venta ni retargeting",
  "estimatedValueUSD": [1500, 4000],
  "requiredSignals": [
    "hasEcommerce=true",
    "hasMetaPixel=false"
  ],
  "optionalSignals": [
    "hasLeadForm=false",
    "hasContactForm=false",
    "hasHubSpot=false",
    "hasMautic=false"
  ],
  "forbiddenSignals": [
    "hasProfessionalCRM=true"
  ],
  "minEvidenceCount": 2,
  "industries": [
    "Wine/Beverages",
    "Food Service",
    "Retail",
    "Tourism"
  ],
  "vendorEvidence": [
    "Signals: ecommerce=true pero sin Meta Pixel",
    "Impacto: sin retargeting, pierde clientes en carrito abandonado",
    "Solución: implementar Pixel + CRM básico + 2-3 flujos"
  ],
  "realCases": [
    "Casa Vigil",
    "Norton"
  ]
}
```

---

### TIER 2 — Presencia Digital / Conversión

#### WEB_NEW
```json
{
  "id": "web-new",
  "tier": 2,
  "name": "Sitio Web Nuevo",
  "problem": "No tiene sitio web",
  "estimatedValueUSD": [2500, 6000],
  "requiredSignals": [
    "hasWebsite=false"
  ],
  "optionalSignals": [
    "hasSocialLinks=true"
  ],
  "forbiddenSignals": [],
  "minEvidenceCount": 1,
  "industries": [
    "Todas"
  ],
  "vendorEvidence": [
    "Signals: no tiene website",
    "Impacto: pierde todos los clientes que buscan online"
  ],
  "realCases": []
}
```

#### WEB_REDESIGN
```json
{
  "id": "web-redesign",
  "tier": 2,
  "name": "Rediseño Web",
  "problem": "Sitio existe pero está desactualizado o con problemas UX",
  "estimatedValueUSD": [3000, 7000],
  "requiredSignals": [
    "hasWebsite=true"
  ],
  "optionalSignals": [
    "hasViewport=false",
    "estimatedPageWeightKb > 500",
    "imageCount < 3",
    "h1Count=0"
  ],
  "forbiddenSignals": [
    "isModernDesign=true"
  ],
  "minEvidenceCount": 2,
  "industries": [
    "Todas"
  ],
  "vendorEvidence": [
    "Signals: website existe pero {issue}",
    "Impacto: diseño deficiente mata conversión y percepción de marca",
    "Solución: rediseño moderno + mobile-first + CMS actual"
  ],
  "realCases": []
}
```

#### LANDING_PAGES
```json
{
  "id": "landing-pages",
  "tier": 2,
  "name": "Landing Pages de Conversión",
  "problem": "Sitio general no convierte clientes específicos",
  "estimatedValueUSD": [1200, 3000],
  "requiredSignals": [
    "hasWebsite=true",
    "hasLeadForm=false"
  ],
  "optionalSignals": [
    "mainNavIsGeneric=true",
    "hasEcommerce=true",
    "navContains=TOURS"
  ],
  "forbiddenSignals": [
    "hasSegmentedLandingPages=true"
  ],
  "minEvidenceCount": 2,
  "industries": [
    "Wine/Beverages",
    "Food Service",
    "Tourism"
  ],
  "vendorEvidence": [
    "Signals: sitio genérico sin CTAs específicos",
    "Impacto: diferentes segmentos de clientes necesitan diferentes mensajes",
    "Solución: 2-3 landing pages por segmento de cliente"
  ],
  "realCases": [
    "Casa Vigil"
  ]
}
```

---

### TIER 3 — Localización / Presencia en Redes

#### GBP_SEO_LOCAL (CONSOLIDADO)
```json
{
  "id": "gbp-seo-local",
  "tier": 3,
  "name": "Google Business Profile + SEO Local",
  "problem": "No aparece en Google Maps / búsqueda local",
  "estimatedValueUSD": [1200, 2500],
  "requiredSignals": [
    "hasGoogleBusiness=false"
  ],
  "optionalSignals": [
    "tourism=true",
    "hasWebsite=true",
    "navContains=TURISMO",
    "navContains=VISITANOS"
  ],
  "forbiddenSignals": [
    "isB2BPure=true",
    "isRemoteOnly=true"
  ],
  "minEvidenceCount": 2,
  "industries": [
    "Wine/Beverages",
    "Food Service",
    "Tourism",
    "Health & Wellness",
    "Retail",
    "Real Estate"
  ],
  "vendorEvidence": [
    "Signals: hasGoogleBusiness=false",
    "Industria: {industry} depende de búsquedas locales",
    "Impacto: no aparece en Maps cuando clientes buscan tu rubro + zona"
  ],
  "realCases": [
    "Pulenta Estate"
  ]
}
```

#### SOCIAL_MANAGEMENT
```json
{
  "id": "social-management",
  "tier": 3,
  "name": "Gestión de Redes Sociales",
  "problem": "No tiene presencia en redes o está abandonada",
  "estimatedValueUSD": [800, 2500],
  "requiredSignals": [
    "hasSocialLinks=false"
  ],
  "optionalSignals": [
    "industry=Wine/Beverages",
    "industry=Food Service",
    "industry=Retail",
    "industry=Tourism",
    "hasInstagram=false"
  ],
  "forbiddenSignals": [
    "hasSocialPresenceActive=true"
  ],
  "minEvidenceCount": 2,
  "industries": [
    "Wine/Beverages",
    "Food Service",
    "Retail",
    "Tourism",
    "Beauty"
  ],
  "vendorEvidence": [
    "Signals: no tiene redes activas",
    "Industria: {industry} es visual, Instagram es canal principal",
    "Impacto: clientes descubren en redes, vos no estás"
  ],
  "realCases": [
    "Pulenta Estate"
  ]
}
```

---

### TIER 4 — Optimización Técnica (Solo si NO hay TIER 1)

#### SEO_TECHNICAL_SCHEMA (CONSOLIDADO)
```json
{
  "id": "seo-technical-schema",
  "tier": 4,
  "name": "SEO Técnico + Schema",
  "problem": "Sitio tiene problemas técnicos que impiden ranking y rich results",
  "estimatedValueUSD": [1200, 2800],
  "requiredSignals": [
    "hasWebsite=true"
  ],
  "optionalSignals": [
    "hasMetaDescription=false",
    "hasSitemap=false",
    "hasCanonical=false",
    "h1Count=0 OR h1Count > 2",
    "hasSchema=false",
    "estimatedPageWeightKb > 500"
  ],
  "forbiddenSignals": [
    "isB2BPure=true"
  ],
  "minEvidenceCount": 3,
  "industries": [
    "Todas"
  ],
  "vendorEvidence": [
    "Signals: {count} problemas técnicos detectados",
    "Impacto: Google no puede indexar ni rankear correctamente",
    "Solución: meta descriptions + sitemap + schema + optimización"
  ],
  "realCases": [
    "Casa Vigil",
    "Norton",
    "Pulenta Estate"
  ]
}
```

#### HOSTINGGUARD
```json
{
  "id": "hostingguard",
  "tier": 4,
  "name": "Seguridad Web",
  "problem": "Sitio con problemas de seguridad (SSL, malware, vulnerabilidades)",
  "estimatedValueUSD": [500, 2000],
  "requiredSignals": [
    "httpsOk=false OR hasMalware=true OR hasSecurityVulnerability=true"
  ],
  "optionalSignals": [
    "hasEcommerce=true"
  ],
  "forbiddenSignals": [],
  "minEvidenceCount": 1,
  "industries": [
    "Todas"
  ],
  "vendorEvidence": [
    "Signals: {security_issue}",
    "Impacto: navegador advierte 'no seguro', mata conversión",
    "Solución: SSL válido + monitoreo + backups"
  ],
  "realCases": []
}
```

---

## JERARQUÍA TIER — Reglas de Activación

### TIER 1: Siempre mostrar si se activan

```
- ECOMMERCE
- ONLINE_BOOKING
- CRM_AUTOMATION
```

**Regla:** Si hay 1+ TIER 1, nunca mostrar TIER 4.

### TIER 2: Mostrar si TIER 1 vacío

```
- WEB_NEW
- WEB_REDESIGN
- LANDING_PAGES
```

**Regla:** Si no hay TIER 1, mostrar TIER 2.

### TIER 3: Mostrar siempre (ortogonal)

```
- GBP_SEO_LOCAL
- SOCIAL_MANAGEMENT
```

**Regla:** Mostrar en paralelo con TIER 1-2 (no conflictua).

### TIER 4: Mostrar solo si TIER 1 vacío

```
- SEO_TECHNICAL_SCHEMA
- HOSTINGGUARD
```

**Regla:** Solo si NO hay ninguna oportunidad TIER 1.

---

## STRUCTURE JSON (para consumo del motor)

```json
{
  "services": [
    {
      "id": "ecommerce",
      "tier": 1,
      "name": "Ecommerce",
      "estimatedValueUSD": {
        "min": 3000,
        "max": 8000
      },
      "requiredSignals": [
        {
          "signal": "hasEcommerce",
          "operator": "=",
          "value": false
        }
      ],
      "optionalSignals": [
        {
          "signal": "industry",
          "operator": "IN",
          "value": ["Wine/Beverages", "Food Service", "Retail", "Tourism"]
        },
        {
          "signal": "navContains",
          "operator": "MATCH",
          "value": ["TIENDA", "PRODUCTOS", "VENTA"]
        }
      ],
      "forbiddenSignals": [
        {
          "signal": "isB2BPure",
          "operator": "=",
          "value": true
        }
      ],
      "minEvidenceCount": 2,
      "activationRule": "requiredSignals AND (optionalSignals >= minEvidenceCount - requiredSignals.length)"
    },
    ...
  ],
  "tierHierarchy": {
    "TIER_1": ["ecommerce", "online-booking", "crm-automation"],
    "TIER_2": ["web-new", "web-redesign", "landing-pages"],
    "TIER_3": ["gbp-seo-local", "social-management"],
    "TIER_4": ["seo-technical-schema", "hostingguard"]
  },
  "displayRules": {
    "rule_1": "IF TIER_1.length > 0 THEN hide TIER_4",
    "rule_2": "IF TIER_1.length === 0 THEN show TIER_2",
    "rule_3": "ALWAYS show TIER_3",
    "rule_4": "IF TIER_1.length === 0 THEN show TIER_4"
  }
}
```

---

## CAMBIOS DESDE v1.0

| Problema | Solución |
|----------|----------|
| Mezclaba servicios | Consolidé: SEO Tech + Schema en 1 servicio TIER 4 |
| Inferencias imposibles | Eliminé: "80% de bodegas", "PyME pequeña" |
| Sin estructura máquina | Agregué: requiredSignals, optionalSignals, forbiddenSignals, minEvidenceCount |
| Sin jerarquía global | Agregué: TIER 1-4 con display rules |
| GBP + Local separados | Consolidé: GBP_SEO_LOCAL (mismo problema, mismo vendedor) |
| 12 servicios | 8 servicios consolidados (más vendibles) |
| Énfasis en "casos reales" | Eliminé inferencias, solo hechos verificables |

---

## PRÓXIMO PASO

Este catálogo es completamente determinístico:

✅ Sin inferencias  
✅ Sin knowledge externo  
✅ Sin IA en la activación  
✅ Solo signals verificables por Playwright  
✅ Estructura JSON ejecutable  
✅ Jerarquía TIER clara  

Cuando esté aprobado, crear `SERVICES_CATALOG_MACHINE.json` e implementar el Opportunity Engine que consume esta estructura.

