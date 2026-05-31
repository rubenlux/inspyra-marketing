# ERP-015 — HostingGuard

**Spec ID:** 16  
**Código:** ERP-015  
**Módulo:** HostingGuard (unidad satélite)  
**Estado:** 🟡 DRAFT v1  
**Fecha:** 2026-05-31  
**Autor:** Inspyra Team  

---

## Objetivo del módulo

El módulo HostingGuard conecta Inspyra ERP con la plataforma HostingGuard para centralizar dentro del ERP toda la operación relacionada con hosting, deployments, subdominios, infraestructura técnica, billing asociado y estado operativo de clientes alojados.

Es el **puente operativo entre HostingGuard y el ERP**.

---

## Qué representa dentro del ecosistema Inspyra

HostingGuard es una **unidad satélite independiente** especializada en:

- Hosting web y despliegue simplificado
- Subdominios y gestión de DNS
- Infraestructura VPS
- Gestión técnica de sitios en producción
- Deployments one-click desde GitHub

Dentro del ERP, este módulo permite **observar y administrar** toda esa operación desde una interfaz central sin reemplazar el producto.

---

## Principio central

> **HostingGuard mantiene su independencia operativa. El ERP consulta, sincroniza, relaciona y monitorea.**

El ERP no reemplaza el dashboard nativo de HostingGuard. La lógica core sigue en HostingGuard. Este módulo es una capa de observabilidad e integración.

---

## Qué vive dentro del módulo

- Clientes HostingGuard vinculados al ERP
- Subdominios activos y su estado DNS/SSL
- Deployments: historial, estado, logs, rollback
- SSL certificates: vigencia y alertas
- Recursos de infraestructura por cliente (CPU / RAM / storage)
- Billing hosting sincronizado con ERP-012 Facturación
- Monitoring y alertas técnicas
- Build history y error logs

---

## Qué NO vive aquí

| ❌ No aquí | ✅ Dónde va |
|---|---|
| Lógica interna del producto HostingGuard | Dashboard nativo de HostingGuard |
| Gestión de infraestructura AWS profunda | ERP-016 Inspyra Cloud |
| Tickets de soporte técnico | ERP-013 Tickets |
| Facturación y cobros | ERP-012 Facturación |

---

## Modelo de integración — Sync por API

| Frecuencia | Datos sincronizados |
|---|---|
| Cada 1 min | Estado de deployments activos |
| Cada 5 min | Health status de sitios (up/down) |
| Cada 15 min | Uso de recursos (CPU, RAM, storage) |
| Cada 1 hora | Billing sync — billing items → ERP-012 |
| Cada 24 horas | Metadata de backups y certificados SSL |
| Webhooks | Deployment events en tiempo real (push-based) |

La sincronización es **unidireccional**: HostingGuard → ERP. El ERP no escribe en HostingGuard salvo provisioning de nuevos clientes.

---

## Modelo de datos

### HGClient (Cliente HostingGuard en ERP)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `client_id` | uuid (FK Client) | Cliente del ERP vinculado |
| `hg_account_id` | string | ID de la cuenta en HostingGuard (externo) |
| `plan` | string | Plan contratado (ej: Basic / Pro / Enterprise) |
| `subdominio_principal` | string | Subdominio raíz asignado (ej: `cliente.hostingguard.lat`) |
| `fecha_alta` | date | Fecha de alta en HostingGuard |
| `estado_cuenta` | enum | activa / suspendida / cancelada |
| `ultimo_deployment_at` | timestamp | Último deploy exitoso |
| `ultimo_acceso_at` | timestamp | Último acceso al panel (nullable) |
| `renovacion_at` | date | Próxima fecha de renovación |
| `renovacion_automatica` | boolean | Si renueva automáticamente |
| `billing_status` | enum | al_dia / pendiente / vencido |

---

