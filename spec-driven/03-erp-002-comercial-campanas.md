# ERP-002 — Comercial / Campañas

**Spec ID:** 03  
**Código:** ERP-002  
**Módulo:** Comercial → Campañas  
**Estado:** 🟡 DRAFT v1  
**Fecha:** 2026-05-31  
**Autor:** Inspyra Team  

---

## Objetivo del módulo

El módulo Campañas administra toda la captación inbound de Inspyra.

Es el motor de generación de leads pagos y orgánicos que trae oportunidades nuevas hacia la agencia.

Su objetivo es generar flujo constante de leads calificados para Inspyra.

---

## Qué vive aquí

Campañas creadas **por Inspyra** para captar clientes nuevos:

- Meta Ads Lead Ads
- Google Ads Search
- Instagram campañas DM
- Facebook Messenger funnels
- WhatsApp click-to-chat campaigns
- Formularios web
- Landing pages de captación
- Campañas de remarketing
- Campañas de reactivación
- Email outreach inbound campaigns

---

## Qué NO vive aquí

> Las campañas ejecutadas **para clientes** no viven aquí.

Esas viven dentro de cada ficha cliente:

```
Cliente → Servicios → Marketing → Campañas Cliente
```

---

## Diferencia clave dentro del ERP

| Módulo | Dirección | Tipo |
|---|---|---|
| **Prospectos** | Los buscamos nosotros | Outbound |
| **Campañas** | Nos encuentran ellos | Inbound |

---

## Flujo del módulo

```
Crear campaña → Publicar → Captura lead → Bot responde → Clasificación → Derivación
```

### Paso 1 — Crear campaña

Ejemplos:

- `Inmobiliarias Buenos Aires — Lead Magnet`
- `Google Search — Desarrollo web empresas`
- `Instagram DM — Negocios locales`

### Paso 2 — Publicación

Conecta con canal:

- Meta Ads / Google Ads
- Instagram / Facebook / WhatsApp
- Landing page / Formulario web

### Paso 3 — Captura de lead

Un lead entra automáticamente desde:

| Canal | Mecanismo |
|---|---|
| Meta Ads | Lead Form nativo |
| Instagram | DM automatizado |
| Messenger | Chat Facebook |
| WhatsApp | Click-to-chat |
| Web | Formulario / CTA |
| Calendly | Agendamiento directo |

### Paso 4 — Bot responde

Respuesta inmediata automática en menos de **2 minutos**:

- Meta Bot
- Instagram DM Bot
- WhatsApp Bot
- Messenger Bot
- Web Form Bot

### Paso 5 — Clasificación automática

El sistema evalúa:

| Criterio | Descripción |
|---|---|
| Intención | Qué está buscando |
| Rubro | Industria de la empresa |
| Urgencia | Necesidad inmediata / futura |
| Tamaño empresa | Micro / pyme / empresa |
| Servicio buscado | Web / Software / Hosting / SEO / etc. |
| Presupuesto estimado | Rango detectado por conversación |

### Paso 6 — Derivación automática

Según comportamiento del lead:

| Caso | Derivación |
|---|---|
| Válido, no respondió | → Seguimiento |
| Válido, muestra interés | → Pipeline |
| Válido, quiere reunión | → Reuniones |
| No califica | → Descartado con nota |

---

## Bots del módulo

| Bot | Canal | Función |
|---|---|---|
| **Meta Ads Bot** | Meta Ads | Captura leads desde formularios Meta |
| **Messenger Bot** | Facebook Messenger | Responde chats entrantes automáticamente |
| **Instagram DM Bot** | Instagram DM | Gestiona conversaciones entrantes |
| **WhatsApp Bot** | WhatsApp | Clasifica conversaciones comerciales |
| **Web Form Bot** | Sitio web | Captura formularios del sitio Inspyra |
| **Auto Routing Bot** | Interno | Deriva automáticamente según score |

Cada bot debe registrar:

- Canal origen
- Lead generado (id)
- Tiempo de respuesta
- Clasificación asignada
- Derivación ejecutada
- Coste de ejecución IA (si aplica)

---

## Modelo de datos

### Campaña

#### Identificación

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Identificador único |
| `nombre` | string | Nombre interno de la campaña |
| `descripcion` | string | Descripción interna |

#### Canal

| Campo | Tipo | Valores posibles |
|---|---|---|
| `canal` | enum | `meta_ads` / `google_ads` / `instagram` / `facebook` / `whatsapp` / `email` / `landing_page` |
| `url_campana` | string | URL del anuncio / landing (opcional) |

#### Presupuesto

| Campo | Tipo | Descripción |
|---|---|---|
| `presupuesto_mensual_usd` | decimal | Budget mensual asignado |
| `gasto_actual_usd` | decimal | Gasto acumulado real |
| `coste_diario_usd` | decimal | Coste diario promedio |

#### Rendimiento

| Campo | Tipo | Descripción |
|---|---|---|
| `impresiones` | int | Total impresiones |
| `clics` | int | Total clics |
| `ctr` | decimal | Click-through rate (%) |
| `cpc_usd` | decimal | Coste por clic |
| `cpl_usd` | decimal | Coste por lead |
| `coste_por_reunion_usd` | decimal | Coste por reunión agendada |
| `coste_por_cliente_usd` | decimal | Coste por cliente cerrado (CAC) |

#### Captación

| Campo | Tipo | Descripción |
|---|---|---|
| `leads_generados` | int | Total leads captados |
| `leads_validos` | int | Leads que calificaron |
| `leads_descartados` | int | Leads no calificados |
| `reuniones_agendadas` | int | Reuniones generadas por campaña |
| `clientes_cerrados` | int | Clientes cerrados atribuidos |

