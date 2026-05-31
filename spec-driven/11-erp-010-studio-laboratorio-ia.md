# ERP-010 — Studio / Laboratorio IA

**Spec ID:** 11  
**Código:** ERP-010  
**Módulo:** Studio → Laboratorio IA  
**Estado:** 🟡 DRAFT v1  
**Fecha:** 2026-05-31  
**Autor:** Inspyra Team  

---

## Objetivo del módulo

El módulo Laboratorio IA es el **centro de inteligencia artificial aplicada** de Inspyra.

Su función es crear, ejecutar, supervisar, medir y evolucionar agentes especializados que asisten o automatizan trabajo dentro de la agencia.

Es el **sistema operativo de agentes IA internos** de Inspyra.

---

## Qué representa dentro del ERP

El Laboratorio IA **no es solo un módulo** — es una **capa transversal** que puede interactuar con todo el ERP:

```
Comercial → Prospectos · Campañas · Seguimiento · Pipeline · Reuniones
Delivery  → Clientes · Servicios · Proyectos · Tareas
Operations → Finanzas · HostingGuard · Tickets · Reportes
```

---

## Propósito estratégico

> Transformar conocimiento + procesos + contexto interno en **ejecución asistida por agentes**.

Con foco en: productividad · velocidad · automatización · calidad · trazabilidad · rentabilidad.

---

## Principios del módulo

### La IA trabaja dentro del negocio, no fuera de él

Los agentes no operan aislados. Trabajan usando el contexto real de Inspyra.

Cada agente debe conocer: el cliente · el proyecto · el objetivo · el historial · las reglas · los límites · el presupuesto permitido.

### Human-in-the-loop obligatorio

Los agentes **pueden**: sugerir, investigar, producir, ejecutar, analizar, automatizar.

El equipo **siempre puede**: revisar, aprobar, editar, detener, corregir.

### Toda IA debe ser rentable

Cada ejecución debe poder responder: qué hizo · para quién · qué modelo usó · cuánto costó · cuánto tiempo ahorró · qué retorno generó.

---

## Arquitectura de agentes

```
                    ┌─────────────────────────────┐
                    │   Core Agent Orchestrator    │
                    │  Recibe · Entiende · Decide  │
                    │  Coordina · Consolida        │
                    └──────────────┬──────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          ▼                        ▼                        ▼
   Agentes de         Agentes de Delivery        Agentes de
   Comercial          y Producción               Infraestructura
```

### Core Agent Orchestrator

El cerebro principal del sistema:

1. Recibe la solicitud del usuario o del sistema
2. Entiende la intención y el contexto
3. Evalúa qué agente(s) ejecutar
4. Coordina subagentes si la tarea es compuesta
5. Consolida y valida los resultados
6. Devuelve el output final + registro de coste

---

## Catálogo de agentes

| Agente | Área | Capacidades principales |
|---|---|---|
| **Marketing Strategist Agent** | Comercial | Estrategia de marketing, posicionamiento, plan de contenidos |
| **SEO Agent** | Comercial / Web | SEO técnico, on-page, local, auditorías, keywords, content gaps |
| **Ads Agent** | Comercial | Meta Ads, Google Ads, copies, optimización, análisis de performance |
| **Content Agent** | Producción | Blogs, web, landing pages, copys, posts, secuencias de contenido |
| **Copywriting Agent** | Producción | Ventas, anuncios, emails, landing copy, funnels de conversión |
| **Outreach Agent** | Comercial | Cold outreach, emails, LinkedIn, DMs, WhatsApp comercial |
| **Design Agent** | Producción | Dirección visual, branding, UX/UI, creatividades, sistemas gráficos |
| **Research Agent** | Estrategia | Investigación de mercado, competidores, benchmarking, análisis web |
| **Web Strategy Agent** | Web | Estructura de sitios, landing strategy, arquitectura de conversión |
| **Software Architecture Agent** | Tech | Arquitectura técnica, sistemas, APIs, integraciones, ERPs, infra |
| **HostingGuard Infra Agent** | Infra | Deployments, hosting, SSL, servidores, containers, monitoreo |
| **Finance Agent** | Finanzas | Costes IA, rentabilidad, MRR, cashflow, forecast, pricing, unit economics |
| **Analytics Agent** | Reporting | KPIs, reportes, dashboards, insights, anomalías |
| **Automation Architect Agent** | Sistema | Workflows, bots, integraciones, automatización del ERP |

---

## Modelo de datos

### Agente (entidad principal)

#### Identificación

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Identificador único |
| `nombre` | string | Nombre del agente (ej: "SEO Agent") |
| `rol` | string | Rol corto (ej: "Especialista SEO") |
| `descripcion` | text | Qué hace y cuándo usarlo |
| `objetivo_operativo` | text | Propósito específico dentro del negocio |

