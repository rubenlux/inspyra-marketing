# ERP-021 — Email Marketing

**Spec ID:** 22  
**Código:** ERP-021  
**Módulo:** Email Marketing  
**Estado:** 🟡 DRAFT v1  
**Fecha:** 2026-05-31  
**Autor:** Inspyra Team  

---

## Objetivo del módulo

El módulo Email Marketing centraliza la creación, gestión, automatización, envío y análisis de campañas de email marketing realizadas desde Inspyra.

Es la **unidad especializada en comunicación masiva por correo electrónico** orientada a conversión, fidelización, automatización comercial y remarketing.

Permite operar campañas propias de Inspyra y campañas para clientes externos desde una misma plataforma.

---

## Qué representa dentro del ecosistema

Email Marketing es un **servicio comercial independiente** dentro de Inspyra. Puede venderse como servicio autónomo a:

- Clientes actuales de la agencia
- Clientes de HostingGuard e Inspyra Cloud
- Otras agencias, ecommerce, negocios locales, marcas personales

**No depende** de que el cliente tenga web desarrollada por Inspyra.

---

## Distinción crítica — Email Marketing vs Inspyra Mail

| Email Marketing (ERP-021) | Inspyra Mail (ERP-017) |
|---|---|
| Campañas masivas y automatizaciones | Comunicación 1:1 transaccional |
| Listas de cientos o miles de contactos | Bandejas del equipo Inspyra |
| Open rate, CTR, conversiones | Historial por cliente |
| Pool de IPs dedicado bulk | Pool de IPs transaccional |
| SES bulk configuration set | SES transactional configuration set |

**Nunca comparten el mismo pool de IPs ni credenciales SES** (regla de reputación definida en CLAUDE.md).

---

## Principio central

> **Toda campaña de email debe poder crearse, enviarse, automatizarse y medirse desde Inspyra. Desde la base de datos hasta el reporte final.**

---

## Casos de uso principales

| Caso | Descripción |
|---|---|
| Newsletter mensual | Comunicación regular al listado del cliente |
| Campaña lanzamiento | Anuncio de nuevo producto o servicio |
| Remarketing | Reactivar contactos que visitaron el sitio |
| Recuperación leads fríos | Secuencia a leads sin interacción > 30 días |
| Venta hosting/cloud | Upsell a clientes HostingGuard e Inspyra Cloud |
| Onboarding automatizado | Secuencia de bienvenida a nuevos suscriptores |
| Post venta | Seguimiento y fidelización post compra |
| Re-engagement | Reactivar contactos inactivos |
| Lead nurturing | Nutrición comercial hasta conversión |

---

## Modelo de datos

### Campaign (Campaña)

#### Identificación

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `client_id` | uuid (FK Client) | Cliente para quien se ejecuta |
| `nombre` | string | Nombre interno de la campaña |
| `tipo` | enum | one_shot / sequence_step / ab_test / automated |

#### Contenido del email

| Campo | Tipo | Descripción |
|---|---|---|
| `asunto` | string | Subject line del email |
| `preheader` | string | Texto de previsualización (nullable) |
| `sender_name` | string | Nombre del remitente (ej: "Rubén de Inspyra") |
| `sender_email` | string | Email remitente (ej: `hello@inspyra.cloud`) |
| `reply_to` | string | Email de respuesta (nullable) |
| `template_id` | uuid (FK EmailMktTemplate) | Template usado |
| `html_content` | text | HTML renderizado del email |
| `text_content` | text | Versión texto plano |

#### Audiencia

| Campo | Tipo | Descripción |
|---|---|---|
| `list_ids` | uuid[] | Listas incluidas |
| `segment_id` | uuid (FK) | Segmento dinámico aplicado (nullable) |
| `exclusion_list_ids` | uuid[] | Listas excluidas del envío |
| `total_destinatarios` | int (calculado) | Contactos únicos elegibles |

#### Estado y fechas

| Campo | Tipo | Descripción |
|---|---|---|
| `estado` | enum | draft / scheduled / sending / sent / completed / paused / cancelled / failed |
| `fecha_programada` | timestamp | Cuándo se envía (nullable si inmediato) |
| `fecha_envio_real` | timestamp | Cuándo inició el envío efectivo |
| `fecha_completado` | timestamp | Cuándo terminó el envío |
| `sending_domain` | string | Dominio de envío usado |

#### Tracking y UTMs

| Campo | Tipo | Descripción |
|---|---|---|
| `utm_source` | string | Ej: `email` |
| `utm_medium` | string | Ej: `newsletter` |
| `utm_campaign` | string | Nombre de la campaña |
| `track_opens` | boolean | Si trackea aperturas (default: true) |
| `track_clicks` | boolean | Si trackea clicks (default: true) |

