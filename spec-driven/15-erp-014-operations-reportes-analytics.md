# ERP-014 — Operations / Reportes & Analytics

**Spec ID:** 15  
**Código:** ERP-014  
**Módulo:** Operations → Reportes & Analytics  
**Estado:** 🟡 DRAFT v1  
**Fecha:** 2026-05-31  
**Autor:** Inspyra Team  

---

## Objetivo del módulo

El módulo Reportes & Analytics centraliza toda la visualización analítica, métricas, KPIs, reporting ejecutivo e inteligencia de negocio de Inspyra.

Es el **centro de observabilidad del ERP**.

Su objetivo es transformar todos los datos generados por la operación diaria en información accionable para toma de decisiones.

---

## Qué resuelve

| Sin Reportes | Con Reportes & Analytics |
|---|---|
| Decisiones a ciegas | Visión total del negocio en tiempo real |
| Difícil medir crecimiento | Métricas históricas con comparativa período |
| Imposible detectar cuellos de botella | Alertas automáticas por anomalías |
| Imposible comparar rendimiento entre áreas | Dashboards por módulo y por unidad de negocio |
| Exceso de intuición y poca data | Decisiones basadas en datos con forecasting |

---

## Principio central

> **Todo lo que ocurre dentro del ERP debe poder medirse.**

Toda acción genera información. Toda información puede convertirse en métrica. Toda métrica puede transformarse en decisión.

---

## Naturaleza del módulo

**Este módulo es una capa de lectura, análisis y visualización. No crea ni modifica datos operativos.**

Consume datos de todos los demás módulos via queries sobre las mismas tablas del ERP (no duplica datos). Cada cifra financiera debe coincidir con ERP-011 Finanzas como fuente de verdad.

---

## Estructura interna — 12 dashboards analíticos

---

### Dashboard 1 — Executive View (CEO)

Vista principal. Lo primero visible al entrar al ERP. Resumen ejecutivo consolidado de toda la empresa.

| Métrica | Fuente |
|---|---|
| Revenue total mes | ERP-011 Finanzas |
| Revenue anual | ERP-011 Finanzas |
| MRR | SUM mrr_usd servicios activos |
| ARR | MRR × 12 |
| Nuevos clientes mes | ERP-006 Clientes |
| Clientes activos | ERP-006 Clientes |
| Leads generados | ERP-001 Prospectos |
| Conversion rate comercial | Deals ganados / Leads totales |
| Pipeline value | SUM valor deals abiertos |
| Revenue proyectado | ERP-011 Forecast |
| Profit neto | ERP-011 Finanzas |
| Coste IA mensual | ERP-010 + ERP-011 AIExecution |
| Coste infraestructura | ERP-011 gastos categoría aws + vps |
| Coste SaaS | ERP-011 gastos categoría saas |
| Tickets abiertos | ERP-013 Tickets |
| Proyectos activos | ERP-008 Proyectos |
| Productividad general equipo | % tareas cerradas vs abiertas |

---

### Dashboard 2 — Comercial Analytics

| KPI | Cálculo | Fuente |
|---|---|---|
| Prospectos generados | COUNT prospectos período | ERP-001 |
| Leads inbound | COUNT canal inbound | ERP-001 |
| Leads outbound | COUNT canal outbound | ERP-001 |
| Conversión por fuente | Deals ganados / leads por canal | ERP-001 + ERP-004 |
| Reuniones agendadas | COUNT reuniones período | ERP-005 |
| Reuniones realizadas | COUNT estado `realizada` | ERP-005 |
| Propuestas enviadas | COUNT estado `propuesta_enviada` | ERP-004 |
| Cierres ganados | COUNT deals `ganado` | ERP-004 |
| Cierres perdidos | COUNT deals `perdido` | ERP-004 |
| Ratio de cierre % | Ganados / (Ganados + Perdidos) × 100 | ERP-004 |
| Ticket promedio venta | Revenue / cantidad de cierres | ERP-004 + ERP-011 |
| Tiempo promedio cierre | AVG días desde `prospecto` hasta `ganado` | ERP-001 + ERP-004 |
| Top canal captación | Canal con mayor conversión | ERP-001 |

