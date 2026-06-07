# 04 — Reglas Comerciales

---

## Principio general de outreach

El objetivo del primer contacto es **generar conversación**, no cerrar una venta.

Las empresas contactadas no están esperando ser contactadas. El outreach es frío o semi-cálido en todos los casos. El enfoque debe ser:

1. Demostrar que entendemos su negocio
2. Señalar una oportunidad específica que están perdiendo
3. Invitar a continuar la conversación

**No es** una presentación de la agencia. **No es** una lista de servicios. **No es** una oferta de precio.

---

## Reglas por mercado

### LATAM (incluyendo Argentina)

| Regla | Detalle |
|---|---|
| Tono | Cálido, cercano, no corporativo |
| CTA | Suave — "¿Te interesa que lo conversemos?" no "Agendemos una llamada" |
| Precio | Evitar mencionar precios en primer contacto. Si se mencionan, usar rangos. |
| Paquetes | Esencial / Crecimiento / Completo — accesibles, con opciones |
| Idioma | Español. Argentina: vos tuteo. Resto LATAM: tú o neutro según el país. |
| Urgencia | No crear urgencia artificial. No "oferta por tiempo limitado". |

### USA / Canadá / Europe

| Regla | Detalle |
|---|---|
| Tono | Directo, profesional, orientado a ROI |
| CTA | Puede ser más directo — "Let's set up a quick call" es aceptable |
| Precio | Puede mencionarse en segunda interacción. Primero: valor, luego precio. |
| Paquetes | Misma estructura 3 tiers pero con pricing USD premium |
| Idioma | English. Traducción fiel al tono del mercado, no literal del español. |
| Urgencia | "You're losing X customers per month" es válido si hay evidencia. |

---

## Reglas de outreach para TODOS los mercados

### Prohibiciones absolutas

- **NO** pedir una llamada en el primer mensaje
- **NO** vender agresivamente ("Somos la mejor agencia...", "Garantizamos X")
- **NO** usar lenguaje de spam ("Oferta exclusiva", "¡No te lo pierdas!")
- **NO** pedir branding, logos o información extensa al inicio
- **NO** enviar propuestas de precio sin contexto previo
- **NO** mencionar la agencia antes de hablar del cliente

### Obligaciones

- **SÍ** personalizar cada mensaje con datos reales del prospecto
- **SÍ** mencionar algo específico del negocio del prospecto (web, IG, problema detectado)
- **SÍ** señalar UNA oportunidad concreta, no un listado de problemas
- **SÍ** terminar con una pregunta abierta o CTA de baja fricción
- **SÍ** ser breve — el mensaje debe poder leerse en 30 segundos

---

## Regla LATAM/ARG — nunca mostrar inversión anual total

Para prospectos ARGENTINA y LATAM: **nunca mostrar el total anual de la inversión**. Solo mensual o setup. El total anual genera rechazo inmediato.

Para USA/CANADA/EUROPE: mostrar el total anual es válido y esperado.

Esto está codificado en `MARKET_CONFIG.avoidAnnualTotal` del Proposal Agent.

---

## Rangos de pricing por mercado (configurados en Proposal Agent)

Estos rangos son los que usa el agente para generar propuestas. Son orientativos — el catálogo de servicios puede sobreescribirlos.

| Mercado | Esencial | Crecimiento | Completo |
|---|---|---|---|
| ARGENTINA | USD 300–600 (setup) | USD 600–1.200 setup + desde USD 150/mes | USD 1.200–2.500 setup + desde USD 300/mes |
| LATAM | USD 400–800 | USD 800–1.800 | USD 1.800–3.500 |
| USA | USD 1.500–3.000 | USD 3.000–6.000 | USD 6.000–15.000+ |
| CANADA | CAD 1.500–3.000 | CAD 3.000–6.000 | CAD 6.000–15.000+ |
| EUROPE | EUR 1.200–2.500 | EUR 2.500–5.000 | EUR 5.000–12.000+ |

Fuente: `proposals.service.ts` → `MARKET_CONFIG`.

---

## Perfiles de industria (INDUSTRY_CONFIG)

El Proposal Agent adapta tono y foco según el rubro del prospecto. Perfiles definidos:

| Industria | Focos principales | Tono |
|---|---|---|
| DENTAL | Confianza de pacientes, reputación, visibilidad local | Profesional y empático |
| WINERY | Marca, enoturismo digital, ventas directas, premium | Sofisticado |
| REAL_ESTATE | Captación de propietarios, consultas, WhatsApp | Directo y orientado a resultados |
| LEGAL | Credibilidad, captación, reputación | Formal y confiable |
| RETAIL | Tráfico web, conversión, ventas online | Dinámico |
| MEDICAL | Confianza de pacientes, visibilidad local | Profesional y empático |
| HOSPITALITY | Reservas directas, reputación, buscadores | Cálido |
| GENERIC | Presencia digital, visibilidad, captación | Consultivo |

La detección es automática basada en regex del campo `rubro` del prospecto.

---

## Detección de idioma de comunicación

El Proposal Agent detecta `communicationLanguage` en el siguiente orden:

1. Si `prospect.communicationLanguage` ya está setteado → usar ese valor
2. TLD del website (`.fr` → FR, `.de`/`.at` → DE, `.com.br`/`.br` → PT)
3. País/ciudad del prospecto
4. Fallback: ES (español)

Si se detecta automáticamente, se persiste en `Prospect.communicationLanguage` para futuras referencias.

---

## Estructura de paquetes de servicios

Cuando se menciona pricing, usar siempre la estructura de 3 tiers:

| Tier | Nombre | Posicionamiento |
|---|---|---|
| Básico | Esencial | Punto de entrada, menor fricción |
| Medio | Crecimiento | El más recomendado, mejor relación valor/precio |
| Alto | Completo | Para empresas con presupuesto y ambición |

Nunca presentar solo un precio. La comparación de opciones aumenta conversión y justifica el tier recomendado.

---

## Canales de outreach (en orden de efectividad para LATAM)

1. WhatsApp (tasa de apertura ~95%, respuesta en horas)
2. Instagram DM (si el prospecto es activo en IG)
3. LinkedIn (para empresas B2B o profesionales)
4. Email (menor tasa de apertura, más formal)
5. Facebook (solo si tienen página activa)

El canal se selecciona según el perfil digital del prospecto detectado en la fase de enrichment.

---

## Qué hace que un prospecto sea "listo para outreach"

El estado `LISTO_OUTREACH` indica:
- La oportunidad fue detectada y aprobada por el Opportunity Agent
- El humano revisó y aprobó en la fase de validación
- El enriquecimiento fue completado y aprobado
- Existe una propuesta de outreach (Outreach Brief) generada y aprobada

Un prospecto no llega a outreach sin haber pasado por todas esas etapas.