#### Metadata

| Campo | Tipo | Descripción |
|---|---|---|
| `generado_por_ia` | boolean | Si el contenido fue asistido por IA |
| `agent_execution_id` | uuid (FK) | Ejecución IA de copywriting (nullable) |
| `ab_test_variant` | string | Identificador de variante A/B (nullable) |
| `ab_test_parent_id` | uuid (FK) | Campaña padre del test A/B (nullable) |
| `created_by_id` | uuid (FK User) | — |
| `created_at` | timestamp | — |
| `updated_at` | timestamp | — |

---

### CampaignMetrics (Métricas por campaña)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `campaign_id` | uuid (FK Campaign) | — |
| `snapshot_at` | timestamp | Momento del snapshot |
| `sent` | int | Emails enviados |
| `delivered` | int | Entregados exitosamente |
| `delivery_rate_pct` | decimal | delivered / sent × 100 |
| `opened` | int | Aperturas totales |
| `unique_opens` | int | Contactos únicos que abrieron |
| `open_rate_pct` | decimal | unique_opens / delivered × 100 |
| `clicks` | int | Clicks totales |
| `unique_clicks` | int | Contactos únicos que clickearon |
| `ctr_pct` | decimal | unique_clicks / delivered × 100 |
| `ctor_pct` | decimal | unique_clicks / unique_opens × 100 |
| `replies` | int | Respuestas recibidas |
| `hard_bounces` | int | Rebotes permanentes |
| `soft_bounces` | int | Rebotes temporales |
| `bounce_rate_pct` | decimal | (hard + soft) / sent × 100 |
| `unsubscribes` | int | Bajas |
| `unsubscribe_rate_pct` | decimal | unsubscribes / delivered × 100 |
| `spam_reports` | int | Reportes de spam |
| `conversions` | int | Conversiones atribuidas (nullable) |
| `revenue_atribuido_usd` | decimal | Revenue atribuido a la campaña (nullable) |

---

### Contact (Contacto de email marketing)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `client_id` | uuid (FK Client) | Lista a la que pertenece |
| `email` | string | Email único |
| `nombre` | string | Nombre (nullable) |
| `apellido` | string | Apellido (nullable) |
| `empresa` | string | Empresa (nullable) |
| `cargo` | string | Cargo (nullable) |
| `pais` | string | País (nullable) |
| `tags` | string[] | Tags de segmentación |
| `estado_suscripcion` | enum | activo / unsubscribed / bounced / spam / pending_confirmation |
| `fuente` | string | De dónde vino (ej: `formulario_web`, `importacion_csv`, `landing_X`) |
| `engagement_score` | decimal | Score de engagement (calculado por actividad) |
| `ultima_apertura_at` | timestamp | Último email abierto (nullable) |
| `ultimo_click_at` | timestamp | Último click (nullable) |
| `fecha_alta` | timestamp | Cuándo se suscribió |
| `unsubscribed_at` | timestamp | Cuándo se dio de baja (nullable) |

---

### ContactList (Lista de contactos)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `client_id` | uuid (FK Client) | Cliente propietario |
| `nombre` | string | Nombre de la lista |
| `descripcion` | text | (nullable) |
| `tipo` | enum | estatica / dinamica_segmento / importacion |
| `total_contactos` | int (calculado) | — |
| `activos` | int (calculado) | Con estado `activo` |
| `created_at` | timestamp | — |

---

### Segment (Segmento dinámico)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `client_id` | uuid (FK Client) | — |
| `nombre` | string | Ej: "Leads calientes últimos 30 días" |
| `reglas` | jsonb | Array de condiciones: `[{campo, operador, valor}]` |
| `total_contactos` | int (calculado) | Se recalcula en cada uso |

---

### EmailMktTemplate (Template de email marketing)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `client_id` | uuid (FK) | Propietario (nullable si es global de Inspyra) |
| `nombre` | string | Nombre identificador |
| `categoria` | enum | newsletter / promo / onboarding / bienvenida / postventa / nurturing / reengagement / otro |
| `html_content` | text | HTML del template con variables `{{nombre}}`, `{{empresa}}` |
| `preview_url` | string | URL de preview generada (nullable) |
| `activo` | boolean | — |
| `created_at` | timestamp | — |

---

