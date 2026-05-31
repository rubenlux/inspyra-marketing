# ERP-020 — Integraciones Sociales & Publishing Hub

**Spec ID:** 21  
**Código:** ERP-020  
**Módulo:** Social & Publishing Hub  
**Estado:** 🟡 DRAFT v1  
**Fecha:** 2026-05-31  
**Autor:** Inspyra Team  

---

## Objetivo del módulo

El módulo Integraciones Sociales & Publishing Hub centraliza la conexión, gestión, publicación y seguimiento de redes sociales de clientes dentro del ecosistema Inspyra.

Permite conectar perfiles sociales, crear contenido, programarlo, publicarlo automáticamente y medir su rendimiento sin salir del ERP.

Es el **centro operativo de social media de la agencia**.

---

## Qué resuelve

| Sin módulo | Con módulo |
|---|---|
| Contenidos dispersos en múltiples herramientas | Redes conectadas dentro del ERP |
| Publicaciones manuales y propensas a error | Publicación automática programada |
| Cuentas repartidas y pérdida de accesos | Tokens centralizados y renovación automática |
| Poca trazabilidad editorial | Calendario unificado por cliente y red |
| Difícil seguimiento del rendimiento | Métricas integradas post-publicación |

---

## Principio central

> **Todo el contenido social debe poder gestionarse desde Inspyra — desde la idea hasta la publicación y el análisis.**

Sin salir del sistema.

---

## Redes sociales soportadas

| Red | Tipo |
|---|---|
| **Instagram Business** | Feed, Reels, Stories, Carrusel |
| **Facebook Page** | Feed, Video, Stories, Reels |
| **Meta Business Manager** | Gestión unificada Meta |
| **LinkedIn Company Page** | Feed, Artículo, Documento, Video |
| **TikTok Business** | Video, Stories |
| **YouTube Channel** | Video, Shorts |
| **Google Business Profile** | Posts, Novedades, Ofertas |
| **Pinterest** | Pines, Tableros |
| **X / Twitter** | Posts (futuro — baja prioridad) |

---

## Flujo general del módulo

```
Conexión de redes → Generación de contenido (IA) → Producción visual → Revisión interna → Programación → Publicación automática → Métricas → Reporting
```

### Paso 1 — Conexión de redes del cliente
Desde la ficha del cliente en ERP-006, se autoriza OAuth por cada red social.

### Paso 2 — Sincronización
Tokens, permisos y cuentas disponibles quedan registrados en ERP.

### Paso 3 — Creación de contenido
Laboratorio IA (ERP-010) genera captions, copies, CTAs, hashtags, scripts, calendarios.

### Paso 4 — Producción visual
El equipo de diseño produce la pieza gráfica y la adjunta al post.

### Paso 5 — Revisión interna
Workflow de aprobación antes de programar. Ningún post automático sin validación.

### Paso 6 — Programación
Fecha + hora + canal(es) destino definidos.

### Paso 7 — Publicación automática
`Auto Publish Bot` ejecuta en el horario programado.

### Paso 8 — Métricas
`Performance Pull Bot` trae métricas 24h y 7d post-publicación.

### Paso 9 — Reporting
Analytics disponibles en el módulo y en ERP-014 Reportes.

---

## Modelo de datos

### SocialConnection (Cuenta social conectada)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `client_id` | uuid (FK Client) | Cliente propietario de la cuenta |
| `red` | enum | instagram / facebook / linkedin / tiktok / youtube / google_business / pinterest / twitter |
| `nombre_cuenta` | string | Nombre visible de la cuenta |
| `username` | string | Handle / @usuario |
| `account_id_externo` | string | ID de la cuenta en la plataforma |
| `access_token` | text (encrypted) | Token de acceso OAuth (cifrado) |
| `refresh_token` | text (encrypted) | Refresh token (nullable, cifrado) |
| `token_expiration_at` | timestamp | Cuándo vence el access token |
| `scope_permisos` | string[] | Permisos otorgados (ej: `pages_manage_posts`) |
| `estado` | enum | connected / expired / disconnected / pending_verification / error |
| `ultima_sync_at` | timestamp | Última sincronización exitosa |
| `followers_count` | int | Seguidores actuales (sync periódico) |
| `created_at` | timestamp | — |
| `connected_by_id` | uuid (FK User) | Quién conectó la cuenta |

---

### SocialPost (Publicación)