#### Negocio

| Campo | Tipo | Descripción |
|---|---|---|
| `revenue_generado_usd` | decimal | Facturación total atribuida |
| `roas` | decimal | Return on Ad Spend |
| `cac_usd` | decimal | Customer Acquisition Cost |

#### Gestión

| Campo | Tipo | Descripción |
|---|---|---|
| `owner_id` | uuid (FK User) | Responsable de la campaña |
| `estado` | enum | Ver estados posibles |
| `fecha_inicio` | date | Fecha de lanzamiento |
| `fecha_cierre` | date | Fecha de finalización (nullable) |
| `created_at` | timestamp | Fecha de creación |
| `updated_at` | timestamp | Última actualización |

---

### Lead (entidad derivada de Campaña)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Identificador único |
| `campana_id` | uuid (FK) | Campaña de origen |
| `nombre` | string | Nombre del lead |
| `email` | string | Email |
| `telefono` | string | Teléfono / WhatsApp |
| `empresa` | string | Empresa del lead (opcional) |
| `mensaje` | string | Mensaje inicial |
| `canal_origen` | enum | Canal por el que llegó |
| `bot_respondio` | boolean | Si el bot ya respondió |
| `tiempo_respuesta_seg` | int | Segundos hasta primera respuesta |
| `clasificacion` | enum | válido / no_califica / pendiente |
| `derivado_a` | enum | seguimiento / pipeline / reuniones / descartado |
| `created_at` | timestamp | Fecha de captura |

---

## Estados posibles de una campaña

| Estado | Descripción |
|---|---|
| `borrador` | Creada pero no publicada |
| `activa` | Publicada y recibiendo leads |
| `pausada` | Temporalmente detenida |
| `en_revision` | Bajo análisis de rendimiento |
| `finalizada` | Completó su ciclo |
| `escalada` | Requiere atención urgente (bajo rendimiento) |
| `archivada` | Histórico, no activa |

---

## KPIs del módulo

| KPI | Descripción |
|---|---|
| Leads generados | Total leads captados (periodo) |
| CPL medio | Coste por lead promedio |
| CTR medio | Click-through rate promedio |
| Reuniones generadas | Reuniones originadas por campañas |
| Coste por reunión | CPL avanzado |
| CAC | Coste por cliente adquirido |
| Clientes nuevos | Clientes cerrados atribuidos |
| ROAS | Return on Ad Spend global |
| Revenue atribuido | Facturación generada por campañas |

---

## Filtros disponibles

- Canal (meta / google / instagram / whatsapp / web / email)
- Fecha (rango inicio-fin)
- Owner responsable
- Presupuesto (rango)
- Estado
- ROAS (mínimo)
- Servicio promocionado
- Fuente
- Activa / Inactiva

---

## Automatizaciones

| Automatización | Trigger | Acción |
|---|---|---|
| **Auto Capture** | Lead entra por cualquier canal | Crea registro Lead en el ERP |
| **Auto Reply** | Lead capturado | Bot responde en < 2 min |
| **Auto Qualification** | Post-respuesta del bot | Clasifica: válido / no califica |
| **Auto Routing** | Lead clasificado como válido | Deriva a Seguimiento / Pipeline / Reuniones |
| **Auto Follow-up Trigger** | Lead no responde en 24h | Crea tarea en Seguimiento |
| **Auto Meeting Trigger** | Lead califica con score alto | Sugiere agendar reunión |
| **Auto Conversion Tracking** | Cliente cerrado | Atribuye conversión a campaña origen |

---

## Relaciones con otros módulos

| Módulo | Relación |
|---|---|
| **Prospectos** | No comparte base directa — outbound vs inbound separados |
| **Seguimiento** | Todo lead válido pasa a Seguimiento post-primer-contacto |
| **Pipeline** | Lead calificado → crea Deal en Pipeline |
| **Reuniones** | Lead con alta intención → agenda reunión automáticamente |
| **Clientes** | Lead cerrado → se convierte en Cliente con atribución a campaña |

---

## Regla de negocio crítica

> **Todo lead captado debe recibir respuesta inmediata.**

| Regla | Valor |
|---|---|
| Tiempo máximo de respuesta | **< 2 minutos** desde ingreso |
| Tolerancia sin respuesta | **0** — ningún lead puede quedar sin contestar |
| Escalado automático | Si no responde en 5 min → alerta al owner |

---

## Criterios de aceptación (DoD)

Para que esta spec se considere implementada:

- [ ] CRUD completo de campañas (crear, editar, pausar, finalizar, archivar)
- [ ] Vista de tabla con filtros funcionales
- [ ] KPIs del dashboard actualizados en tiempo real
- [ ] Entidad Lead creada y vinculada a campaña
- [ ] Tiempo de respuesta registrado por cada lead
- [ ] Al menos 1 bot activo (Web Form Bot como mínimo viable)
- [ ] Auto Routing funcional: lead válido → Seguimiento
- [ ] Atribución de conversión: cliente cerrado → campaña origen registrada
- [ ] Exportar leads a CSV
- [ ] Audit trail de campañas (quién creó, editó, pausó)
- [ ] Métricas de coste IA registradas si se usa clasificación automática

---

## Próximos pasos

1. Aprobar esta spec con el equipo
2. Crear `04-erp-003-comercial-seguimiento.md`
3. Definir schema Prisma para entidades `Campaign` y `Lead`
4. Diseñar endpoints REST (`/api/campaigns`, `/api/leads`)
5. Definir integración con Meta Ads API y WhatsApp Business API