### EmailAutomation (Secuencia automatizada)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `client_id` | uuid (FK Client) | — |
| `nombre` | string | Nombre de la automatización |
| `trigger` | enum | nuevo_suscriptor / tag_asignado / campo_fecha / lead_inactivo_dias / post_compra / manual |
| `activa` | boolean | — |
| `pasos` | jsonb | `[{delay_hours, campaign_id, condicion_parar}]` |
| `total_enrollments` | int (calculado) | Contactos en la secuencia |
| `created_at` | timestamp | — |

---

### DeliverabilityStatus (Estado de entregabilidad)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `sending_domain` | string | Dominio de envío |
| `spf_status` | enum | pass / fail / neutral / unknown |
| `dkim_status` | enum | pass / fail / unknown |
| `dmarc_status` | enum | pass / fail / none / unknown |
| `ip_reputation_score` | decimal | Score 0-100 (100 = excelente) |
| `bounce_rate_30d_pct` | decimal | Tasa de rebotes últimos 30 días |
| `complaint_rate_30d_pct` | decimal | Tasa de spam complaints últimos 30 días |
| `checked_at` | timestamp | Último chequeo |

---

## Estructura interna — Vistas del módulo

### Vista 1 — Dashboard General
KPIs ejecutivos del módulo con gráficos de tendencia de open rate, CTR y delivery rate.

### Vista 2 — Campaigns
Tabla de todas las campañas con filtros por cliente, estado, período. Click → detalle completo con métricas en tiempo real.

### Vista 3 — Contact Lists & Segmentation
Gestión de listas. Importación CSV. Builder de segmentos dinámicos con preview del tamaño del segmento antes de enviar.

### Vista 4 — Templates
Biblioteca de templates con categorías. Editor HTML + preview visual. Duplicar, editar, archivar.

### Vista 5 — Automations
Lista de secuencias activas con funnel visual: cuántos contactos en cada paso, tasa de progresión, tasa de salida. CRUD de automatizaciones.

### Vista 6 — Deliverability Center
Estado DNS/SPF/DKIM/DMARC por dominio de envío. Métricas de reputación IP. Historial de bounce rate y complaint rate. Alertas técnicas.

### Vista 7 — Analytics & Performance
Métricas por campaña con comparativas. Top campañas por open rate, CTR, conversiones. Heatmap de mejor horario de envío por cliente.

---

## KPIs del módulo (siempre visibles)

| KPI | Cálculo | Alerta |
|---|---|---|
| Campaigns activas | COUNT estado `sending` | — |
| Campaigns programadas | COUNT estado `scheduled` | — |
| Emails enviados hoy | SUM `sent` de hoy | — |
| Emails enviados mes | SUM `sent` mes actual | vs mes anterior |
| Delivery rate | SUM delivered / SUM sent × 100 | si < 95% |
| Open rate promedio | AVG open_rate_pct mes | si < 20% |
| CTR promedio | AVG ctr_pct mes | si < 2% |
| Bounce rate | AVG bounce_rate_pct últimos 7d | si > 2% |
| Unsubscribe rate | AVG unsubscribe_rate_pct últimas campañas | si > 0.5% |
| Spam complaints | AVG complaint_rate_30d_pct | si > 0.08% |

---

## Bots y automatizaciones

| Bot | Trigger | Acción |
|---|---|---|
| **Scheduled Send Bot** | `fecha_programada` alcanzada + estado `scheduled` | Inicia envío masivo via SES bulk |
| **Contact Segment Bot** | Antes de cada envío | Evalúa reglas del segmento dinámico y filtra la lista final |
| **Open Tracking Bot** | Pixel 1×1 cargado en email abierto | Registra apertura en `CampaignMetrics` |
| **Click Tracking Bot** | Click en link trackeado | Registra click + redirect al destino final |
| **Bounce Cleanup Bot** | Hard bounce recibido de SES | Actualiza `Contact.estado_suscripcion = bounced`; suprime futuras campañas |
| **Unsubscribe Handler Bot** | Unsubscribe link clickeado | Actualiza `Contact.estado_suscripcion = unsubscribed` + SES suppression list |
| **Best Send Time Bot** | Al crear una nueva campaña | Analiza historial de opens del segmento y sugiere horario óptimo |
| **Campaign Performance Bot** | 24h y 7d después del envío | Genera snapshot final de `CampaignMetrics` + alerta si métricas por debajo de umbral |

---

## Capacidades IA del módulo