#### Identificación

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `client_id` | uuid (FK Client) | Cliente |
| `connection_ids` | uuid[] | Cuentas destino (puede publicarse en varias redes) |
| `campana_id` | uuid (FK) | Campaña asociada (nullable) |
| `proyecto_id` | uuid (FK) | Proyecto asociado (nullable) |

#### Contenido

| Campo | Tipo | Descripción |
|---|---|---|
| `tipo` | enum | feed / reel / story / carrusel / video / short / articulo / pin / google_post |
| `caption` | text | Texto del post |
| `hashtags` | string[] | Hashtags |
| `link` | string | URL adjunto (nullable) |
| `cta` | string | Call to action (nullable) |
| `media_urls` | string[] | URLs de archivos media en S3 |
| `media_tipos` | string[] | Tipos MIME de cada media |

#### Estado y flujo

| Campo | Tipo | Descripción |
|---|---|---|
| `estado` | enum | draft / pendiente_diseno / pendiente_revision / pendiente_aprobacion / aprobado / programado / publishing / published / failed / cancelled |
| `creado_por_id` | uuid (FK User) | Creador del post |
| `asignado_disenio_id` | uuid (FK User) | Responsable de producción visual |
| `aprobado_por_id` | uuid (FK User) | Quién aprobó (nullable) |
| `aprobado_at` | timestamp | Cuándo fue aprobado (nullable) |

#### Programación y publicación

| Campo | Tipo | Descripción |
|---|---|---|
| `fecha_programada` | timestamp | Fecha y hora de publicación |
| `publicado_at` | timestamp | Fecha y hora real de publicación (nullable) |
| `post_id_externo` | string | ID del post en la plataforma destino (nullable) |
| `url_publicada` | string | URL pública del post publicado (nullable) |
| `error_mensaje` | text | Mensaje de error si `estado = failed` (nullable) |
| `intentos_publicacion` | int | Cantidad de intentos (para retry logic) |

#### Metadata

| Campo | Tipo | Descripción |
|---|---|---|
| `generado_por_ia` | boolean | Si el contenido fue generado por IA |
| `agent_execution_id` | uuid (FK) | Ejecución IA que generó el contenido (nullable) |
| `notas_internas` | text | Notas del equipo (nullable) |
| `created_at` | timestamp | — |
| `updated_at` | timestamp | — |

---

### SocialPostMetrics (Métricas post-publicación)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `post_id` | uuid (FK SocialPost) | Post al que pertenecen |
| `snapshot_at` | timestamp | Momento del snapshot |
| `likes` | int | — |
| `comments` | int | — |
| `shares` | int | — |
| `saves` | int | — |
| `impressions` | int | Impresiones totales |
| `reach` | int | Alcance (personas únicas) |
| `clicks` | int | Clicks en el post o link |
| `video_views` | int | Para videos y reels (nullable) |
| `engagement_rate_pct` | decimal (calculado) | (likes+comments+shares+saves) / reach × 100 |

---

### ContentLibraryItem (Biblioteca de contenido)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `client_id` | uuid (FK Client) | Cliente al que pertenece |
| `tipo` | enum | caption / hashtag_set / script / idea / asset_grafico / template_carrusel / copy_cta |
| `titulo` | string | Nombre identificador |
| `contenido` | text | Contenido del item |
| `red_objetivo` | enum[] | Redes para las que fue creado |
| `estado` | enum | borrador / aprobado / archivado |
| `generado_por_ia` | boolean | — |
| `tags` | string[] | Tags de búsqueda |
| `usado_en_posts` | int (calculado) | Cuántas veces se usó en publicaciones |
| `created_at` | timestamp | — |

---

## Estructura interna — Vistas del módulo

### Vista 1 — Social Connections
Panel de tarjetas por cliente mostrando todas sus redes conectadas con estado y token expiration. Botones: conectar nueva red, reconectar expirada, desconectar.

### Vista 2 — Content Planner (Calendario Editorial)
Calendario con vistas día / semana / mes. Cada slot muestra: cliente, red, tipo de contenido, estado con color. Filtros: por cliente, red, estado, responsable. Click en un slot → detalle del post.

| Color | Estado |
|---|---|
| 🔵 Azul | Borrador / pendiente |
| 🟡 Amarillo | En revisión / aprobación |
| 🟢 Verde | Programado |
| ✅ Tachado | Publicado |
| 🔴 Rojo | Fallido |

### Vista 3 — Content Library
Biblioteca con búsqueda por tipo, cliente, red, tags. Cards de contenido reutilizable. Creación de nuevos items, edición y archivo.

