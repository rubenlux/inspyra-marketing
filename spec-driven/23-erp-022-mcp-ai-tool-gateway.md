# ERP-022 — MCP & AI Tool Gateway

**Spec ID:** 23  
**Código:** ERP-022  
**Módulo:** MCP & AI Tool Gateway  
**Estado:** 🟡 DRAFT v1  
**Fecha:** 2026-05-31  
**Autor:** Inspyra Team  

---

## Objetivo del módulo

El módulo MCP & AI Tool Gateway centraliza toda la conexión entre Inspyra ERP, el Laboratorio IA, agentes inteligentes, herramientas externas, APIs, conectores MCP y sistemas de ejecución automatizada.

Es la **capa de orquestación técnica entre inteligencia artificial, herramientas externas y operación real del ERP**.

Permite que los agentes no solo piensen, sino que también actúen.

---

## Qué representa dentro del ecosistema

> Si Laboratorio IA (ERP-010) es el **cerebro** creativo y analítico, este módulo es las **manos** del sistema — porque ejecuta acciones reales en el mundo exterior.

Es el puente entre:

| Origen | Destino |
|---|---|
| Claude Agents / LLM | MCP Servers |
| Laboratorio IA (ERP-010) | External APIs |
| Automatizaciones del ERP | Third-party Tools |
| Business operations | Infrastructure layer |

---

## Principio central

> **Todo agente IA debe poder interactuar con herramientas externas mediante un gateway controlado, auditado y con costos visibles.**

La IA no debe quedar limitada a generar texto. Debe poder consultar, leer, escribir, crear, actualizar y ejecutar acciones externas — todo desde un entorno seguro con permisos explícitos.

---

## Qué es MCP dentro de Inspyra

**Model Context Protocol (MCP)** funciona como capa universal de conexión entre agentes y herramientas. Permite que un agente IA interactúe con sistemas externos de forma estructurada y tipada.

### Flujo MCP — ejemplo real

```
Usuario → "buscar leads abogados en Buenos Aires"
          ↓
     Sales Agent (ERP-010)
          ↓
     MCP Gateway verifica permisos del agente
          ↓
     Tool Routing Bot selecciona herramientas
          ↓
   ┌──────────────────────────────┐
   │ Google Maps MCP server       │
   │ Apollo API connector         │
   │ LinkedIn enrichment tool     │
   └──────────────────────────────┘
          ↓
   resultados consolidados
          ↓
   ERP-001 crea prospectos automáticamente
```

---

## Casos de uso reales dentro de Inspyra

### Caso 1 — Lead Generation
```
Sales Agent → Google Maps MCP → Website Scraper → Email Finder 
           → Enrichment Tool → ERP-001 crea Prospect automáticamente
```

### Caso 2 — SEO Audit
```
SEO Agent → Keyword API → SERP Analyzer → Competitor Scraper 
         → crea brief en Content Library (ERP-020)
```

### Caso 3 — Hosting Incident
```
Hosting Agent → HostingGuard API → Deployment Logs → IA resume error 
             → crea Ticket en ERP-013 si gravedad alta
```

### Caso 4 — Cloud Cost Control
```
Cloud Agent → AWS Cost Explorer API → detecta spike > 20% 
           → crea CloudAlert en ERP-016 + notifica director
```

### Caso 5 — Email Campaign Optimization
```
Email Marketing Agent → Analytics API → A/B test results 
                     → actualiza template ganador en ERP-021
```

---

## Modelo de datos

### MCPServer (Servidor MCP conectado)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `nombre` | string | Nombre del servidor (ej: "Google Maps MCP") |
| `descripcion` | text | Qué provee este servidor |
| `version` | string | Versión del protocolo (ej: `2024-11-05`) |
| `endpoint` | string | URL del servidor MCP |
| `transport` | enum | stdio / http / sse |
| `auth_method` | enum | none / api_key / oauth / jwt |
| `estado` | enum | online / offline / error / paused / maintenance / rate_limited |
| `owner_tecnico_id` | uuid (FK User) | Responsable técnico |
| `entorno` | enum | production / staging / development |
| `ultima_conexion_at` | timestamp | Última handshake exitosa |
| `ultima_ejecucion_at` | timestamp | Última tool call exitosa |
| `health_score` | decimal | % de llamadas exitosas últimas 24h |
| `latencia_ms_p95` | int | Latencia p95 |
| `created_at` | timestamp | — |

---