| Función IA | Descripción |
|---|---|
| **Generación de subject lines** | Propone 3-5 variantes para A/B testing con predicción de open rate |
| **Redacción de email completo** | Genera el email a partir de brief: objetivo + audiencia + CTA |
| **Optimización de copy** | Mejora un email existente para mayor conversión |
| **Personalización dinámica** | Adapta el tono y contenido según el segmento (B2B vs B2C, frío vs caliente) |
| **Predicción de apertura** | Estima el open rate esperado basado en historial del segmento |
| **Predicción de CTR** | Estima clicks esperados basado en CTA y audiencia |
| **Segmentación inteligente** | Sugiere el mejor segmento para un objetivo de campaña específico |
| **A/B test recomendado** | Propone qué variable testear primero (subject, CTA, horario, sender name) |
| **Análisis de resultados** | Narrativa de qué funcionó, qué no y qué probar en la próxima campaña |

Toda ejecución IA registra métricas de coste según `01-constitution-v1.md §7`.

---

## Reglas críticas de negocio

### Regla 1 — Consentimiento obligatorio
Todo contacto debe tener `estado_suscripcion = activo` para recibir campañas. No existe envío a contactos sin consentimiento explícito. Violar esta regla puede resultar en suspensión de la cuenta SES.

### Regla 2 — Toda campaña es auditable
Cada envío genera su `CampaignMetrics` con los datos de la lista al momento del envío. Aunque los contactos cambien después, los datos del envío quedan intactos.

### Regla 3 — Unsubscribe se procesa en el momento
`Unsubscribe Handler Bot` actúa inmediatamente. El contacto no puede volver a recibir campañas hasta que vuelva a suscribirse explícitamente. Este timing es un requisito legal (CAN-SPAM, GDPR).

### Regla 4 — Hard bounce = supresión automática
Un hard bounce actualiza `Contact.estado_suscripcion = bounced` y lo agrega a la lista de supresión de SES. Nunca se intenta enviar de nuevo a un hard bounce.

### Regla 5 — Métricas siempre vinculadas a campaña
Ningún `CampaignMetrics` puede existir sin `campaign_id`. Las métricas son por campaña, no globales.

### Regla 6 — Deliverability es monitoreo continuo
`DeliverabilityStatus` se verifica automáticamente. Si `complaint_rate_30d_pct > 0.08%` o `bounce_rate_30d_pct > 2%` → alertas inmediatas + bloqueo preventivo de nuevos envíos hasta revisión manual.

### Regla 7 — Pool de IPs bulk estrictamente separado de transaccional
Este módulo usa un configuration set SES distinto al de Inspyra Mail (ERP-017) y HostingGuard notifications. La separación es un invariante de infraestructura, no opcional.

---

## Criterios de aceptación (DoD)

Para que esta spec se considere implementada:

- [ ] Schema Prisma: `Campaign`, `CampaignMetrics`, `Contact`, `ContactList`, `Segment`, `EmailMktTemplate`, `EmailAutomation`, `DeliverabilityStatus`
- [ ] Envío masivo via SES bulk con configuration set dedicado
- [ ] Importación de contactos CSV con validación de emails
- [ ] Builder de segmentos dinámicos con preview del tamaño antes de enviar
- [ ] Editor de templates HTML con variables de sustitución y preview visual
- [ ] Approval flow antes del envío (revisión interna)
- [ ] Programación de envíos con timezone del cliente
- [ ] Open tracking via pixel 1×1
- [ ] Click tracking via URL redirect
- [ ] Bounce Cleanup Bot con actualización automática de estado del contacto
- [ ] Unsubscribe Handler Bot con procesamiento inmediato
- [ ] Campaign Performance Bot con snapshots 24h y 7d
- [ ] Deliverability Center con estado SPF/DKIM/DMARC en tiempo real
- [ ] Alerta automática si complaint rate > 0.08% o bounce rate > 2%
- [ ] A/B test: crear dos variantes de campaña con distribución configurable
- [ ] Automations con builder de secuencias paso a paso
- [ ] Generación IA de subject lines con predicción de open rate
- [ ] Generación IA de email completo desde brief
- [ ] Analytics con comparativa período anterior
- [ ] Exportar métricas de campaña a CSV/PDF
- [ ] Pool SES bulk completamente separado del transaccional
- [ ] Tests unitarios ≥ 85% en servicios de envío, tracking y supresión

---

## Próximos pasos

1. Aprobar esta spec — completa el inventario de módulos del ERP
2. Crear el **Unified Data Model spec** — schema Prisma con todas las entidades
3. Crear el **API Design spec** — endpoints REST para todos los módulos
4. Configurar el SES configuration set bulk separado del transaccional
5. Definir la infraestructura de tracking: servidor de pixel 1×1 y redirect handler
6. Diseñar el builder visual de templates (¿editor WYSIWYG o bloques?)
7. Especificar el modelo de atribución de revenue a campañas
