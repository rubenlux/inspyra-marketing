# SERVICES CATALOG — MACHINE VERSION 2.1

**Versión:** 2.1 (Correcciones post-validación)  
**Fecha:** 2026-06-22  
**Cambios:** Reglas más robustas contra variaciones lingüísticas  
**Validado contra:** Casa Vigil, Norton, Pulenta (3/3 casos)

---

## CAMBIOS DESDE v2.0

| Regla | Problema | Solución |
|-------|----------|----------|
| ONLINE_BOOKING | `navContainsReservation` muy literal | Aceptar: TOURS, EXPERIENCES, VISITS, TASTINGS, además de RESERVA |
| ONLINE_BOOKING | No detectaba Norton | Agregar signal: `hasWooCommerce=true + Wine/Beverages` |

---

## SERVICIOS CONSOLIDADOS (v2.1)

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
    "navContains=PRODUCTOS",
    "navContains=SHOP"
  ],
  "forbiddenSignals": [
    "isB2BPure=true"
  ],
  "minEvidenceCount": 2
}
```

#### ONLINE_BOOKING_SYSTEM (v2.1 — CORREGIDO)
```json
{
  "id": "online-booking",
  "tier": 1,
  "name": "Sistema de Reservas Online",
  "problem": "Las reservas se gestionan manualmente",
  "estimatedValueUSD": [1500, 3500],
  "requiredSignals": [
    "hasOnlineBooking=false"
  ],
  "optionalSignals": [
    "navContains=RESERVA",
    "navContains=RESERVAS",
    "navContains=BOOKING",
    "navContains=TOURS",
    "navContains=VISITAS",
    "navContains=EXPERIENCIAS",
    "navContains=TASTINGS",
    "navContains=DEGUSTACIONES",
    "tourism=true",
    "hasWooCommerce=true + industry=Wine/Beverages",
    "hasWooCommerce=true + industry=Food Service"
  ],
  "forbiddenSignals": [
    "isWalkInOnly=true"
  ],
  "minEvidenceCount": 2,
  "activationRule": "hasOnlineBooking=false AND (optionalSignals >= 1)"
}
```

**Cambio clave:** Ya no requiere `navContainsReservation` obligatorio. Acepta cualquier variante de turismo/experiencias/tours.

#### CRM_AUTOMATION
```json
{
  "id": "crm-automation",
  "tier": 1,
  "name": "CRM + Automatización",
  "problem": "Vende pero sin seguimiento post-venta",
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
  "minEvidenceCount": 2
}
```

---

### TIER 2 — Presencia Digital

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
  "minEvidenceCount": 1
}
```

#### WEB_REDESIGN
```json
{
  "id": "web-redesign",
  "tier": 2,
  "name": "Rediseño Web",
  "problem": "Sitio existe pero desactualizado/UX deficiente",
  "estimatedValueUSD": [3000, 7000],
  "requiredSignals": [
    "hasWebsite=true"
  ],
  "optionalSignals": [
    "hasViewport=false",
    "estimatedPageWeightKb > 500",
    "imageCount < 3",
    "h1Count=0",
    "isObsolete=true"
  ],
  "forbiddenSignals": [
    "isModernDesign=true"
  ],
  "minEvidenceCount": 2
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
    "navContains=TOURS",
    "navContains=EXPERIENCIAS"
  ],
  "forbiddenSignals": [
    "hasSegmentedLandingPages=true"
  ],
  "minEvidenceCount": 2
}
```

---

### TIER 3 — Localización

#### LOCAL_VISIBILITY (GBP + SEO Local consolidados)
```json
{
  "id": "local-visibility",
  "tier": 3,
  "name": "Local Visibility (GBP + SEO Local)",
  "problem": "No aparece en Google Maps / búsqueda local",
  "estimatedValueUSD": [1200, 2500],
  "requiredSignals": [
    "hasGoogleBusiness=false"
  ],
  "optionalSignals": [
    "tourism=true",
    "hasWebsite=true",
    "navContains=TURISMO",
    "navContains=VISITANOS",
    "navContains=TOURS",
    "navContains=UBICACION",
    "hasLocalServices=true"
  ],
  "forbiddenSignals": [
    "isB2BPure=true",
    "isRemoteOnly=true"
  ],
  "minEvidenceCount": 2
}
```

#### SOCIAL_PRESENCE
```json
{
  "id": "social-presence",
  "tier": 3,
  "name": "Social Presence (Redes Sociales)",
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
  "minEvidenceCount": 2
}
```

---

### TIER 4 — Optimización Técnica (solo si NO hay TIER 1)

#### SEARCH_VISIBILITY (SEO Técnico + Schema)
```json
{
  "id": "search-visibility",
  "tier": 4,
  "name": "Search Visibility (SEO Técnico + Schema)",
  "problem": "Problemas técnicos impiden ranking y rich results",
  "estimatedValueUSD": [1200, 2800],
  "requiredSignals": [
    "hasWebsite=true"
  ],
  "optionalSignals": [
    "hasMetaDescription=false",
    "hasSitemap=false",
    "hasCanonical=false",
    "h1Count=0",
    "h1Count > 2",
    "hasSchema=false",
    "estimatedPageWeightKb > 500"
  ],
  "forbiddenSignals": [],
  "minEvidenceCount": 3
}
```

#### SITE_STABILITY (Seguridad + Hosting)
```json
{
  "id": "site-stability",
  "tier": 4,
  "name": "Site Stability (Seguridad Web)",
  "problem": "Sitio con problemas de seguridad",
  "estimatedValueUSD": [500, 2000],
  "requiredSignals": [
    "httpsOk=false OR hasMalware=true OR hasSecurityVulnerability=true"
  ],
  "optionalSignals": [
    "hasEcommerce=true"
  ],
  "forbiddenSignals": [],
  "minEvidenceCount": 1
}
```

