# ERP-016 — Inspyra Cloud

**Spec ID:** 17  
**Código:** ERP-016  
**Módulo:** Inspyra Cloud (unidad satélite enterprise)  
**Estado:** 🟡 DRAFT v1  
**Fecha:** 2026-05-31  
**Autor:** Inspyra Team  

---

## Objetivo del módulo

El módulo Inspyra Cloud conecta Inspyra ERP con la plataforma Inspyra Cloud para centralizar toda la operación relacionada con infraestructura cloud, workloads AWS, entornos serverless, sistemas empresariales, aplicaciones de clientes, costos cloud y observabilidad técnica avanzada.

Es el **puente entre Inspyra ERP y toda la infraestructura cloud avanzada** operada por Inspyra.

---

## Qué representa dentro del ecosistema

Inspyra Cloud es la **unidad satélite enterprise** especializada en:

- Infraestructura cloud y arquitectura AWS
- Serverless, APIs y backend escalable
- Software empresarial y aplicaciones internas
- Soluciones cloud dedicadas por cliente
- SaaS, plataformas web y productos digitales

Orientada principalmente a: pymes tecnológicas, clientes medianos y enterprise, productos digitales, sistemas internos.

---

## Principio central

> **Inspyra Cloud mantiene autonomía técnica. El ERP consulta, sincroniza, relaciona, monitorea y visualiza.**

El ERP no reemplaza el dashboard de Inspyra Cloud ni su infraestructura runtime. La lógica técnica core permanece en Inspyra Cloud.

---

## Qué vive dentro del módulo

- Clientes cloud y sus proyectos
- Entornos AWS por cliente (dev / staging / production)
- Workloads: Lambdas, APIs, containers, workers, cron jobs
- Métricas de servicios AWS (Lambda, API Gateway, RDS, S3, CloudFront)
- Deployments cloud con historial y rollback
- Cost Explorer: costos AWS por cliente / workload / servicio
- Monitoring y alertas técnicas
- Billing cloud sincronizado con ERP-012

---

## Qué NO vive aquí

| ❌ No aquí | ✅ Dónde va |
|---|---|
| Desarrollo interno del producto Inspyra Cloud | Repositorio y dashboard de Inspyra Cloud |
| Infraestructura runtime real | AWS / Inspyra Cloud platform |
| Soporte técnico de incidentes | ERP-013 Tickets |
| Facturación y cobros | ERP-012 Facturación |

---

## Modelo de integración — Sync por API

| Frecuencia | Datos sincronizados |
|---|---|
| Cada 1 min | Estado de workloads activos |
| Cada 5 min | Logs críticos y errores recientes |
| Cada 15 min | Métricas de infraestructura (CPU, RAM, latencia) |
| Cada 15 min | Costos AWS del período actual |
| Cada 1 hora | Billing cloud → ERP-012 |
| Cada 24 horas | Metadata de snapshots y backups |
| Webhooks | Deployment events y alertas críticas en tiempo real |

La sincronización es **unidireccional**: Inspyra Cloud → ERP, salvo provisioning inicial de nuevos proyectos.

---

## Modelo de datos

### CloudClient (Cliente Cloud en ERP)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `client_id` | uuid (FK Client) | Cliente del ERP vinculado |
| `ic_account_id` | string | ID de la cuenta en Inspyra Cloud (externo) |
| `tipo_cliente` | enum | pyme / mediana / enterprise / producto_digital / saas / interno |
| `plan` | string | Plan contratado |
| `owner_tecnico_id` | uuid (FK User) | Técnico responsable de la cuenta |
| `aws_account_id` | string | ID de la cuenta AWS asociada (nullable) |
| `fecha_alta` | date | Fecha de incorporación |
| `estado` | enum | activo / suspendido / cancelado |
| `ultimo_deployment_at` | timestamp | Último deploy exitoso |
| `health_status` | enum | healthy / degraded / critical / unknown |
| `billing_status` | enum | al_dia / pendiente / vencido |
| `coste_aws_mes_usd` | decimal (sync) | Costo AWS del mes actual |
| `billing_mensual_usd` | decimal | Lo que factura Inspyra al cliente |
| `margen_usd` | decimal (calculado) | billing_mensual − coste_aws |