### Vista 4 — Publishing Queue
Lista de posts en cola ordenados por fecha de publicación. Filtros por estado, cliente, red. Acciones: editar, reprogramar, cancelar, publicar ahora.

### Vista 5 — Approval Workflow
Lista de posts pendientes de aprobación. Vista por etapa: `pendiente_revision` → `pendiente_aprobacion` → `aprobado`. Cada post muestra: cliente, red, preview del contenido, responsable.

### Vista 6 — Social Analytics
Métricas por cliente y por red. Comparativas período anterior. Top posts. Tendencia de engagement y alcance.

### Vista 7 — Historial por Cliente
Timeline completo de todas las publicaciones de un cliente con métricas finales. Accesible desde la ficha de cliente en ERP-006.

---

## KPIs del módulo (siempre visibles)

| KPI | Cálculo | Alerta |
|---|---|---|
| Cuentas conectadas | COUNT SocialConnection estado `connected` | — |
| Posts programados hoy | COUNT fecha_programada = hoy | — |
| Posts publicados hoy | COUNT publicado_at = hoy | — |
| Posts pendientes de aprobación | COUNT estado `pendiente_aprobacion` | si > 10 |
| Publicaciones fallidas | COUNT estado `failed` últimas 24h | si > 0 |
| Tokens por vencer ≤ 7 días | COUNT token_expiration_at ≤ now + 7d | si > 0 |
| Engagement promedio | AVG engagement_rate_pct mes actual | vs mes anterior |
| Clientes sin contenido programado | COUNT clientes activos sin posts próximos 7d | si > 3 |

---

## Agentes IA especializados (vía ERP-010)

| Agente | Función |
|---|---|
| **Instagram Content Agent** | Captions optimizados, hashtags, ideas de reels y carrusel para Instagram |
| **Facebook Content Agent** | Posts para Facebook Pages con copy adaptado al formato |
| **LinkedIn Copy Agent** | Contenido B2B profesional para LinkedIn Company Pages |
| **TikTok Script Agent** | Scripts de videos cortos con hooks virales |
| **Content Calendar Agent** | Genera calendario mensual completo para un cliente por red |
| **Hashtag Research Agent** | Investiga hashtags óptimos por nicho, volumen y competencia |
| **Trend Research Agent** | Detecta tendencias del momento en el nicho del cliente |
| **Caption Optimizer Agent** | Mejora un caption existente para mayor engagement |
| **Repurposing Agent** | Adapta contenido entre formatos: blog → carrusel, reel → LinkedIn post |
| **Engagement Optimization Agent** | Analiza posts históricos y recomienda qué cambiar para mejorar métricas |

Toda ejecución IA registra métricas de coste según `01-constitution-v1.md §7`.

---

## Bots y automatizaciones

| Bot | Trigger | Acción |
|---|---|---|
| **Auto Publish Bot** | `fecha_programada` alcanzada + estado `programado` | Publica en la red destino via API |
| **Scheduled Posting Bot** | Revisión diaria 7:00 AM | Verifica posts del día y confirma cola de publicación |
| **Social Sync Bot** | Cada 6h | Sincroniza followers y datos de cuenta de cada SocialConnection |
| **Token Refresh Bot** | Token vence en < 7 días | Renueva automáticamente si la red lo permite; alerta si requiere reconexión manual |
| **Failed Publish Retry Bot** | Post con estado `failed` | Reintenta hasta 3 veces con delay de 15 min; alerta al responsable si persiste |
| **Performance Pull Bot** | 24h y 7d después de cada publicación | Trae métricas del post publicado y crea `SocialPostMetrics` |
| **Best Time Suggestion Bot** | Al programar un nuevo post | Sugiere el horario con mayor engagement histórico del cliente en esa red |
| **Content Reminder Bot** | Diariamente 9:00 AM | Detecta clientes sin contenido programado en los próximos 7 días y alerta al community manager |

---

## Workflow de aprobación

```
draft → pendiente_diseno → pendiente_revision → pendiente_aprobacion → aprobado → programado → published
```

- **`pendiente_diseno`**: asignado al diseñador, esperando asset gráfico
- **`pendiente_revision`**: asset subido, esperando revisión del responsable de contenido
- **`pendiente_aprobacion`**: revisado internamente, esperando aprobación del manager o director
- **`aprobado`**: listo para programar — solo desde aquí puede moverse a `programado`

> **Regla de oro**: ningún post puede pasar a `programado` sin haber estado en `aprobado`. El `Auto Publish Bot` solo procesa posts en estado `programado`.