### Tool (Herramienta registrada)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `mcp_server_id` | uuid (FK MCPServer) | Servidor que provee esta tool (nullable si es API directa) |
| `tool_name` | string | Nombre técnico de la tool (ej: `google_maps_search`) |
| `display_name` | string | Nombre legible (ej: "Google Maps Search") |
| `provider` | string | Ej: Google, Apollo, AWS, Inspyra |
| `tool_type` | enum | search / read / write / create / update / delete / execute / enrich / analyze |
| `descripcion` | text | Qué hace esta herramienta |
| `input_schema` | jsonb | JSON Schema del input esperado |
| `output_schema` | jsonb | JSON Schema del output devuelto |
| `endpoint` | string | URL directa si no usa MCP (nullable) |
| `auth_method` | enum | none / api_key / oauth / jwt |
| `credential_id` | uuid (FK Credential) | Credencial en el vault |
| `estado` | enum | activa / inactiva / error / rate_limited |
| `cost_per_call_usd` | decimal | Costo estimado por llamada (nullable) |
| `rate_limit_per_min` | int | Límite de llamadas por minuto |
| `rate_limit_per_day` | int | Límite de llamadas por día |
| `calls_today` | int (sync) | Llamadas realizadas hoy |
| `error_rate_pct` | decimal | % de errores últimas 24h |
| `latencia_ms_avg` | int | Latencia promedio |
| `created_at` | timestamp | — |

---

### AgentToolPermission (Permisos por agente)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `agent_name` | string | Nombre del agente (ej: `seo_agent`, `sales_agent`) |
| `tool_id` | uuid (FK Tool) | Herramienta autorizada |
| `nivel_acceso` | enum | read_only / read_write / full |
| `max_calls_per_run` | int | Máximo de llamadas por ejecución |
| `max_calls_per_day` | int | Máximo de llamadas diarias |
| `requiere_aprobacion` | boolean | Si las ejecuciones requieren Human-in-the-Loop |
| `activo` | boolean | Si el permiso está habilitado |
| `created_at` | timestamp | — |

---

### ToolExecution (Log de ejecución)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `tool_id` | uuid (FK Tool) | Tool ejecutada |
| `agent_execution_id` | uuid (FK AgentExecution) | Ejecución del agente que llamó la tool |
| `agent_name` | string | Nombre del agente |
| `usuario_id` | uuid (FK User) | Usuario que inició la ejecución (nullable si es automático) |
| `payload_sent` | jsonb | Input enviado a la tool |
| `response_received` | jsonb | Output recibido (nullable si falló) |
| `exito` | boolean | Si la llamada fue exitosa |
| `error_code` | string | Código de error (nullable) |
| `error_message` | text | Mensaje de error (nullable) |
| `duracion_ms` | int | Tiempo de la llamada |
| `coste_usd` | decimal | Costo real de esta llamada |
| `retry_count` | int | Cantidad de reintentos realizados |
| `created_at` | timestamp | Momento de la ejecución |

---

### Credential (Vault de credenciales)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `nombre` | string | Nombre descriptivo (ej: "Apollo API Key - Producción") |
| `tipo` | enum | api_key / oauth_token / client_secret / webhook_secret / jwt |
| `valor` | text (encrypted) | Valor cifrado con AES-256 + KMS |
| `target_service` | string | Servicio al que pertenece |
| `expiration_at` | timestamp | Cuándo vence (nullable si no expira) |
| `ultimo_uso_at` | timestamp | Última vez que se usó |
| `rotation_policy_days` | int | Cada cuántos días rotar (nullable) |
| `created_at` | timestamp | — |
| `created_by_id` | uuid (FK User) | — |

> Las credenciales **nunca se devuelven por API**. Solo se permite crear (cifrado inmediato), rotar (sobrescribir) o revocar (eliminar). Nunca texto plano.

---

### ToolRateLimit (Control de rate limits en tiempo real)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `tool_id` | uuid (FK Tool) | — |
| `ventana` | enum | minute / hour / day / month |
| `llamadas_realizadas` | int | Llamadas en la ventana actual |
| `limite_configurado` | int | Límite de la ventana |
| `pct_uso` | decimal (calculado) | llamadas / limite × 100 |
| `ventana_reset_at` | timestamp | Cuándo se resetea el contador |
| `alertado` | boolean | Si ya se envió alerta por esta ventana |

---

## Permisos de herramientas por agente (matriz de referencia)

| Agente | Herramientas autorizadas |
|---|---|
| **Sales Agent** | Google Maps, Apollo, LinkedIn Enrichment, Email Finder, Website Scraper, CRM Search |
| **SEO Agent** | Keyword API, SERP Tracker, Search Console API, Competitor Scraper, SEO Analytics |
| **Marketing Agent** | Meta Ads API, Google Ads API, Analytics APIs, Content APIs, Social APIs |
| **Hosting Agent** | HostingGuard API, Deployment Tools, SSL Tools, DNS Check |
| **Cloud Agent** | AWS Cost Explorer, CloudWatch, ECS API, RDS API, S3 API |
| **Finance Agent** | Stripe API, Facturación interna, Cost Explorer AWS |
| **Content Agent** | Content APIs, Image Search, Stock Photos, Publishing APIs |
| **Research Agent** | Web Search, Web Scraper, News APIs, Trend APIs |
| **Support Agent** | Ticket System, Client DB (read), Deployment Logs |

