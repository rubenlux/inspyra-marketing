# ERP-011 — Operations / Finanzas

**Spec ID:** 12  
**Código:** ERP-011  
**Módulo:** Operations → Finanzas  
**Estado:** 🟡 DRAFT v1  
**Fecha:** 2026-05-31  
**Autor:** Inspyra Team  

---

## Objetivo del módulo

El módulo Finanzas centraliza el control económico, financiero, contable y de rentabilidad operativa de Inspyra.

Es el **sistema financiero central del ERP**.

Su propósito es permitir conocer con precisión absoluta el estado económico de la agencia en tiempo real.

---

## Las 14 preguntas que debe poder responder el módulo

| # | Pregunta |
|---|---|
| 1 | ¿Cuánto facturamos? |
| 2 | ¿Cuánto cobramos? |
| 3 | ¿Cuánto gastamos? |
| 4 | ¿Cuánto ganamos? |
| 5 | ¿Cuánto margen deja cada cliente? |
| 6 | ¿Cuánto margen deja cada servicio? |
| 7 | ¿Cuánto cuesta operar? |
| 8 | ¿Cuánto cuesta la IA? |
| 9 | ¿Cuánto cuesta la infraestructura? |
| 10 | ¿Cuánto revenue recurrente tenemos? |
| 11 | ¿Qué proyectamos facturar? |
| 12 | ¿Qué está vencido? |
| 13 | ¿Qué está pendiente de cobro? |
| 14 | ¿Dónde estamos perdiendo dinero? |

---

## Principio central

> **Cada movimiento económico debe quedar registrado.**

Nada económico puede quedar fuera del ERP. Todo ingreso o egreso debe existir dentro del sistema.

---

## Qué vive dentro del módulo

Todo evento económico de Inspyra:

- Ingresos y facturación emitida
- Cobros recibidos
- Pagos realizados
- Gastos operativos (infraestructura, IA, SaaS, sueldos, freelancers)
- Margen por cliente y por servicio
- MRR / ARR
- Flujo de caja
- Forecasting financiero
- Deudas y cobranza
- Rentabilidad por unidad de negocio
- Impuestos estimados
- Presupuestos internos

---

## Qué NO vive aquí

| ❌ No aquí | ✅ Dónde va |
|---|---|
| Ejecución de proyectos | Módulo Proyectos |
| Leads y prospectos | Módulo Prospectos |
| Campañas comerciales | Módulo Campañas |
| Tareas del equipo | Módulo Tareas |

El módulo Finanzas **consume** información de todos esos módulos — no la gestiona.

---

## Estructura interna del módulo

### Sección 1 — Dashboard Financiero General

Vista ejecutiva consolidada de toda la empresa.

| Métrica | Descripción |
|---|---|
| Revenue mensual | Facturación generada del mes en curso |
| Revenue anual | Facturación acumulada año calendario |
| MRR | Monthly Recurring Revenue |
| ARR | Annual Recurring Revenue |
| Cobrado este mes | Dinero efectivamente ingresado |
| Pendiente de cobro | Facturas emitidas aún no cobradas |
| Gastos este mes | Total egresos operativos |
| Beneficio neto | Profit real (ingresos − todos los costos) |
| Margen bruto | (Revenue − COGS) / Revenue |
| Margen neto | (Beneficio neto) / Revenue |
| Cash disponible | Dinero actual en caja/cuentas |
| Burn rate | Ritmo de gasto mensual |
| Runway estimado | Meses de operación disponibles según caja |

---

### Sección 2 — Ingresos

Todo dinero que entra a Inspyra.

#### Modelo de datos — Ingreso

##### Identificación

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Identificador único |
| `client_id` | uuid (FK Client) | Cliente asociado |
| `service_id` | uuid (FK Service) | Servicio asociado |
| `project_id` | uuid (FK Project) | Proyecto asociado (nullable) |
| `invoice_id` | uuid (FK Invoice) | Factura asociada |
| `unidad_negocio` | enum | inspyra / hostingguard / inspyra_cloud / inspyra_mail / email_mkt |