---

### CloudWorkload (Carga activa)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `cloud_client_id` | uuid (FK CloudClient) | Cliente al que pertenece |
| `nombre` | string | Nombre del workload |
| `tipo` | enum | api / lambda / worker / container / cron / queue_processor / scheduled_job / otro |
| `runtime` | string | Ej: `nodejs18.x`, `python3.11`, `go1.21`, `docker` |
| `entorno` | enum | development / staging / production |
| `estado` | enum | activo / inactivo / error / desplegando |
| `ultima_ejecucion_at` | timestamp | — |
| `latencia_ms_p95` | int | Percentil 95 de latencia (nullable) |
| `errores_24h` | int | Errores en las últimas 24 horas |
| `uso_cpu_pct` | decimal | CPU promedio actual |
| `uso_ram_mb` | int | RAM promedio actual |
| `coste_estimado_usd_mes` | decimal | Costo mensual estimado del workload |

---

### CloudEnvironment (Entorno)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `cloud_client_id` | uuid (FK CloudClient) | Cliente al que pertenece |
| `nombre` | enum | development / staging / production |
| `estado` | enum | healthy / degraded / critical / deploying |
| `ultimo_deployment_at` | timestamp | Último deploy en este entorno |
| `ultimo_commit_hash` | string | SHA del commit activo |
| `health_url` | string | URL del health check (nullable) |
| `owner_id` | uuid (FK User) | Responsable técnico del entorno |

---

### CloudDeployment (Deployment)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `ic_deployment_id` | string | ID externo en Inspyra Cloud |
| `cloud_client_id` | uuid (FK CloudClient) | Cliente |
| `workload_id` | uuid (FK CloudWorkload) | Workload deployado |
| `entorno` | enum | development / staging / production |
| `repo_url` | string | URL del repositorio |
| `branch` | string | Rama deployada |
| `commit_hash` | string | SHA del commit |
| `commit_author` | string | Autor del commit |
| `release_notes` | text | Notas de la release (nullable) |
| `status` | enum | pending / building / deploying / success / failed / rolled_back |
| `duracion_segundos` | int | Duración total del proceso (nullable) |
| `rollback_disponible` | boolean | Si hay versión anterior disponible |
| `logs_url` | string | URL a los logs completos (nullable) |
| `error_message` | text | Mensaje de error si falló (nullable) |
| `created_at` | timestamp | — |

---

### CloudCostSnapshot (Snapshot de costos AWS)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `cloud_client_id` | uuid (FK CloudClient) | Cliente |
| `periodo` | string | Mes del snapshot (`2026-05`) |
| `snapshot_at` | timestamp | Momento del snapshot |
| `coste_total_usd` | decimal | Costo total AWS del período |
| `coste_lambda_usd` | decimal | Lambda + API Gateway |
| `coste_rds_usd` | decimal | RDS |
| `coste_s3_usd` | decimal | S3 + transfers |
| `coste_cloudfront_usd` | decimal | CloudFront |
| `coste_otros_usd` | decimal | Otros servicios |
| `vs_mes_anterior_pct` | decimal (calculado) | Variación % respecto al mes anterior |

---

### CloudAlert (Alerta técnica)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `cloud_client_id` | uuid (FK) | Cliente afectado (nullable si es global) |
| `workload_id` | uuid (FK) | Workload afectado (nullable) |
| `tipo` | enum | lambda_error / api_failure / high_latency / billing_spike / db_overload / memory_alert / cpu_alert / storage_full / service_unavailable / deploy_failed / cron_failure / queue_backlog |
| `severidad` | enum | info / warning / critical |
| `mensaje` | text | Descripción del problema |
| `resuelto` | boolean | Si la alerta fue resuelta |
| `resuelto_at` | timestamp | Cuándo se resolvió (nullable) |
| `ticket_id` | uuid (FK) | Ticket creado en ERP-013 si se escaló (nullable) |
| `created_at` | timestamp | — |