---

## Estructura interna — Vistas del módulo

### Vista 1 — MCP Server Registry
Tabla de servidores con estado, health score, latencia, última conexión. Acciones: conectar, pausar, reconectar, ver logs.

### Vista 2 — Tool Registry
Catálogo de todas las herramientas con estado, costo por llamada, error rate, rate limit usage. Filtros por tipo, proveedor, estado.

### Vista 3 — Agent Tool Permissions
Matrix: eje Y = agentes, eje X = herramientas. Celdas = nivel de acceso. Editable por `super_admin`.

### Vista 4 — Execution Center (tiempo real)
Feed en vivo de tool executions: agente, tool, input resumido, resultado, duración, costo. Filtros por agente, tool, estado, período.

### Vista 5 — Logs & Audit Trail
Historial completo de `ToolExecution` con capacidad de drill-down al payload enviado y respuesta recibida. Exportable.

### Vista 6 — Credential Vault
Lista de credenciales con nombre, servicio, tipo, último uso, expiración. Sin mostrar el valor en ningún momento. Acciones: rotar, revocar.

### Vista 7 — Rate Limits & Cost Control
Dashboard de uso de rate limits en tiempo real por tool y por ventana temporal. Proyección de costo mensual por tool, por agente, por cliente.

---

## KPIs del módulo (siempre visibles)

| KPI | Cálculo | Alerta |
|---|---|---|
| MCP Servers online | COUNT estado `online` | si alguno `offline` > 5 min |
| Tools activas | COUNT estado `activa` | — |
| Executions hoy | COUNT ToolExecution hoy | — |
| Tasa de error hoy | COUNT failed / total × 100 | si > 5% |
| Costo tools hoy | SUM coste_usd hoy | vs umbral configurado |
| Costo tools mes | SUM coste_usd mes | si > 80% del budget |
| Rate limits cerca del tope | COUNT tools con pct_uso > 80% | si existe |
| Credenciales por vencer | COUNT expiration_at ≤ 7 días | si > 0 |

---

## Bots y automatizaciones

| Bot | Trigger | Acción |
|---|---|---|
| **Tool Health Check Bot** | Cada 2 min | Ping a cada MCPServer; actualiza `estado` y `health_score` |
| **API Failure Retry Bot** | `ToolExecution.exito = false` y `retry_count < 3` | Reintenta con delay exponencial (30s, 2m, 5m) |
| **Credential Expiration Bot** | `expiration_at` ≤ 7 días | Alerta al owner técnico para rotar; si < 24h → bloquea la tool |
| **Cost Alert Bot** | Costo tools del mes supera `alerta_sobrecoste_pct` del budget | Alerta al director + log en AuditLog (ERP-019) |
| **Tool Routing Bot** | Agente solicita capacidad de tipo `search` / `enrich` / etc. | Selecciona la tool más barata con menor error rate para la tarea |
| **Execution Monitor Bot** | Ejecución > 30s sin respuesta | Marca como timeout; alerta al owner técnico |
| **Tool Disable Bot** | Tool con `error_rate_pct > 25%` en 1h | Desactiva temporalmente + crea alerta + notifica |
| **Agent Failover Bot** | Tool primaria falla en `retry_count = 3` | Intenta tool alternativa del mismo tipo si existe en los permisos del agente |

---

## Capacidades IA del módulo

| Función IA | Descripción |
|---|---|
| **Tool selection inteligente** | Dado un objetivo del agente, selecciona el conjunto óptimo de tools a encadenar |
| **Tool chaining automático** | Encadena múltiples APIs para completar una tarea compleja (ej: search → enrich → create) |
| **Interpretación de resultados** | Parsea y estructura la respuesta cruda de una API externa para el contexto del ERP |
| **Error diagnosis** | Interpreta errores de API (HTTP 429, 403, timeout) y propone acción correctiva |
| **Cost optimization** | Detecta si hay una tool alternativa más barata para la misma capacidad |
| **Provider fallback** | Si el proveedor primario falla, selecciona automáticamente el fallback configurado |
| **Anomaly detection en toolchain** | Detecta patrones de fallo en secuencias de tools que individualmente parecen correctas |

---

## Relaciones con otros módulos