---

### Dashboard 3 — Clientes Analytics

| KPI | Cálculo | Fuente |
|---|---|---|
| Clientes activos | COUNT estado activo | ERP-006 |
| Clientes nuevos | COUNT creados en período | ERP-006 |
| Clientes perdidos | COUNT con todos servicios cancelados | ERP-006 |
| Churn rate | Perdidos / Total inicio período × 100 | ERP-006 |
| LTV promedio | AVG lifetime_revenue | ERP-006 + ERP-011 |
| MRR por cliente | Top 10 por MRR | ERP-007 |
| Rentabilidad por cliente | Margen neto por cliente | ERP-011 |
| Clientes con riesgo churn | Health Score < umbral configurado | ERP-006 |
| Upsell detectado | Oportunidades activas por cliente | ERP-006 |

---

### Dashboard 4 — Servicios Analytics

Por cada línea de negocio (Web / SEO / Hosting / Cloud / Software / Email Mkt / Branding / Ads):

| KPI | Cálculo |
|---|---|
| Revenue por línea | SUM precio_actual_usd servicios activos |
| MRR por línea | SUM mrr_usd servicios activos |
| Margen % | (Revenue − Coste) / Revenue |
| Rentabilidad neta | Revenue − coste operativo − coste IA |
| Ticket promedio | Revenue / cantidad servicios |
| Tasa de renovación | Renovados / vencidos en período |
| Tasa de cancelación | Cancelados / activos × 100 |

---

### Dashboard 5 — Proyectos Analytics

| KPI | Cálculo | Fuente |
|---|---|---|
| Proyectos activos | COUNT estados activos | ERP-008 |
| Proyectos finalizados | COUNT estado `completado` | ERP-008 |
| Proyectos retrasados | COUNT fecha_fin < hoy y estado != completado | ERP-008 |
| % cumplimiento deadlines | Entregados en fecha / total × 100 | ERP-008 |
| Tiempo promedio entrega | AVG(fecha_cierre − fecha_inicio) | ERP-008 |
| Horas estimadas vs reales | SUM horas planificadas vs tracked | ERP-008 + ERP-009 |
| Bloqueos activos | COUNT tareas estado `bloqueado` | ERP-009 |
| Rentabilidad por proyecto | Revenue − coste operativo proyecto | ERP-008 + ERP-011 |

---

### Dashboard 6 — Tareas & Productividad

| KPI | Cálculo | Fuente |
|---|---|---|
| Tareas creadas | COUNT período | ERP-009 |
| Tareas cerradas | COUNT completadas período | ERP-009 |
| Tareas vencidas | COUNT fecha_vencimiento < hoy y abierta | ERP-009 |
| Tareas bloqueadas | COUNT estado `bloqueado` | ERP-009 |
| Productividad por persona | Cerradas / asignadas × 100 por user | ERP-009 |
| Tiempo promedio resolución | AVG(cerrado_at − creado_at) | ERP-009 |
| Workload actual | COUNT tareas abiertas por user | ERP-009 |
| Carga del equipo | Distribución de tareas por colaborador | ERP-009 |

---

### Dashboard 7 — Finanzas Analytics

| KPI | Fuente |
|---|---|
| Facturado mes | ERP-012 |
| Cobrado mes | ERP-012 |
| Pendiente de cobro | ERP-012 |
| Morosidad % | ERP-012 |
| Burn rate | ERP-011 |
| Cashflow proyectado | ERP-011 |
| Profit neto | ERP-011 |
| Margen bruto | ERP-011 |
| Margen neto | ERP-011 |
| Forecast financiero 30/60/90d | ERP-011 |
| Revenue por unidad de negocio | ERP-011 multi-BU |
| Gastos por categoría | ERP-011 |