##### Económico

| Campo | Tipo | Descripción |
|---|---|---|
| `concepto` | enum | desarrollo_web / seo / mantenimiento / hosting / vps / cloud / branding / consultoria / software / email_mkt / ads / otro |
| `fecha_emision` | date | Fecha de emisión del ingreso |
| `fecha_cobro` | date | Fecha real de cobro (nullable) |
| `importe_bruto_usd` | decimal | Importe total antes de descuentos e impuestos |
| `descuentos_usd` | decimal | Descuentos aplicados |
| `impuestos_usd` | decimal | Impuestos aplicados |
| `importe_neto_usd` | decimal (calculado) | Importe bruto − descuentos + impuestos |
| `moneda_original` | string | Moneda de origen (USD, ARS, EUR…) |
| `tipo_cambio` | decimal | Tipo de cambio a USD al momento del cobro |
| `metodo_cobro` | enum | stripe / transferencia / efectivo / paypal / hostingguard / aws_reimbursement / otro |
| `estado` | enum | pendiente / emitido / cobrado / parcial / vencido / cancelado |

---

### Sección 3 — Gastos

Todo dinero que sale de Inspyra.

#### Modelo de datos — Gasto

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Identificador único |
| `categoria` | enum | aws / vps / openai / anthropic / dominio / saas / herramienta / licencia / diseno / freelancer / publicidad / meta_ads / google_ads / email / soporte / impuesto / administracion / otro |
| `proveedor` | string | Nombre del proveedor |
| `fecha` | date | Fecha del gasto |
| `importe_usd` | decimal | Importe en USD |
| `moneda_original` | string | Moneda de origen |
| `tipo_cambio` | decimal | Tipo de cambio aplicado |
| `periodicidad` | enum | unico / mensual / anual / variable |
| `client_id` | uuid (FK) | Cliente imputable (nullable) |
| `service_id` | uuid (FK) | Servicio imputable (nullable) |
| `project_id` | uuid (FK) | Proyecto imputable (nullable) |
| `unidad_negocio` | enum | inspyra / hostingguard / inspyra_cloud / inspyra_mail / email_mkt |
| `descripcion` | text | Descripción libre |
| `comprobante_url` | string | URL al comprobante / factura adjunta (nullable) |
| `created_at` | timestamp | — |

---

### Sección 4 — Costos IA (submódulo crítico)

**Todos los costos IA deben medirse con precisión absoluta.** Cada ejecución registra:

#### Modelo de datos — AIExecution (vinculado a ERP-010)

| Campo | Tipo | Descripción |
|---|---|---|
| `execution_id` | uuid | FK a `AgentExecution` de ERP-010 |
| `fecha` | timestamp | Fecha y hora de la ejecución |
| `agente` | string | Nombre del agente ejecutado |
| `client_id` | uuid (FK) | Cliente asociado (nullable) |
| `project_id` | uuid (FK) | Proyecto asociado (nullable) |
| `service_id` | uuid (FK) | Servicio asociado (nullable) |
| `modulo_origen` | string | Módulo del ERP que disparó la ejecución |
| `modelo` | string | Nombre del modelo LLM (ej: `claude-3-5-sonnet`) |
| `proveedor` | enum | anthropic / openai / gemini / mistral / otro |
| `tokens_input` | int | Tokens de entrada |
| `tokens_output` | int | Tokens de salida |
| `coste_input_usd` | decimal | Costo tokens input |
| `coste_output_usd` | decimal | Costo tokens output |
| `coste_total_usd` | decimal (calculado) | Suma de ambos |
| `coste_moneda_local` | decimal | Convertido a moneda local de operación |
| `duracion_ms` | int | Duración de la llamada en milisegundos |
| `exito` | boolean | Si la ejecución fue exitosa |
| `utilidad_estimada_usd` | decimal | Valor generado estimado (nullable) |
| `ahorro_tiempo_horas` | decimal | Horas humanas ahorradas (nullable) |
| `roi_estimado_pct` | decimal (calculado) | (utilidad − costo) / costo × 100 |