| Módulo | Relación |
|---|---|
| **Laboratorio IA (ERP-010)** | Toda AgentExecution que usa tools externas pasa por este módulo. `agent_execution_id` como FK |
| **Prospectos (ERP-001)** | Sales Agent → Lead Generation tools → crea prospectos |
| **Tickets (ERP-013)** | Hosting/Cloud Agent → detecta incidente → crea ticket automáticamente |
| **HostingGuard (ERP-015)** | Hosting Agent usa HostingGuard API como tool registrada |
| **Inspyra Cloud (ERP-016)** | Cloud Agent usa AWS APIs registradas en el Tool Registry |
| **Email Marketing (ERP-021)** | Email Agent usa Analytics APIs para optimizar campañas |
| **Social Hub (ERP-020)** | Content Agent usa Social APIs para publicar o leer métricas |
| **Reportes (ERP-014)** | Datos de uso de tools y costos disponibles en Analytics |
| **Configuración (ERP-019)** | `Credential` es compartida con `Integration.credenciales`; mismo vault, mismas reglas |
| **Finanzas (ERP-011)** | Costos de tools imputados como gasto operativo de la unidad de negocio correspondiente |

---

## Reglas críticas de negocio

### Regla 1 — Todo tool call queda auditado
Cada llamada a una herramienta externa genera un `ToolExecution` en el ERP. Payload + response + costo + duración. Sin excepciones. El audit trail de herramientas es tan importante como el de datos.

### Regla 2 — Todo acceso externo requiere permiso explícito
Ningún agente puede llamar a una tool que no esté en su `AgentToolPermission`. Si no hay permiso → la llamada se bloquea antes de salir del gateway. Esta regla es un invariante de arquitectura.

### Regla 3 — Todo costo debe medirse
Cada `ToolExecution` tiene `coste_usd`. Si la tool no informa su costo → se usa el `cost_per_call_usd` estimado de `Tool`. Sin costo visible → tool bloqueada para producción.

### Regla 4 — Credenciales nunca en texto plano
El vault cifra con AES-256 + KMS al crear. El valor nunca aparece en logs, APIs, UI ni payloads. Solo se puede rotar (sobrescribir cifrado) o revocar.

### Regla 5 — Errores siempre logueados
`ToolExecution.exito = false` siempre viene con `error_code` + `error_message`. Los errores silenciosos están prohibidos — si no hay respuesta legible del API, se registra el HTTP status + cuerpo crudo.

### Regla 6 — Agentes operan dentro de límites configurables
`AgentToolPermission.max_calls_per_run` y `max_calls_per_day` son hard limits. El gateway los verifica antes de ejecutar. Un agente en loop no puede agotar el quota de una API.

### Regla 7 — Ningún agente usa herramientas no autorizadas
Esta regla repite la Regla 2 intencionalmente con énfasis: no existe mecanismo de bypass. Ni super_admin puede bypasear el permission check en tiempo de ejecución — solo puede otorgar el permiso antes.

---

## Criterios de aceptación (DoD)

Para que esta spec se considere implementada:

- [ ] Schema Prisma: `MCPServer`, `Tool`, `AgentToolPermission`, `ToolExecution`, `Credential`, `ToolRateLimit`
- [ ] Gateway HTTP que intercepta toda llamada de agente a tool externa
- [ ] Permission check antes de cada ejecución (Regla 2 y 7)
- [ ] Vault de credenciales con cifrado AES-256 + KMS
- [ ] Registro automático de `ToolExecution` con payload, response, costo y duración
- [ ] MCP Server Registry con health score en tiempo real
- [ ] Tool Registry con catálogo de herramientas, costo y rate limit
- [ ] Matrix de permisos por agente editable desde la UI
- [ ] Execution Center con feed en vivo de tool calls
- [ ] Logs & Audit Trail con drill-down a payload + response
- [ ] Rate Limit tracking por tool y ventana temporal
- [ ] Tool Health Check Bot cada 2 minutos
- [ ] API Failure Retry Bot con delay exponencial (3 reintentos)
- [ ] Credential Expiration Bot con bloqueo a < 24h de expiración
- [ ] Tool Disable Bot cuando error_rate > 25% en 1h
- [ ] Agent Failover Bot a tool alternativa cuando la primaria falla
- [ ] Cost Alert Bot con umbral configurable
- [ ] Tool Routing Bot selecciona tool óptima por costo y error rate
- [ ] Dashboard con los 8 KPIs en tiempo real
- [ ] Costos de tools imputados a ERP-011 Finanzas por unidad de negocio
- [ ] Tests de integración con mock de MCP servers
- [ ] Tests de seguridad: verificar que permiso check no puede bypassearse

---

## Próximos pasos

1. Aprobar esta spec — **cierra el inventario completo de módulos del ERP Inspyra (22 módulos + Constitución)**
2. Crear el **Unified Data Model** — schema Prisma con las ~90 entidades del ERP completo
3. Crear el **API Design spec** — endpoints REST para todos los módulos
4. Definir la arquitectura del gateway: proceso separado vs middleware dentro de control-plane
5. Evaluar qué MCP servers implementar primero según ROI operativo
6. Integrar el gateway con `AgentExecution` de ERP-010 para trazabilidad completa