---

### Dashboard 8 — Laboratorio IA Analytics

| KPI | Cálculo | Fuente |
|---|---|---|
| Agentes activos | COUNT agentes con ejecuciones en período | ERP-010 |
| Ejecuciones por día | COUNT AgentExecution por día | ERP-010 |
| Tokens consumidos | SUM tokens_input + tokens_output | ERP-010 |
| Coste total IA mes | SUM coste_total_usd | ERP-010 + ERP-011 |
| Coste por proveedor | GROUP BY proveedor | ERP-010 |
| Coste por cliente | SUM coste_total_usd GROUP BY client_id | ERP-010 |
| Coste por proyecto | SUM GROUP BY project_id | ERP-010 |
| ROI estimado IA | SUM(utilidad_estimada − coste_total) / SUM(coste_total) | ERP-010 |
| Tiempo ahorrado | SUM ahorro_tiempo_horas × valor_hora | ERP-010 |
| Agente más utilizado | COUNT ejecuciones por agente | ERP-010 |
| Agente más rentable | Mayor ROI estimado promedio | ERP-010 |

---

### Dashboard 9 — HostingGuard Analytics

Conectado vía API interna de HostingGuard.

| KPI | Descripción |
|---|---|
| Clientes hosting activos | Contratos de hosting activos |
| Deployments diarios | Builds completados en 24h |
| Subdominios activos | Total subdominios en uso |
| SSL activos / vencidos | Certificados por estado |
| Uptime general | % disponibilidad promedio todos los servidores |
| Errores de deploy | COUNT builds fallidos período |
| Bandwidth mensual | GB transferidos |
| Storage total | GB en uso |
| CPU / RAM por servidor | Uso promedio del período |

---

### Dashboard 10 — Inspyra Cloud Analytics

Conectado vía AWS Cost Explorer API + control-plane metrics.

| KPI | Descripción |
|---|---|
| Workloads activos | Servicios ECS / Lambda activos |
| Lambdas activas | COUNT Lambdas en producción |
| AWS cost mensual | Costo total AWS del período |
| Coste por cliente | Imputación por workload |
| RDS usage | Storage y conexiones activas |
| CloudFront usage | Requests y bandwidth CDN |
| Infra health | Estado general (healthy / degraded / critical) |
| Alertas activas | COUNT alarmas CloudWatch activas |

---

### Dashboard 11 — Email Marketing Analytics

| KPI | Descripción |
|---|---|
| Campañas enviadas | COUNT campañas período |
| Emails enviados | Total emails período |
| Delivered rate | Delivered / Enviados × 100 |
| Open rate | Abiertos / Delivered × 100 |
| CTR | Clicks / Delivered × 100 |
| Reply rate | Respuestas / Delivered × 100 |
| Unsubscribe rate | Bajas / Delivered × 100 |
| Bounce rate | Rebotes / Enviados × 100 |
| Conversiones por campaña | Leads o ventas atribuidas |
| Revenue generado | Revenue con atribución a campaña |
| Mejor campaña | Mayor CTR o mayor revenue generado |

---

### Dashboard 12 — Soporte Analytics

| KPI | Cálculo | Fuente |
|---|---|---|
| Tickets abiertos | COUNT estados activos | ERP-013 |
| Tickets cerrados | COUNT cerrados período | ERP-013 |
| Tickets críticos | COUNT prioridad critica/urgente | ERP-013 |
| SLA cumplido % | Resueltos en tiempo / total × 100 | ERP-013 |
| Tiempo promedio resolución | AVG tiempo_resolucion_minutos | ERP-013 |
| CSAT promedio | AVG satisfaccion_score | ERP-013 |
| Tickets por categoría | COUNT GROUP BY categoria | ERP-013 |
| Tickets por cliente | TOP clientes por volumen | ERP-013 |
| Tickets por colaborador | COUNT por owner_id | ERP-013 |
| Tasa de reapertura | Reabiertos / Cerrados × 100 | ERP-013 |