---

### Sección 5 — Rentabilidad por Cliente

Vista financiera individual de cada cliente.

| Métrica | Cálculo |
|---|---|
| Lifetime Revenue | SUM(ingresos cobrados) de toda la relación |
| MRR actual | SUM(`mrr_usd`) de servicios activos |
| Total facturado | SUM(importe_bruto) de facturas emitidas |
| Total cobrado | SUM(importe_neto) de ingresos con estado `cobrado` |
| Total pendiente | SUM(importe_neto) de ingresos con estado `pendiente` o `emitido` |
| Coste operativo | SUM(gastos imputados al cliente) |
| Coste IA | SUM(coste_total_usd) de ejecuciones vinculadas |
| Coste infraestructura | Gastos tipo `aws`/`vps` imputados |
| Margen bruto | (Revenue − COGS) / Revenue |
| Margen neto | (Revenue − todos los costos) / Revenue |
| LTV estimado | MRR × tiempo promedio de retención (meses) |
| CAC estimado | Costo de captación atribuido (Campañas + Comercial) |
| Payback estimado | CAC / MRR mensual |

---

### Sección 6 — Rentabilidad por Servicio / Línea de Negocio

Para cada categoría de servicio (SEO, Web, Hosting, Cloud, Software, Ads, Email Marketing):

| Métrica | Descripción |
|---|---|
| Revenue generado | Total facturado por esta categoría |
| Coste asociado | Gastos imputados a esta línea |
| Margen | (Revenue − Coste) / Revenue |
| Ticket promedio | Revenue / cantidad de servicios |
| Tasa de renovación | Servicios renovados / servicios vencidos |
| Churn mensual | Servicios cancelados / servicios activos |

---

### Sección 7 — Facturación

Gestión documental de facturas emitidas.

#### Modelo de datos — Invoice

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `numero_factura` | string | Número correlativo (ej: INS-2026-0001) |
| `client_id` | uuid (FK) | Cliente facturado |
| `service_ids` | uuid[] | Servicios incluidos |
| `fecha_emision` | date | Fecha de emisión |
| `fecha_vencimiento` | date | Fecha límite de pago |
| `subtotal_usd` | decimal | Base imponible |
| `impuestos_usd` | decimal | Impuestos aplicados |
| `total_usd` | decimal | Total facturado |
| `estado` | enum | borrador / emitida / enviada / cobrada / vencida / anulada |
| `pdf_url` | string | URL al PDF generado (nullable) |
| `payment_id` | uuid (FK) | Pago asociado cuando se cobra (nullable) |
| `notas` | text | Observaciones internas |

---

### Sección 8 — Cobranza

Seguimiento activo de pagos.

| Vista | Descripción |
|---|---|
| Facturas pendientes | Estado `emitida` o `enviada` aún no cobradas |
| Facturas vencidas | Estado `vencida` con días de atraso |
| Recordatorios enviados | Historial de comunicaciones de cobro |
| Clientes morosos | Clientes con facturas vencidas > 30 días |
| Importe total pendiente | SUM de todo lo por cobrar |
| Aging de deuda | Distribución por antiguedad (0-30 / 31-60 / 61-90 / +90 días) |

---

### Sección 9 — Forecast Financiero

Proyección automática basada en datos reales:

| Proyección | Fuente |
|---|---|
| Revenue esperado mensual | Renovaciones confirmadas + nuevos deals en Pipeline |
| Revenue trimestral | Suma de proyecciones mensuales |
| Revenue anual | Proyección de 12 meses |
| MRR esperado | MRR actual ± renovaciones ± churn estimado |
| Egresos esperados | Gastos recurrentes ya registrados + variables estimados |
| Margen esperado | (Revenue proyectado − Egresos proyectados) / Revenue |