---

## Estructura interna — Vistas del módulo

### Vista 1 — Dashboard General Cloud

| Métrica | Fuente |
|---|---|
| Clientes cloud activos | COUNT CloudClient activos |
| Workloads activos | COUNT CloudWorkload estado `activo` |
| Lambdas activas | COUNT tipo `lambda` activas |
| APIs activas | COUNT tipo `api` activas |
| Entornos productivos activos | COUNT CloudEnvironment healthy |
| Infra en riesgo | COUNT health_status `degraded` o `critical` |
| Alertas activas | COUNT CloudAlert sin resolver |
| Coste AWS mensual | SUM coste_aws_mes_usd todos los clientes |
| Coste AWS diario | Promedio del mes actual |
| Revenue cloud mensual | SUM billing_mensual_usd clientes activos |
| Margen infraestructura | (Revenue − Coste AWS) / Revenue |
| Uptime global | % entornos healthy / total |

---

### Vista 2 — Clientes Cloud

Tabla con todos los CloudClient. Columnas: nombre, tipo, plan, health status, coste AWS mes, billing, último deploy, owner técnico. Click → ficha completa.

### Vista 3 — Workloads

Tabla de workloads activos por cliente con estado, tipo, entorno, latencia p95, errores 24h y costo estimado.

### Vista 4 — AWS Services

Panel de métricas por servicio AWS:

| Servicio | Métricas clave |
|---|---|
| **Lambda** | Invocaciones, errores %, duración media, coste |
| **API Gateway** | Requests, latencia p95, errores 4xx/5xx, throughput |
| **RDS** | CPU %, connections activas, storage usado, queries/s, coste |
| **S3** | Storage total, objetos, transferencia, coste |
| **CloudFront** | Bandwidth, cache hit %, requests, coste |
| **Route53** | Zonas activas, DNS queries |
| **CloudWatch** | Alarmas activas, logs ingested |

### Vista 5 — Environments

Grid de entornos por cliente: Development / Staging / Production. Estado visual (verde/amarillo/rojo) + último commit + último deploy.

### Vista 6 — Deployments Cloud

Historial completo con filtros por cliente, entorno, status, período. Click → logs + opción rollback.

### Vista 7 — Cost Explorer

| Vista | Descripción |
|---|---|
| Por cliente | Ranking de clientes por coste AWS |
| Por servicio | Lambda vs RDS vs S3 vs CloudFront |
| Por entorno | Production vs Staging vs Dev |
| Histórico | Evolución mensual últimos 12 meses |
| Forecast | Proyección del mes actual y siguiente |
| Variación | % cambio vs mes anterior con alerta si > 15% |

### Vista 8 — Monitoring & Alertas

Feed de alertas ordenadas por severidad. Historial resueltas. Enlace directo al ticket de ERP-013 si se escaló.

### Vista 9 — Billing Cloud

Planes activos, billing fijo + variable (usage-based), AWS pass-through, margen por cliente. Sincronizado con ERP-012.

---

## KPIs del módulo (siempre visibles)

| KPI | Cálculo | Alerta |
|---|---|---|
| Uptime global | % entornos healthy | si < 99% |
| Alertas críticas activas | COUNT critical sin resolver | si > 0 |
| Coste AWS hoy | SUM snapshots día actual | vs día anterior |
| Billing spike | Cliente con coste > 20% vs mes anterior | si existe |
| Deployments fallidos | COUNT failed 24h | si > 0 |
| Entornos degradados | COUNT degraded/critical | si > 0 |
| Revenue cloud mes | SUM billing_mensual_usd | — |
| Margen cloud % | (Revenue − CostoAWS) / Revenue × 100 | si < 20% |