---

## Visualizaciones disponibles

| Tipo | Usos |
|---|---|
| Cards KPI | Métricas simples, siempre visibles arriba |
| Tabla | Listados rankeados, top N, comparativas |
| Gráfico de líneas | Tendencia temporal, crecimiento |
| Gráfico de barras | Comparación entre categorías |
| Pie / donut chart | Distribución porcentual |
| Heatmap | Actividad por hora/día, productividad |
| Timeline | Secuencia de eventos por proyecto o cliente |
| Funnel | Conversión comercial paso a paso |
| Gauge | KPI vs objetivo (verde/amarillo/rojo) |
| Forecast graph | Proyección con banda de confianza |

---

## Filtros globales (aplican a todos los dashboards)

| Filtro | Opciones |
|---|---|
| Período | Hoy · Últimos 7 días · Últimos 30 días · Mes actual · Trimestre · Año · Rango personalizado |
| Cliente | Selector multi-cliente |
| Servicio / línea | Web · SEO · Hosting · Cloud · Software · Ads · Email Mkt · Branding |
| Unidad de negocio | Inspyra · HostingGuard · Inspyra Cloud · Inspyra Mail · Email Mkt |
| Responsable | Por user del equipo |
| Canal | Inbound · Outbound · Referido · Orgánico |

---

## Exportación

Cada reporte y dashboard puede exportarse como:

| Formato | Descripción |
|---|---|
| **PDF** | Snapshot del dashboard con fecha y filtros aplicados |
| **Excel / CSV** | Datos crudos para análisis externo |
| **Link compartible** | URL interna con filtros embebidos (solo para usuarios autenticados) |
| **Email programado** | Reporte automático enviado a dirección configurable |

---

## Bots y automatizaciones

| Bot | Trigger | Acción |
|---|---|---|
| **Daily Report Bot** | Cada día a las 8:00 AM | Genera resumen ejecutivo del día anterior: revenue, tickets, proyectos, tareas |
| **Weekly Report Bot** | Lunes 9:00 AM | Resumen semana anterior: todas las áreas + 3 alertas prioritarias |
| **Monthly Report Bot** | Día 1 de cada mes | Cierre mensual completo con comparativa mes anterior + forecast próximo |
| **Executive Summary Bot** | Bajo demanda o semanal | Resumen ejecutivo CEO en formato narrativo con IA |
| **Anomaly Detection Bot** | Continuo | Detecta caídas o alzas inusuales en cualquier métrica clave (> 2σ) |
| **KPI Alert Bot** | Continuo | Alerta si algún KPI cae por debajo del objetivo configurado |
| **Forecast Bot** | Ejecución semanal | Actualiza proyecciones de revenue, MRR y cashflow |

---

## Capacidades IA del módulo

| Función IA | Descripción |
|---|---|
| **Análisis conversacional** | Responder preguntas en lenguaje natural: "¿qué servicio creció más este mes?" |
| **Narrativa ejecutiva** | Genera el párrafo de resumen del período para informes al equipo |
| **Detección de anomalías** | Identifica métricas que se desvían significativamente de la tendencia |
| **Recomendación estratégica** | "Basado en los últimos 3 meses, conviene escalar SEO — mayor margen y menor churn" |
| **Comparativa inteligente** | Compara rendimiento actual vs período anterior con contexto |
| **Alerta de deterioro** | Detecta servicios, clientes o áreas con tendencia negativa sostenida |
| **Forecast con lenguaje natural** | "¿Cuánto vamos a facturar este trimestre si mantenemos el ritmo actual?" |

Toda ejecución IA registra métricas de coste según `01-constitution-v1.md §7`.

---

## Relaciones con otros módulos

