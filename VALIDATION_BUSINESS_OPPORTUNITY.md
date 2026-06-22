# Validación del Business Opportunity Engine

## Objetivo
Validar que el nuevo motor de análisis de oportunidades comerciales:
1. No pone SEO como oportunidad principal
2. Prioriza canales de ingresos directos
3. Respeta TIER de priorización
4. Salida centrada en negocio, no problemas técnicos

---

## Caso 1: Bodega sin Ecommerce

**Input:**
```json
{
  "empresa": "Bodegas Mendoza",
  "rubro": "Distribuidor de vinos y bebidas",
  "website": "bodegas-mendoza.com.ar",
  "googleMapsData": {
    "rating": 4.8,
    "reviews": 120,
    "phone": "+54 261 555 1234",
    "address": "Luján de Cuyo, Mendoza"
  },
  "websiteAudit": {
    "auditScore": 65,
    "hallazgos": { "seo": { "score": 55 } }
  },
  "contactData": {
    "type": "business_owner",
    "source": "google_maps"
  }
}
```

**Análisis esperado:**

✓ **businessModel:** ["Venta de productos", "Distribuidor"]
✓ **revenueOpportunities:** ["No vende online", "No captura contactos de zonas alejadas", "No automatiza pedidos"]
✓ **topServices:** ["Ecommerce Setup", "Captura de Leads (Formulario + CRM)", "Setup CRM"]
✗ **NO debe incluir:** "SEO Local" como principal (aunque sería secundario)
✓ **estimatedTicket:** 120000-150000

**Validación:**
- [ ] SEO NO aparece como #1 (esperar: Ecommerce #1)
- [ ] Prioriza ingresos directos (Ecommerce antes que visibilidad)

---

## Caso 2: Restaurante sin Reservas Online

**Input:**
```json
{
  "empresa": "El Chulito",
  "rubro": "Restaurante",
  "website": "elchulito.com.ar",
  "googleMapsData": {
    "rating": 4.6,
    "reviews": 340,
    "address": "Centro, CABA",
    "types": ["restaurant"]
  },
  "websiteAudit": {
    "auditScore": 55,
    "hallazgos": {
      "seo": { "score": 45, "issues": ["Sin Schema para restaurant"] },
      "frontend": { "score": 70 }
    }
  },
  "contactData": { "type": "restaurant_manager" }
}
```

**Análisis esperado:**

✓ **businessModel:** ["Restaurante", "Venta de servicios de comida"]
✓ **revenueOpportunities:** ["No tiene reservas online", "No capta grupos/eventos", "No vende gift cards"]
✓ **topServices:** ["Sistema de Reservas Online", "Captura de Leads (Grupos/Eventos)", "Email Marketing"]
✗ **NO debe incluir:** "SEO Schema" como principal
✓ **reasoning:** "Sin reservas online, pierde 30-40% de clientes potenciales. Setup CRM para eventos corporativos"

**Validación:**
- [ ] Reservas está en posición #1 (no SEO Schema)
- [ ] Reconoce modelo: restaurante
- [ ] Sale centrado en INGRESOS (reservas perdidas) no técnica (sin Schema)

---

## Caso 3: Salón de Belleza sin Automatización

**Input:**
```json
{
  "empresa": "Beauty Studio Aurora",
  "rubro": "Salón de belleza y estética",
  "website": "beautystudioaurora.com.ar",
  "googleMapsData": {
    "rating": 4.9,
    "reviews": 280,
    "phone": "+54 11 4567 8901",
    "types": ["beauty_salon"]
  },
  "websiteAudit": {
    "auditScore": 62,
    "hallazgos": {
      "seo": { "score": 58 },
      "performance": { "score": 60 }
    }
  },
  "contactData": { "type": "salon_owner" }
}
```

**Análisis esperado:**

✓ **businessModel:** ["Servicios de belleza", "Estética personal"]
✓ **revenueOpportunities:** ["No automatiza citas", "No tiene CRM", "No hace follow-up con clientes", "Sin fidelización"]
✓ **topServices:** ["Sistema de Reservas Online", "Setup CRM", "Email Marketing y Automatización"]
✗ **SEO no aparece en top 3**
✓ **summary:** "Pierde clientes por falta de citas online. CRM + Email para retención = +60% lifetime value"

**Validación:**
- [ ] Reservas #1, no visibilidad (ya tiene buena reputación)
- [ ] CRM está prioritario (retención > adquisición)
- [ ] Ticket estimado: 80000-100000 (menor que bodega)

---

## Caso 4: Inmobiliaria sin Lead Capture

**Input:**
```json
{
  "empresa": "Propiedades del Sur",
  "rubro": "Inmobiliaria / Broker de propiedades",
  "website": "propiedadesdelsur.com.ar",
  "googleMapsData": {
    "rating": 4.3,
    "reviews": 95,
    "address": "La Plata, Buenos Aires"
  },
  "websiteAudit": {
    "auditScore": 72,
    "hallazgos": {
      "seo": { "score": 70, "issues": ["Sin Schema para propiedades"] },
      "arquitectura": { "cms": "WordPress" }
    }
  },
  "contactData": { "type": "real_estate_agent" }
}
```