#### Configuración

| Campo | Tipo | Descripción |
|---|---|---|
| `proveedor_llm` | enum | anthropic / openai / gemini / mistral / local |
| `modelo` | string | ID del modelo (ej: `claude-sonnet-4-6`, `gpt-4o`) |
| `system_prompt` | text | Prompt base del agente (versionado) |
| `context_sources` | string[] | Fuentes de contexto disponibles (ej: `["clients", "projects", "tasks"]`) |
| `herramientas` | string[] | Tools habilitadas (ej: `["web_search", "code_exec", "erp_read"]`) |
| `max_tokens_por_ejecucion` | int | Límite de tokens por llamada |
| `budget_mensual_usd` | decimal | Presupuesto mensual asignado (Budget Guard) |
| `requiere_aprobacion_humana` | boolean | Si el output necesita aprobación antes de actuar |

#### Estado y métricas

| Campo | Tipo | Descripción |
|---|---|---|
| `estado` | enum | activo / entrenando / testing / en_revision / pausado / experimental / archivado |
| `owner_interno_id` | uuid (FK User) | Quién supervisa este agente |
| `version` | string | Versión actual del agente (ej: "v2.1") |
| `ejecuciones_totales` | int (calculado) | Total de ejecuciones históricas |
| `ejecuciones_exitosas` | int (calculado) | Ejecuciones con estado `success` |
| `ratio_exito_pct` | decimal (calculado) | (exitosas / totales) × 100 |
| `coste_acumulado_usd` | decimal (calculado) | Coste total histórico |
| `ultima_ejecucion_at` | timestamp | Timestamp de la última ejecución |

#### Metadata

| Campo | Tipo | Descripción |
|---|---|---|
| `created_at` | timestamp | Fecha de creación |
| `updated_at` | timestamp | Última actualización |

---

### Ejecución (entidad central de trazabilidad — `AgentExecution`)

> Esta es la tabla más crítica del módulo. Toda ejecución IA — sin excepción — genera un registro aquí.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Identificador único |
| `agent_id` | uuid (FK Agent) | Agente que ejecutó |
| `workflow_id` | uuid (FK Workflow) | Workflow que disparó (nullable si fue manual) |
| `triggered_by_id` | uuid (FK User) | Usuario que lo activó (nullable si fue automático) |
| `triggered_by_bot` | string | Bot que lo disparó (nullable si fue humano) |
| **Contexto** | | |
| `client_id` | uuid (FK Client) | Cliente asociado (nullable) |
| `project_id` | uuid (FK Project) | Proyecto asociado (nullable) |
| `task_id` | uuid (FK Task) | Tarea asociada (nullable) |
| `module_context` | enum | Módulo del ERP donde se originó |
| **Input / Output** | | |
| `input_prompt` | text | Prompt enviado al modelo |
| `output_resultado` | text | Respuesta generada |
| `output_aprobado` | boolean | Si fue aprobado por humano (nullable si no requería) |
| `aprobado_por_id` | uuid (FK User) | Quién aprobó (nullable) |
| **Métricas de coste** | | |
| `modelo_usado` | string | Modelo exacto (ej: `claude-sonnet-4-6`) |
| `proveedor` | enum | anthropic / openai / gemini / etc. |
| `tokens_input` | int | Tokens de entrada |
| `tokens_output` | int | Tokens de salida |
| `tokens_total` | int (calculado) | Suma total |
| `coste_usd` | decimal | Coste en USD |
| `coste_moneda_local` | decimal | Coste en moneda local (opcional) |
| `duracion_ms` | int | Tiempo de ejecución en milisegundos |
| **Estado** | | |
| `estado` | enum | pending / running / success / failed / rejected / requires_approval |
| `error_message` | text | Mensaje de error si `estado = failed` (nullable) |
| `created_at` | timestamp | Fecha y hora exacta |

---

### Workflow (automatización compuesta)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `nombre` | string | Nombre descriptivo del workflow |
| `descripcion` | text | Qué automatiza y cuándo |
| `trigger_type` | enum | manual / scheduled / event_based / webhook |
| `trigger_config` | jsonb | Configuración del trigger según tipo |
| `steps` | jsonb | `[{ agente_id, input_template, condicion_continuar }]` — pasos ordenados |
| `activo` | boolean | Si está habilitado |
| `budget_por_ejecucion_usd` | decimal | Límite de coste por corrida |
| `requiere_aprobacion_final` | boolean | Si el output final necesita aprobación humana |
| `owner_id` | uuid (FK User) | Responsable del workflow |
| `ultima_ejecucion_at` | timestamp | — |
| `ejecuciones_totales` | int | — |
| `created_at` | timestamp | — |

---