| Módulo | Datos consumidos |
|---|---|
| **ERP-001 Prospectos** | Leads, fuentes, conversión |
| **ERP-002 Campañas** | Rendimiento campañas, CTR, conversión |
| **ERP-004 Pipeline** | Deals, pipeline value, ratio cierre |
| **ERP-005 Reuniones** | Tasa de reuniones, show-up rate |
| **ERP-006 Clientes** | Churn, LTV, health score |
| **ERP-007 Servicios** | MRR, margen por línea |
| **ERP-008 Proyectos** | Delivery, deadlines, rentabilidad |
| **ERP-009 Tareas** | Productividad, bloqueos, workload |
| **ERP-010 Lab IA** | Coste IA, ROI por agente |
| **ERP-011 Finanzas** | Revenue, profit, cashflow, burn rate |
| **ERP-012 Facturación** | Facturado, cobrado, morosidad |
| **ERP-013 Tickets** | SLA, CSAT, volumen soporte |

---

## Reglas críticas de negocio

### Regla 1 — Solo lectura
El módulo Reportes no puede crear, modificar ni eliminar ningún registro operativo. Es puramente una capa de consulta.

### Regla 2 — Trazabilidad completa
Toda cifra mostrada en un dashboard debe poder rastrearse hasta su fuente de datos con un clic. El usuario puede ver "revenue = $12.450" y acceder directamente a las facturas que lo componen.

### Regla 3 — Consistencia financiera
Toda cifra financiera en Reportes debe coincidir exactamente con ERP-011 Finanzas. Si hay discrepancia → bug crítico.

### Regla 4 — Filtros obligatorios
Ningún dashboard puede desplegarse sin filtro de período activo. El período por defecto es `mes actual`.

### Regla 5 — Todo reporte debe poder exportarse
Cualquier tabla o dashboard debe poder exportarse en al menos CSV + PDF.

---

## Criterios de aceptación (DoD)

Para que esta spec se considere implementada:

- [ ] Executive Dashboard CEO con todos los KPIs consolidados en tiempo real
- [ ] 12 dashboards analíticos completos con sus métricas
- [ ] Filtros globales por período, cliente, línea de servicio, unidad de negocio y responsable
- [ ] Todas las visualizaciones (cards, líneas, barras, pie, funnel, gauge, forecast)
- [ ] Exportación a PDF, CSV y Excel en todos los dashboards
- [ ] Link compartible con filtros embebidos (solo autenticados)
- [ ] Daily Report Bot con resumen ejecutivo automático 8:00 AM
- [ ] Weekly Report Bot con resumen semanal y 3 alertas prioritarias
- [ ] Monthly Report Bot con cierre mensual + comparativa
- [ ] Anomaly Detection Bot sobre métricas clave (> 2σ de la tendencia)
- [ ] KPI Alert Bot con umbrales configurables por dashboard
- [ ] Consulta en lenguaje natural: "¿Cuánto facturamos este mes?" → respuesta con cifra y fuente
- [ ] Narrativa IA generada para informes ejecutivos
- [ ] Consistencia financiera verificada vs ERP-011 (tests de coherencia)
- [ ] Integración con HostingGuard API para métricas de infra
- [ ] Integración con AWS Cost Explorer para Inspyra Cloud
- [ ] Email programado de reportes a dirección configurable
- [ ] Tests de integración que validan que cada KPI coincide con su fuente de datos
- [ ] Performance: cualquier dashboard carga en < 3 segundos con datos reales

---

## Próximos pasos

1. Aprobar esta spec — cierra el módulo Operations completo
2. Iniciar specs del módulo **Account**: Config / Usuarios / Roles / Permisos / Integraciones
3. Crear el **Unified Data Model spec** — schema Prisma completo de todas las entidades
4. Crear el **API Design spec** — endpoints REST para todos los módulos
5. Definir la capa de queries para Reportes: queries materializadas o vistas en PostgreSQL para evitar N+1 en dashboards complejos
6. Evaluar si usar una herramienta de BI embebida (Recharts / Tremor / Observable) o construir los gráficos a medida