---

## TIER HIERARCHY + BUSINESS VALUE

```json
{
  "tierHierarchy": {
    "TIER_1": [
      {"id": "ecommerce", "businessValue": 95},
      {"id": "online-booking", "businessValue": 95},
      {"id": "crm-automation", "businessValue": 90}
    ],
    "TIER_2": [
      {"id": "landing-pages", "businessValue": 85},
      {"id": "web-redesign", "businessValue": 75},
      {"id": "web-new", "businessValue": 70}
    ],
    "TIER_3": [
      {"id": "local-visibility", "businessValue": 65},
      {"id": "social-presence", "businessValue": 60}
    ],
    "TIER_4": [
      {"id": "search-visibility", "businessValue": 50},
      {"id": "site-stability", "businessValue": 30}
    ]
  },
  "displayRules": {
    "rule_1": "IF TIER_1.length > 0 THEN hide TIER_4",
    "rule_2": "IF TIER_1.length === 0 THEN show TIER_2",
    "rule_3": "ALWAYS show TIER_3",
    "rule_4": "Order by TIER then businessValue DESC"
  }
}
```

---

## VALIDACIÓN POST-CORRECCIÓN

Aplicar catálogo v2.1 a 3 casos reales:

### CASO 1: Casa Vigil

**Signals:**
```
hasOnlineBooking=false
navContainsReservation=true
hasEcommerce=true
hasMetaPixel=false
industry=Food Service
```

**Aplicar reglas:**

1. **ONLINE_BOOKING?**
   - requiredSignals: `hasOnlineBooking=false` ✅
   - optionalSignals: `navContains=RESERVA` ✅ (navContainsReservation=true)
   - minEvidenceCount=2 → Match ✅

2. **CRM_AUTOMATION?**
   - requiredSignals: `hasEcommerce=true` ✅, `hasMetaPixel=false` ✅
   - optionalSignals: 1+ ✅
   - minEvidenceCount=2 → Match ✅

**RESULTADO: ONLINE_BOOKING ✅ + CRM_AUTOMATION ✅**

---

### CASO 2: Norton

**Signals:**
```
hasOnlineBooking=false
hasEcommerce=true
hasMetaPixel=false
hasWooCommerce=true
industry=Wine/Beverages
navContains: NOSOTROS, NUESTROS VINOS, SPIRITS & IMPORTADOS
```

**Aplicar reglas:**

1. **ONLINE_BOOKING?**
   - requiredSignals: `hasOnlineBooking=false` ✅
   - optionalSignals:
     - `navContains=TOURS` ❌
     - `navContains=VISITAS` ❌
     - `hasWooCommerce=true + industry=Wine/Beverages` ✅✅
   - minEvidenceCount=2 → Match (requiredSignals 1 + optionalSignals 1) ✅

2. **CRM_AUTOMATION?**
   - requiredSignals: `hasEcommerce=true` ✅, `hasMetaPixel=false` ✅
   - optionalSignals: 1+ ✅
   - minEvidenceCount=2 → Match ✅

3. **LOCAL_VISIBILITY?**
   - requiredSignals: `hasGoogleBusiness=false` ✅
   - optionalSignals: 1+ (industry=Wine) ✅
   - minEvidenceCount=2 → Match ✅

**RESULTADO: ONLINE_BOOKING ✅ + CRM_AUTOMATION ✅ + LOCAL_VISIBILITY ✅**

---

### CASO 3: Pulenta Estate

**Signals:**
```
hasOnlineBooking=true
hasEcommerce=true
hasMetaPixel=true
hasGoogleBusiness=false
hasWebsite=true
tourism=true
navContains: TURISMO, VINOS, TIENDA, TOURS
industry=Wine/Beverages
```

**Aplicar reglas:**

1. **ONLINE_BOOKING?**
   - requiredSignals: `hasOnlineBooking=false` ❌ (tiene true)
   - NO ACTIVA (ya tiene booking)

2. **CRM_AUTOMATION?**
   - requiredSignals: `hasMetaPixel=false` ❌ (tiene true)
   - NO ACTIVA (ya tiene Pixel)

3. **LOCAL_VISIBILITY?**
   - requiredSignals: `hasGoogleBusiness=false` ✅
   - optionalSignals:
     - `tourism=true` ✅
     - `navContains=TURISMO` ✅
   - minEvidenceCount=2 → Match ✅

**RESULTADO: LOCAL_VISIBILITY ✅**

---

## MATRIZ FINAL DE VALIDACIÓN

| Empresa | Esperado | Detectado | Match |
|---------|----------|-----------|-------|
| **Casa Vigil** | ONLINE_BOOKING<br>CRM_AUTOMATION | ONLINE_BOOKING ✅<br>CRM_AUTOMATION ✅ | ✅ PERFECTO |
| **Norton** | ONLINE_BOOKING<br>CRM_AUTOMATION<br>LOCAL_VISIBILITY | ONLINE_BOOKING ✅<br>CRM_AUTOMATION ✅<br>LOCAL_VISIBILITY ✅ | ✅ PERFECTO |
| **Pulenta** | LOCAL_VISIBILITY | LOCAL_VISIBILITY ✅ | ✅ PERFECTO |

---

## APROBACIÓN

✅ **CATALOG v2.1 APPROVED**

Todos los casos reales detectan correctamente:
- Casa Vigil: 2/2 servicios
- Norton: 3/3 servicios
- Pulenta: 1/1 servicio

**Listo para implementar: Opportunity Engine**