### HGDeployment (Deployment)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `hg_deployment_id` | string | ID externo en HostingGuard |
| `hg_client_id` | uuid (FK HGClient) | Cliente al que pertenece |
| `repo_url` | string | URL del repositorio GitHub |
| `branch` | string | Rama deployada |
| `commit_hash` | string | SHA del commit |
| `commit_author` | string | Nombre del autor del commit |
| `entorno` | enum | production / preview / staging |
| `status` | enum | pending / building / success / failed / cancelled |
| `build_duration_seconds` | int | Duración del build en segundos (nullable) |
| `url_deployada` | string | URL pública del deployment (nullable) |
| `rollback_disponible` | boolean | Si hay versión anterior disponible |
| `logs_url` | string | URL a los logs completos (nullable) |
| `error_message` | text | Mensaje de error si `status = failed` (nullable) |
| `created_at` | timestamp | Fecha y hora del inicio del build |

---

### HGSubdomain (Subdominio)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `hg_client_id` | uuid (FK HGClient) | Cliente al que pertenece |
| `subdominio` | string | FQDN completo (ej: `demo.hostingguard.lat`) |
| `target_app` | string | App o servicio al que apunta |
| `ssl_status` | enum | activo / por_vencer / vencido / error / pendiente |
| `ssl_expiration_at` | date | Fecha de expiración del certificado |
| `ssl_auto_renew` | boolean | Si tiene auto-renovación habilitada |
| `dns_status` | enum | ok / propagando / error |
| `ultima_resolucion_ok_at` | timestamp | Última vez que DNS resolvió correctamente |
| `activo` | boolean | Si el subdominio está activo |
| `created_at` | timestamp | — |

---

### HGResource (Uso de recursos — snapshot)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `hg_client_id` | uuid (FK HGClient) | Cliente |
| `snapshot_at` | timestamp | Momento del snapshot |
| `cpu_pct` | decimal | CPU utilizado % |
| `ram_pct` | decimal | RAM utilizada % |
| `storage_usado_gb` | decimal | GB de storage usado |
| `storage_libre_gb` | decimal | GB de storage libre |
| `bandwidth_gb` | decimal | GB de bandwidth transferido |
| `requests_count` | int | Requests en el período |
| `response_time_ms` | int | Tiempo promedio de respuesta |
| `build_cache_mb` | int | MB usados en build cache |

---

### HGAlert (Alerta técnica)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `hg_client_id` | uuid (FK HGClient) | Cliente afectado (nullable si es global) |
| `tipo` | enum | site_down / ssl_expiring / deploy_failed / high_cpu / memory_spike / container_restart / dns_issue / build_timeout / webhook_failed |
| `severidad` | enum | info / warning / critical |
| `mensaje` | text | Descripción del problema |
| `resuelto` | boolean | Si la alerta fue resuelta |
| `resuelto_at` | timestamp | Cuándo se resolvió (nullable) |
| `created_at` | timestamp | — |

---

## Estructura interna — Vistas del módulo

### Vista 1 — Dashboard HostingGuard

| Métrica | Fuente |
|---|---|
| Clientes alojados | COUNT HGClient activos |
| Subdominios activos | COUNT HGSubdomain activos |
| VPS activos | COUNT por plan que incluye VPS |
| Deployments hoy | COUNT HGDeployment fecha = hoy |
| Deployments fallidos | COUNT status = `failed` período |
| Último deployment | MAX created_at |
| SSL activos | COUNT ssl_status = `activo` |
| SSL por vencer ≤ 30 días | COUNT ssl_expiration_at ≤ now + 30d |
| Uptime general | AVG health checks ok / total × 100 |
| CPU promedio | AVG cpu_pct último snapshot |
| RAM promedio | AVG ram_pct último snapshot |
| Storage utilizado | SUM storage_usado_gb |
| Bandwidth mensual | SUM bandwidth_gb mes actual |
| Revenue hosting mensual | SUM billing recurrente activo |

---