### Versión de agente (historial de prompts)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `agent_id` | uuid (FK Agent) | Agente al que pertenece |
| `version` | string | Versión (ej: "v2.1") |
| `system_prompt` | text | System prompt de esta versión |
| `notas_cambio` | text | Qué cambió y por qué |
| `creado_por_id` | uuid (FK User) | Quién hizo el cambio |
| `created_at` | timestamp | — |

---

## Cost Governance — tabla de campos obligatorios

> Según `01-constitution-v1.md §7`, toda ejecución IA debe registrar:

| Campo | Obligatorio | Descripción |
|---|---|---|
| `agent_id` | ✅ | Qué agente ejecutó |
| `modelo_usado` | ✅ | Qué modelo exacto |
| `proveedor` | ✅ | Qué proveedor LLM |
| `tokens_input` | ✅ | Tokens de entrada |
| `tokens_output` | ✅ | Tokens de salida |
| `coste_usd` | ✅ | Coste total en USD |
| `client_id` | Si aplica | Cliente asociado |
| `project_id` | Si aplica | Proyecto asociado |
| `workflow_id` | Si aplica | Workflow que lo originó |
| `created_at` | ✅ | Fecha y hora exacta |

---

## Budget Guard

El **Budget Guard** es un servicio del sistema que intercepta toda ejecución antes de llamar al LLM:

```
Ejecución solicitada
      ↓
Budget Guard verifica:
  ├─ ¿Agente tiene budget mensual definido?
  ├─ ¿Coste acumulado del mes < budget_mensual_usd?
  └─ ¿coste_estimado_ejecucion ≤ budget_por_ejecucion en workflow?
      ↓
SI todo ok → ejecuta
NO → bloquea + notifica al owner + registra intento
```

---

## Vistas del módulo

| Vista | Descripción |
|---|---|
| **Biblioteca de agentes** | Catálogo completo con estado, métricas y versión |
| **Ejecuciones recientes** | Últimas corridas con input, output, coste y estado |
| **Costos IA** | Dashboard financiero: gasto por día, por agente, por cliente, por proyecto |
| **Logs** | Historial completo filtrable por agente, estado, fecha, cliente |
| **Playground** | Interfaz para probar prompts manualmente contra cualquier agente |
| **Workflows** | Automatizaciones compuestas activas e historial |
| **Analytics** | KPIs de uso, ROI estimado, ratio de éxito, tendencias |
| **Versionado** | Historial de cambios de prompt por agente |

---

## KPIs del módulo

| KPI | Descripción | Cálculo |
|---|---|---|
| Agentes activos | Estado `activo` | COUNT |
| Ejecuciones hoy | `created_at` = hoy | COUNT |
| Coste IA hoy | SUM(`coste_usd`) del día | SUM |
| Coste IA mensual | SUM(`coste_usd`) del mes | SUM |
| Tokens consumidos | SUM(`tokens_total`) del período | SUM |
| Tiempo ahorrado estimado | (ejecuciones × tiempo_promedio_humano) | Estimado |
| ROI estimado | (valor_generado - coste_ia) / coste_ia × 100 | % |
| Automatizaciones activas | Workflows con `activo = true` | COUNT |
| Ratio éxito ejecuciones | `success` / total × 100 | % |
| Coste por cliente | SUM(`coste_usd`) agrupado por `client_id` | Por cliente |
| Coste por proyecto | SUM(`coste_usd`) agrupado por `project_id` | Por proyecto |

---

## Sistemas internos del laboratorio

| Sistema | Función |
|---|---|
| **Agent Router** | Recibe solicitud → elige agente óptimo según contexto e intención |
| **Cost Tracker** | Registra coste de cada ejecución en tiempo real |
| **Token Monitor** | Alerta si consumo se acerca al budget del agente |
| **Budget Guard** | Bloquea ejecución si excede presupuesto configurado |
| **Quality Review Agent** | Revisa outputs generados antes de entregarlos (opcional por agente) |
| **Human Approval Queue** | Cola de outputs esperando validación humana |
| **Memory Sync Agent** | Actualiza y sincroniza memoria compartida entre agentes |
| **Context Builder Agent** | Arma contexto previo (cliente, proyecto, historial) antes de cada ejecución |

---

## Relaciones con otros módulos

| Módulo | Cómo interactúa el Lab IA |
|---|---|
| **Prospectos** | Prospect Discovery Agent · Enrichment Agent · Scoring Agent |
| **Campañas** | Auto Qualification · Routing · Copy Generator |
| **Seguimiento** | Draft mensajes · Temperatura comercial · Resumen conversaciones |
| **Pipeline** | Probabilidad cierre · Riesgo pérdida · Forecast |
| **Reuniones** | Briefing previo · Resumen posterior · Action items |
| **Clientes** | Health score · Churn risk · Resumen ejecutivo · Upsell detection |
| **Servicios** | Predicción renovación · Análisis rentabilidad |
| **Proyectos** | Riesgo retraso · Resumen estado · Organización backlog |
| **Tareas** | Descomposición · Priorización · Asignación sugerida |
| **Finanzas** | Forecast · Análisis coste IA · ROI |
| **HostingGuard** | Infra Agent para deployments y monitoreo automatizado |