---

### Sección 10 — Multi-Unidad de Negocio

Separación financiera por empresa operativa.

| Unidad | Descripción |
|---|---|
| **Inspyra** | Agencia digital — servicios web, SEO, ads, branding, software |
| **HostingGuard** | Managed hosting — servidores, VPS, dominios |
| **Inspyra Cloud** | Cloud infra — AWS workloads para clientes |
| **Inspyra Mail** | Email profesional — mailboxes, dominios |
| **Inspyra Email Marketing** | Campañas masivas — automatizaciones, newsletters |

Cada unidad tiene su propio P&L. La vista consolidada suma todas.

---

## KPIs del módulo (siempre visibles)

| KPI | Cálculo | Alerta |
|---|---|---|
| Revenue hoy | SUM ingresos cobrados fecha=hoy | — |
| Revenue mes | SUM ingresos cobrados mes actual | vs mes anterior |
| MRR | SUM mrr_usd servicios activos | si cae > 5% |
| ARR | MRR × 12 | — |
| Cobrado | SUM cobros recibidos mes | — |
| Pendiente de cobro | SUM facturas emitidas no cobradas | si > 20% del MRR |
| Gastos mes | SUM gastos del mes | vs presupuesto |
| Profit neto | Revenue − Gastos | si margen < 30% |
| Margen % | Profit / Revenue × 100 | umbral configurable |
| Coste IA mes | SUM coste_total_usd ejecuciones IA del mes | si > $X configurado |
| Coste AWS mes | SUM gastos categoría `aws` | — |
| Coste VPS mes | SUM gastos categoría `vps` | — |
| Coste SaaS mes | SUM gastos categoría `saas` | — |
| Top cliente por revenue | Primer lugar ranking MRR | — |
| Top servicio por rentabilidad | Mayor margen neto | — |
| Cliente menos rentable | Menor margen neto con > 3 meses | — |

---

## Bots y automatizaciones

| Bot | Trigger | Acción |
|---|---|---|
| **Billing Bot** | `fecha_renovacion` de un servicio alcanzada | Genera factura automáticamente con datos del servicio |
| **Payment Reminder Bot** | 7 días antes del vencimiento | Notifica al account manager + envía recordatorio al cliente |
| **Overdue Collector Bot** | Factura lleva > 7 días vencida | Escala al director + registra intento de cobro en el log |
| **AI Cost Tracker** | Cada ejecución IA en cualquier módulo | Registra costo en `AIExecution` + actualiza dashboard |
| **Margin Alert Bot** | Margen de cliente cae por debajo del umbral | Alerta al director con desglose de costos |
| **Cashflow Predictor Bot** | Ejecución semanal | Proyecta caja a 30/60/90 días |
| **Expense Classifier Bot** | Nuevo gasto ingresado sin categoría | Clasifica automáticamente por descripción y proveedor |
| **Revenue Forecast Bot** | Ejecución mensual (día 1) | Genera proyección basada en renovaciones + pipeline |
| **Profitability Analyzer Bot** | Ejecución mensual | Detecta líneas más rentables y con mayor potencial |

---

## Capacidades IA del módulo

| Función IA | Descripción |
|---|---|
| **Resumen financiero ejecutivo** | Estado en 5 líneas: revenue, margen, riesgos, oportunidades |
| **Análisis de rentabilidad por cliente** | Qué clientes generan más profit real vs los que más cuestan |
| **Análisis de coste IA** | Cuánto gastamos por proveedor, agente y módulo este mes |
| **Detección de costos anómalos** | Gasto inusualmente alto en cualquier categoría |
| **Forecast inteligente** | Proyección de MRR con confianza basada en histórico |
| **Análisis de churn financiero** | Cuánto revenue en riesgo por señales de cancelación |
| **Recomendación de línea a escalar** | Qué servicio / unidad tiene mejor ratio margen-crecimiento |
| **Respuesta a lenguaje natural** | Consulta libre: "¿Cuánto gastamos en OpenAI en abril?" |