### Vista 2 — Clientes Hosting

Tabla con todos los clientes HG vinculados al ERP. Columnas: nombre, subdominio, plan, estado, último deployment, billing status, renovación. Click → ficha completa del cliente.

### Vista 3 — Deployments

Tabla con historial completo. Filtros: cliente, branch, entorno, status, período. Click en un deployment → logs completos + opción de rollback si disponible.

### Vista 4 — Subdominios

Tabla de todos los subdominios activos con DNS y SSL status. Alerta visual si SSL vence en < 30 días.

### Vista 5 — SSL & Seguridad

Panel dedicado a certificados. Ordenado por urgencia: vencidos primero → por vencer → activos.

### Vista 6 — Recursos por Cliente

Gráficos de CPU, RAM y storage por cliente. Comparativa últimas 24h / 7d / 30d.

### Vista 7 — Billing HostingGuard

Planes activos, MRR generado, próximas renovaciones. Sincronizado con ERP-012.

### Vista 8 — Monitoring & Alertas

Feed de alertas activas ordenadas por severidad. Historial de alertas resueltas.

---

## KPIs del módulo (siempre visibles)

| KPI | Cálculo | Alerta |
|---|---|---|
| Sitios online | % health checks ok | si < 99% |
| Deployments exitosos hoy | COUNT success hoy | — |
| Deployments fallidos | COUNT failed período | si > 0 |
| SSL por vencer | COUNT expiration ≤ 30d | si > 0 |
| Alertas críticas activas | COUNT severidad critical sin resolver | si > 0 |
| Revenue hosting mes | SUM billing recurrente | — |
| CPU alto (> 80%) | COUNT clientes con cpu_pct > 80 | si > 0 |
| Storage crítico (> 90%) | COUNT clientes con storage > 90% | si > 0 |

---

## Bots y automatizaciones

| Bot | Trigger | Acción |
|---|---|---|
| **Auto Deployment Sync Bot** | Webhook de HostingGuard en cada deployment | Crea/actualiza `HGDeployment` en ERP con status y logs |
| **Deployment Failure Alert Bot** | `status = failed` en HGDeployment | Crea `HGAlert` + notifica al owner del cliente en ERP |
| **SSL Expiration Bot** | `ssl_expiration_at` ≤ 30 días | Alerta al equipo técnico + intenta auto-renovación |
| **Resource Monitor Bot** | Cada 15 min | Snapshot de CPU/RAM/storage; alerta si supera umbrales |
| **Site Health Check Bot** | Cada 5 min | Verifica disponibilidad HTTP de todos los subdominios activos |
| **Billing Sync Bot** | Cada hora | Sincroniza billing items de HostingGuard hacia ERP-012 |
| **Renewal Reminder Bot** | `renovacion_at` - 15 días | Notifica al account manager + recordatorio al cliente |
| **Client Provisioning Bot** | Nuevo servicio tipo `hosting` creado en ERP-007 | Crea cuenta en HostingGuard via API + asigna subdominio |

---

## Capacidades IA del módulo

| Función IA | Descripción |
|---|---|
| **Análisis de logs de deploy** | Resume en 3 líneas la causa probable de un deployment fallido |
| **Diagnóstico de errores de build** | Interpreta el stack trace y sugiere la corrección |
| **Predicción de saturación** | Basada en tendencia de CPU/RAM, estima cuándo un VPS llegará al límite |
| **Detección de patrones de fallo** | Identifica si los errores son recurrentes en el mismo cliente o repo |
| **Recomendación de optimización** | Sugiere mejoras de performance basadas en métricas de recursos |
| **Análisis de alto consumo** | Detecta clientes que consumen desproporcionadamente vs su plan |
| **Resumen de estado infra** | Genera un párrafo del estado general de la infraestructura para el reporte diario |

Toda ejecución IA registra métricas de coste según `01-constitution-v1.md §7`.

---

## Relaciones con otros módulos