---

## Bots y automatizaciones

| Bot | Trigger | Acción |
|---|---|---|
| **AWS Cost Sync Bot** | Cada 15 min | Actualiza `CloudCostSnapshot` con datos de AWS Cost Explorer API |
| **Cloud Monitor Bot** | Cada 5 min | Verifica health de entornos + crea `CloudAlert` si hay degradación |
| **Billing Alert Bot** | Coste AWS cliente > umbral o > 20% vs mes anterior | Alerta al owner técnico + al director con desglose |
| **Lambda Failure Bot** | Error rate Lambda > 1% en 5 min | Crea alerta + notifica al owner técnico |
| **Deployment Sync Bot** | Webhook de Inspyra Cloud en cada deploy | Crea/actualiza `CloudDeployment` en ERP |
| **Cost Forecast Bot** | Ejecución semanal | Proyecta coste AWS mes actual y siguiente por cliente |
| **Scaling Recommendation Bot** | Workload con CPU > 80% por 3 períodos consecutivos | Sugiere escalado al owner técnico con estimación de costo adicional |
| **Backup Verification Bot** | Cada 24h | Verifica que los backups de RDS y S3 se ejecutaron correctamente |
| **Environment Health Bot** | Cada 1 min | Monitorea entornos production; escala a ERP-013 si critical > 5 min |

---

## Capacidades IA del módulo

| Función IA | Descripción |
|---|---|
| **Interpretación de errores AWS** | Traduce mensajes de error de Lambda/ECS/RDS a lenguaje claro con causa probable |
| **Resumen de incidentes técnicos** | Narrativa del incidente en 5 líneas: qué pasó, cuánto duró, impacto, resolución |
| **Optimización de costos** | Detecta recursos infrautilizados y cuantifica el ahorro potencial |
| **Detección de anomalías de costo** | Identifica spikes inusuales en servicios específicos |
| **Recomendación de arquitectura** | Basado en patrones de uso, sugiere mejoras (ej: migrar Lambda a ECS si supera cierto uso) |
| **Predicción de escalado** | Proyecta cuándo un workload necesitará más recursos |
| **Análisis de logs complejos** | Resume CloudWatch logs extensos señalando las líneas críticas |
| **Evaluación de margen por cliente** | "El cliente X tiene margen del 12% — revisar pricing" |

Toda ejecución IA registra métricas de coste según `01-constitution-v1.md §7`.

---

## Nota — Email Marketing como workload de Inspyra Cloud

El servicio **Inspyra Email Marketing** puede correr infraestructura dentro de Inspyra Cloud (workers de envío, colas SQS, procesadores de bounce). Cuando esto ocurra:

- Crear un `CloudWorkload` de tipo `worker` vinculado al cliente interno `Inspyra Email Marketing`
- Los costos AWS de Email Marketing se imputan a la unidad de negocio `email_mkt` en ERP-011
- La separación de reputación IP (ERP-013 Mail Operational Rules) aplica también a nivel de workloads — los workers de bulk mail no comparten cuenta AWS con workloads de clientes

---

## Relaciones con otros módulos

| Módulo | Relación |
|---|---|
| **Clientes (ERP-006)** | Cada CloudClient vincula con un Client del ERP |
| **Servicios (ERP-007)** | Servicio tipo `cloud` genera CloudClient via provisioning |
| **Proyectos (ERP-008)** | Proyectos de software/cloud se vinculan a entornos cloud |
| **Facturación (ERP-012)** | Billing cloud sync: fijo + variable usage-based |
| **Finanzas (ERP-011)** | Costos AWS imputados por unidad de negocio |
| **Tickets (ERP-013)** | Alertas críticas escalan a ticket automáticamente |
| **Reportes (ERP-014)** | Dashboard 10 Inspyra Cloud Analytics |
| **Laboratorio IA (ERP-010)** | Análisis técnico + predicción + optimización |
| **Email Marketing** | Puede operar como workload interno dentro de Inspyra Cloud |