Toda ejecución IA debe registrar métricas de coste según `01-constitution-v1.md §7`.

---

## Relaciones con otros módulos

| Módulo | Relación |
|---|---|
| **Clientes** | Cada ingreso pertenece a un cliente |
| **Servicios** | Cada ingreso está vinculado a un servicio activo |
| **Proyectos** | Gastos imputables a proyectos específicos |
| **Pipeline** | Deals ganados disparan factura/ingreso |
| **HostingGuard** | Ingresos por hosting + costos de infraestructura servidores |
| **Laboratorio IA** | Todos los costos de ejecución IA se consolidan aquí |
| **Tickets** | Costos de soporte imputables a cliente / servicio |

---

## Reglas críticas de negocio

### Regla 1 — Todo ingreso debe registrarse
Ningún cobro puede existir fuera del ERP. Sin registro → sin existencia financiera.

### Regla 2 — Todo gasto debe registrarse
Ningún egreso puede quedar sin registrar. Los gastos sin registrar rompen la rentabilidad calculada.

### Regla 3 — Todo gasto IA debe medirse
Cada ejecución LLM genera un registro en `AIExecution` con costo real en USD. Sin excepción.

### Regla 4 — Todo gasto de infraestructura debe imputarse
AWS, VPS, dominios deben asignarse a una unidad de negocio. Si no corresponde a un cliente concreto, se imputa a Inspyra general.

### Regla 5 — Toda factura debe rastrearse hasta el cliente
La cadena `Invoice → Ingreso → Client` no puede romperse en ningún punto.

### Regla 6 — Toda rentabilidad debe poder explicarse matemáticamente
No existe "estimamos un margen de X%" sin los datos detrás. Todo margen tiene su cálculo explícito.

### Regla 7 — Nada financiero puede depender de memoria humana
Si está en la cabeza de alguien y no en el ERP, no es real.

---

## Criterios de aceptación (DoD)

Para que esta spec se considere implementada:

- [ ] Dashboard financiero general con los 13 KPIs en tiempo real
- [ ] CRUD completo de Ingresos con validaciones de campos obligatorios
- [ ] CRUD completo de Gastos con clasificación por categoría y unidad de negocio
- [ ] Registro automático de cada ejecución IA con coste en USD (`AIExecution`)
- [ ] Vista de rentabilidad por cliente con todos los KPIs del §5
- [ ] Vista de rentabilidad por línea de servicio con margen y churn
- [ ] Módulo de Facturación con numeración correlativa y exportación PDF
- [ ] Módulo de Cobranza con aging de deuda y estado por factura
- [ ] Forecast financiero a 30/60/90 días
- [ ] Separación financiera por unidad de negocio + vista consolidada
- [ ] Billing Bot genera factura automática al renovar servicio
- [ ] Payment Reminder Bot 7 días antes del vencimiento
- [ ] Margin Alert Bot con umbral configurable por cliente y por línea
- [ ] AI Cost Tracker registra todas las ejecuciones sin excepción
- [ ] Cashflow Predictor Bot con ejecución semanal
- [ ] KPIs siempre visibles en top bar del módulo
- [ ] Consulta IA en lenguaje natural sobre datos financieros
- [ ] Exportar ingresos, gastos y facturas a CSV
- [ ] Historial de cambios de estado en facturas (auditoría)
- [ ] Tests unitarios ≥ 85% en servicios de cálculo de rentabilidad

---

## Próximos pasos

1. Aprobar esta spec
2. Crear `13-erp-012-operations-tickets.md`
3. Definir schema Prisma: `Income`, `Expense`, `Invoice`, `AIExecution`, `Payment`
4. Diseñar endpoints REST: `/api/finances/`, `/api/finances/invoices`, `/api/finances/ai-costs`
5. Definir evento `deal.won` → trigger Billing Bot para primera factura
6. Especificar integración con Stripe para cobros automáticos