---

## Relaciones con otros módulos

| Módulo | Relación |
|---|---|
| **Clientes (ERP-006)** | Cada SocialConnection pertenece a un cliente; historial accesible desde la ficha |
| **Campañas (ERP-002)** | Posts pueden vincularse a campañas de marketing del cliente |
| **Laboratorio IA (ERP-010)** | Agentes especializados generan contenido; coste registrado en AgentExecution |
| **Equipo (ERP-018)** | Responsables de diseño, revisión y aprobación asignados por post |
| **Reportes (ERP-014)** | Analytics sociales consolidados por cliente y período |
| **Configuración (ERP-019)** | Tokens OAuth y credenciales de APIs sociales gestionados en Integraciones |
| **Email Marketing (ERP-018)** | Coordinación de campañas multicanal orgánico + email |

---

## Reglas críticas de negocio

### Regla 1 — Cada cuenta social pertenece a un cliente
Ninguna SocialConnection puede existir sin `client_id`. Las cuentas de Inspyra para su propio social media usan el cliente interno `Inspyra Internal`.

### Regla 2 — Todo contenido publicado queda registrado
Cada post publicado tiene su `SocialPost` en el ERP con `post_id_externo` y `url_publicada`. El historial es permanente.

### Regla 3 — Ninguna publicación automática sin aprobación previa
`Auto Publish Bot` solo procesa posts en estado `programado`. Un post solo llega a `programado` si pasó por `aprobado`. Esta cadena no puede saltarse.

### Regla 4 — Tokens siempre cifrados
`access_token` y `refresh_token` en `SocialConnection` se almacenan cifrados (misma capa que credenciales de `Integration` en ERP-019). Nunca se exponen por API.

### Regla 5 — Toda métrica vinculada al post
`SocialPostMetrics` siempre tiene `post_id`. No pueden existir métricas huérfanas. Si el post fue eliminado de la plataforma, las métricas se conservan en el ERP.

### Regla 6 — Retry con límite explícito
`Failed Publish Retry Bot` reintenta máximo 3 veces. Después de 3 fallos → estado `failed` definitivo + alerta al responsable. Sin reintentos infinitos que bloqueen la cola.

---

## Criterios de aceptación (DoD)

Para que esta spec se considere implementada:

- [ ] Schema Prisma: `SocialConnection`, `SocialPost`, `SocialPostMetrics`, `ContentLibraryItem`
- [ ] OAuth flow para Instagram, Facebook, LinkedIn, TikTok, YouTube, Google Business, Pinterest
- [ ] Token cifrado en reposo + Token Refresh Bot automático
- [ ] Content Planner con vistas día/semana/mes y código de colores por estado
- [ ] Content Library con búsqueda, tags y reutilización de items
- [ ] Publishing Queue con acciones de editar/reprogramar/cancelar/publicar ahora
- [ ] Approval Workflow completo: draft → diseño → revisión → aprobación → programado
- [ ] Auto Publish Bot con publicación vía API por red
- [ ] Failed Publish Retry Bot con máximo 3 intentos
- [ ] Performance Pull Bot en 24h y 7d post-publicación
- [ ] Token Refresh Bot con alerta si requiere reconexión manual
- [ ] Content Reminder Bot para clientes sin contenido próximo
- [ ] Dashboard con los 8 KPIs en tiempo real
- [ ] Historial completo por cliente accesible desde ERP-006
- [ ] Integración con 10 agentes IA del Laboratorio para generación de contenido
- [ ] Social Analytics con engagement rate, alcance y top posts por red
- [ ] Multi-red simultánea: publicar el mismo post en varias redes en un paso
- [ ] Vista de posts fallidos con log de error y opción de retry manual
- [ ] Exportar historial de publicaciones a CSV por cliente y período
- [ ] Tests unitarios ≥ 85% en servicios de publicación y retry

---

## Próximos pasos

1. Aprobar esta spec
2. Definir el **Unified Data Model spec** — schema Prisma completo de todos los módulos
3. Registrar credenciales OAuth de cada plataforma social en Configuración (ERP-019)
4. Definir el contrato de las APIs sociales: Meta Graph API, LinkedIn API, TikTok API, YouTube Data API
5. Diseñar la UI del Content Planner — es el componente más complejo (calendario drag & drop)
6. Especificar la lógica de multi-red: un post → múltiples SocialConnections, cada una con su `post_id_externo` propio