---

## Reglas críticas de negocio

### Regla 1 — Autonomía técnica de Inspyra Cloud
El ERP no puede modificar configuración técnica de Inspyra Cloud salvo provisioning inicial. Es lectura + escritura acotada.

### Regla 2 — Integración vía API, nunca acceso directo a AWS
El ERP obtiene métricas AWS exclusivamente via la API de Inspyra Cloud o via AWS SDK con rol de solo lectura. Nunca credentials con permisos de escritura en la capa del ERP.

### Regla 3 — Todo costo cloud debe poder imputarse
Cada `CloudCostSnapshot` debe tener `cloud_client_id`. Los costos de infraestructura interna de Inspyra se imputan a `client_id = inspyra_internal`.

### Regla 4 — Todo workload debe pertenecer a cliente o proyecto
Ningún workload puede existir sin `cloud_client_id`. Los workloads internos de Inspyra usan el cliente interno.

### Regla 5 — Todo deployment debe registrarse
Cada deploy completado (exitoso o fallido) genera un `CloudDeployment`. Historial permanente.

### Regla 6 — Alertas críticas nunca se ignoran
Alerta de tipo `service_unavailable` o `deploy_failed` en `critical` sin resolución en 5 minutos → escala automáticamente a ticket en ERP-013 con prioridad `critica`.

### Regla 7 — Toda infraestructura debe poder auditarse económicamente
El costo de cada workload en producción debe ser rastreable y atribuible. Sin costo visible → workload bloqueado para producción.

---

## Criterios de aceptación (DoD)

Para que esta spec se considere implementada:

- [ ] Schema Prisma: `CloudClient`, `CloudWorkload`, `CloudEnvironment`, `CloudDeployment`, `CloudCostSnapshot`, `CloudAlert`
- [ ] Sincronización via API Inspyra Cloud con los 6 intervalos + webhooks definidos
- [ ] Dashboard General Cloud con los 12 KPIs
- [ ] Vista Clientes Cloud con ficha completa
- [ ] Vista Workloads con estado, latencia y errores en tiempo real
- [ ] Vista AWS Services con métricas por servicio (Lambda, RDS, S3, CloudFront, API GW)
- [ ] Vista Environments: grid con health visual por entorno y cliente
- [ ] Vista Deployments con logs y rollback
- [ ] Cost Explorer con vistas por cliente / servicio / entorno / histórico / forecast
- [ ] Vista Monitoring & Alertas con feed ordenado por severidad
- [ ] Vista Billing Cloud sincronizada con ERP-012
- [ ] AWS Cost Sync Bot cada 15 min
- [ ] Cloud Monitor Bot con detección de degradación
- [ ] Billing Alert Bot con umbral configurable por cliente
- [ ] Lambda Failure Bot con detección de error rate > 1%
- [ ] Deployment Sync Bot via webhook
- [ ] Environment Health Bot con escalación automática a ERP-013
- [ ] Cost Forecast Bot semanal por cliente
- [ ] Scaling Recommendation Bot con estimación de costo
- [ ] Análisis IA de errores AWS en lenguaje claro
- [ ] Optimización IA de costos con ahorro cuantificado
- [ ] Imputación de costos Email Marketing a unidad `email_mkt`
- [ ] Tests de integración contra API Inspyra Cloud (mock en test)
- [ ] Tests de coherencia de costos: CloudCostSnapshot ↔ ERP-011 Finanzas

---

## Próximos pasos

1. Aprobar esta spec
2. Crear `18-erp-017-email-marketing.md`
3. Definir contrato de API Inspyra Cloud: endpoints necesarios, autenticación, rate limits
4. Diseñar el webhook receiver para eventos de deployment y alertas críticas
5. Definir el rol IAM de solo lectura para AWS Cost Explorer desde el ERP
6. Especificar el modelo de billing variable: cómo se calcula el pass-through de costos AWS al cliente