**Análisis esperado:**

✓ **businessModel:** ["Servicios inmobiliarios", "Broker"]
✓ **revenueOpportunities:** ["No captura leads de interesados", "Sin formulario de contacto efectivo", "No automatiza seguimiento de clientes"]
✓ **topServices:** ["Captura de Leads (Formulario + CRM)", "Landing Page de Conversión", "Setup CRM", "Email Marketing"]
✗ **SEO Schema es secundario, no principal**
✓ **estimatedTicket:** 100000-120000

**Validación:**
- [ ] Leads #1 (TIER 2 pero prioritario porque afecta ingresos)
- [ ] CRM #2 (automatizar seguimiento = cierres)
- [ ] SEO Schema NO aparece en top 3
- [ ] Summary menciona "pipeline de ventas", no "problemas técnicos"

---

## Caso 5: Consultora sin Web

**Input:**
```json
{
  "empresa": "Tech Consulting Solutions",
  "rubro": "Consultoría empresarial / TI",
  "website": null,
  "googleMapsData": null,
  "websiteAudit": null,
  "contactData": {
    "type": "consultant",
    "source": "google_maps_search",
    "notes": "No tiene web propia"
  }
}
```

**Análisis esperado:**

✓ **businessModel:** ["Servicios de consultoría", "B2B"]
✓ **revenueOpportunities:** ["Sin presencia web", "No captura leads inbound", "No posiciona expertise"]
✓ **topServices:** ["Sitio Web Nuevo", "Captura de Leads (Formulario + CRM)", "Landing Page de Conversión"]
✗ **NO:** "SEO Local" como principal (sin web no tiene sentido SEO)
✓ **estimatedTicket:** 150000-200000

**Validación:**
- [ ] Web #1 (prerequisito para todo lo demás)
- [ ] Leads #2 (capturar consultas)
- [ ] CRM #3 (gestionar pipeline)
- [ ] Razonamiento es "sin presencia web pierden credibilidad y oportunidades", no técnico

---

## Matriz de Validación

| Caso | SEO como #1? | Sí/No | Ingresos directa prioritaria? | Sí/No | TIER respetado? | Sí/No | Centrado en negocio? | Sí/No |
|------|-------------|-------|-------------------------------|-------|-----------------|-------|----------------------|-------|
| 1. Bodega | ✗ Espera NO | [ ] | ✓ Espera Ecommerce | [ ] | ✓ TIER 1 | [ ] | ✓ Canales perdidos | [ ] |
| 2. Restaurante | ✗ Espera NO | [ ] | ✓ Espera Reservas | [ ] | ✓ TIER 1 | [ ] | ✓ Ingresos perdidos | [ ] |
| 3. Salón | ✗ Espera NO | [ ] | ✓ Espera Reservas | [ ] | ✓ TIER 1 | [ ] | ✓ Retención+CRM | [ ] |
| 4. Inmobiliaria | ✗ Espera NO | [ ] | ✓ Espera Leads | [ ] | ✓ TIER 2 | [ ] | ✓ Pipeline venta | [ ] |
| 5. Consultora | ✗ Espera NO | [ ] | ✓ Espera Web+Leads | [ ] | ✓ TIER 2 | [ ] | ✓ Presencia+credibilidad | [ ] |

---

## Indicadores Clave de Éxito

**Si el motor funciona correctamente, deberías ver:**

1. **SEO aparece MÁXIMO 1 vez en top 4 servicios** (y cuando aparece, es porque no hay ingresos directa)
2. **TIER 1 servicios ocupan posiciones 1-2** cuando existen (Ecommerce, Reservas, CRM, Email)
3. **La "reasoning" menciona dinero/ingresos**, no problemas técnicos
4. **estimatedTicket varía según oportunidad**, no es siempre el mismo
5. **Summary es vendible al prospect**, no es un diagnóstico técnico

---

## Comportamiento a Evitar (Regresiones)

**❌ Si ves esto = el motor falló:**

1. "SEO Local" #1 en una bodega sin ecommerce
2. "SEO Schema" #1 en un restaurante sin reservas
3. "SEO Técnico" #1 en cualquier empresa
4. Summary que habla de "meta tags", "heading hierarchy", "problemas de crawl"
5. topServices con 3+ servicios de SEO
6. estimatedTicket idéntico en todos los casos (copy-paste)

---

## Próximos Pasos

1. Ejecutar `POST /research/business-opportunity` con estos 5 casos reales
2. Capturar response JSON
3. Verificar matriz de validación
4. Reportar fallidas (si las hay)
5. Iterar el prompt si es necesario