| Módulo | Relación |
|---|---|
| **Clientes (ERP-006)** | Cada HGClient vincula con un Client del ERP |
| **Servicios (ERP-007)** | Servicio tipo `hosting` genera HGClient via Client Provisioning Bot |
| **Facturación (ERP-012)** | Billing sync: planes recurrentes HostingGuard → facturas ERP |
| **Finanzas (ERP-011)** | Revenue y costos de infraestructura HostingGuard |
| **Tickets (ERP-013)** | Alertas críticas pueden escalar a ticket de soporte automáticamente |
| **Reportes (ERP-014)** | Dashboard 9 HostingGuard Analytics consume datos de este módulo |
| **Laboratorio IA (ERP-010)** | Análisis automático de logs y predicción de saturación |

---

## Reglas críticas de negocio

### Regla 1 — HostingGuard mantiene autonomía operativa
El ERP no puede modificar configuración técnica de HostingGuard salvo provisioning inicial. Es solo lectura + escritura acotada.

### Regla 2 — Integración vía API, nunca acceso directo a DB
El ERP consume datos de HostingGuard exclusivamente via API pública/interna. Nunca acceso directo a base de datos de HostingGuard.

### Regla 3 — Todo deployment queda registrado
Cada build completado (exitoso o fallido) genera un `HGDeployment` en el ERP. El historial es permanente.

### Regla 4 — Todo subdominio debe rastrearse a cliente
Ningún subdominio puede existir en el ERP sin `hg_client_id` válido.

### Regla 5 — Todo plan hosting debe relacionarse a billing
Cada HGClient con `estado_cuenta = activa` debe tener un item en la facturación recurrente de ERP-012.

### Regla 6 — Alertas críticas nunca se ignoran
Una alerta de tipo `site_down` o `deploy_failed` en severidad `critical` sin resolución en 30 minutos escala automáticamente a ticket en ERP-013.

---

## Criterios de aceptación (DoD)

Para que esta spec se considere implementada:

- [ ] Schema Prisma: `HGClient`, `HGDeployment`, `HGSubdomain`, `HGResource`, `HGAlert`
- [ ] Sincronización via API HostingGuard con los 5 intervalos definidos
- [ ] Webhook receiver para deployment events en tiempo real
- [ ] Dashboard HostingGuard con los 14 KPIs
- [ ] Vista de Clientes Hosting con ficha completa por cliente
- [ ] Vista de Deployments con logs y opción de rollback
- [ ] Vista de Subdominios con estado DNS/SSL
- [ ] Vista SSL & Seguridad ordenada por urgencia
- [ ] Vista de Recursos con gráficos de CPU/RAM/storage
- [ ] Vista de Billing sincronizada con ERP-012
- [ ] Vista de Alertas con historial
- [ ] Auto Deployment Sync Bot via webhook
- [ ] Deployment Failure Alert Bot con notificación al owner
- [ ] SSL Expiration Bot con alerta 30 días antes
- [ ] Resource Monitor Bot con umbrales configurables
- [ ] Site Health Check Bot cada 5 minutos
- [ ] Billing Sync Bot horario
- [ ] Client Provisioning Bot al crear servicio tipo `hosting`
- [ ] Análisis IA de logs de deploy fallidos
- [ ] Escalación automática de alertas críticas a ERP-013 si > 30 min sin resolver
- [ ] Tests de integración contra API HostingGuard (mock en test)

---

## Próximos pasos

1. Aprobar esta spec
2. Crear `17-erp-016-inspyra-cloud.md`
3. Definir contrato de API HostingGuard: endpoints necesarios, autenticación, rate limits
4. Diseñar el webhook receiver en control-plane para eventos de deployment
5. Definir umbrales de alerta configurables por plan (CPU, RAM, storage)
6. Especificar el Client Provisioning Bot: qué datos mínimos necesita para crear una cuenta en HostingGuard