---

## Reglas críticas de negocio

### Regla 1 — Propósito definido
Todo agente debe tener `objetivo_operativo` documentado antes de activarse.

### Regla 2 — Registro obligatorio de toda ejecución
Toda llamada a un LLM — sin excepción — genera un registro en `AgentExecution`. No hay ejecuciones "informales".

### Regla 3 — Gasto siempre medido
`coste_usd`, `tokens_input` y `tokens_output` son obligatorios en cada ejecución. Sin métricas → la ejecución no se considera válida.

### Regla 4 — Pausa manual siempre disponible
Todo agente puede pasar a estado `pausado` manualmente en cualquier momento por cualquier miembro autorizado.

### Regla 5 — Human approval cuando corresponde
Si `requiere_aprobacion_humana = true`, el output va a la **Human Approval Queue** antes de actuar. Nunca actúa sin aprobación cuando está configurado así.

### Regla 6 — Contexto suficiente obligatorio
Ningún agente puede ejecutarse sin contexto mínimo suficiente. El **Context Builder Agent** debe correr antes de cada ejecución y validar que los datos necesarios están disponibles.

### Regla 7 — Retorno medible
Todo agente nuevo debe tener definida su **métrica de retorno** antes de pasar de `experimental` a `activo`. Ejemplos: horas ahorradas / leads generados / revenue atribuido / errores evitados.

---

## Las 9 preguntas estratégicas del módulo

| Pregunta | Fuente de datos |
|---|---|
| ¿Qué agentes tenemos activos? | `estado = activo` en tabla Agent |
| ¿Qué están haciendo ahora? | `AgentExecution` con `estado = running` |
| ¿Cuánto están costando? | SUM(`coste_usd`) del mes por agente |
| ¿Cuánto están aportando? | `roi_estimado` por agente |
| ¿Qué ROI generan? | (valor_generado - coste_ia) / coste_ia |
| ¿Qué workflows automatizan? | Tabla Workflow con `activo = true` |
| ¿Qué tareas reemplazan? | `tiempo_ahorrado_estimado` por agente |
| ¿Qué necesita aprobación humana? | Human Approval Queue con items pendientes |
| ¿Cómo escalar sin perder rentabilidad? | Budget Guard + ROI por agente |

---

## Criterios de aceptación (DoD)

Para que esta spec se considere implementada:

- [ ] Catálogo de agentes con CRUD completo
- [ ] Toda ejecución registrada en `AgentExecution` con coste completo
- [ ] Budget Guard activo — bloquea si supera presupuesto
- [ ] Human Approval Queue funcional para agentes con `requiere_aprobacion_humana = true`
- [ ] Cost Tracker en tiempo real por agente / cliente / proyecto
- [ ] Sistema de versionado de prompts por agente
- [ ] Playground funcional para pruebas manuales
- [ ] Motor de Workflows con al menos 1 workflow compuesto de múltiples agentes
- [ ] Context Builder Agent corre antes de cada ejecución
- [ ] KPIs del dashboard en tiempo real (coste día, mes, ratio éxito)
- [ ] Vista de Costos IA con filtros por agente, cliente, proyecto
- [ ] Vista de Logs filtrable por todos los campos
- [ ] Core Agent Orchestrator funcional (recibe → decide → coordina → consolida)
- [ ] Memory Sync Agent con memoria compartida entre sesiones
- [ ] Estados de agente con transiciones controladas
- [ ] Regla 7: métrica de retorno definida antes de activar cualquier agente
- [ ] Métricas de coste presentes en TODA ejecución — sin excepción
- [ ] ROI estimado visible en dashboard
- [ ] Exportar log de ejecuciones a CSV

---

## Próximos pasos

1. Aprobar esta spec — **cierra el módulo Studio**
2. Iniciar specs del módulo **Operations**: ERP-011 HostingGuard, ERP-012 Finanzas, ERP-013 Tickets, ERP-014 Reportes
3. Definir schema Prisma para `Agent`, `AgentExecution`, `Workflow`, `AgentVersion`
4. Diseñar endpoints REST (`/api/lab/agents`, `/api/lab/executions`, `/api/lab/workflows`)
5. Especificar el **Context Builder Agent** — qué datos recopila para cada módulo del ERP
6. Definir la lógica de cálculo de **ROI estimado** por agente (variables de entrada y fórmula)
