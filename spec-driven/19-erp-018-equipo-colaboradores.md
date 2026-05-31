# ERP-018 — Equipo & Colaboradores

**Spec ID:** 19  
**Código:** ERP-018  
**Módulo:** Equipo & Colaboradores  
**Estado:** 🟡 DRAFT v1  
**Fecha:** 2026-05-31  
**Autor:** Inspyra Team  

---

## Objetivo del módulo

El módulo Equipo & Colaboradores centraliza la gestión integral del equipo interno de Inspyra.

Permite administrar personas, roles, permisos, productividad, carga operativa, seguimiento de trabajo, rendimiento individual y desempeño general de la agencia.

Es el **centro de gestión humana y operativa del ERP**.

---

## Qué resuelve

| Sin módulo | Con módulo |
|---|---|
| Difícil saber quién trabaja en qué | Estructura clara con asignaciones visibles |
| Tareas sin responsables claros | Roles y responsabilidades definidos |
| Poca visibilidad del equipo | Estado operativo en tiempo real |
| Difícil medir productividad real | KPIs individuales y por equipo medibles |
| Difícil controlar carga operativa | Detección de saturación y disponibilidad |
| Difícil delegar con control | Trazabilidad completa de actividad |

---

## Principio central

> **Toda persona dentro de la agencia debe tener trazabilidad operativa.**

Cada colaborador debe poder medirse, organizarse, asignarse y visualizarse dentro del ERP.

> **La medición sirve para gestión y organización, no como vigilancia invasiva.**

---

## Qué vive dentro del módulo

- Usuarios internos y sus perfiles completos
- Roles y permisos (RBAC)
- Estado de presencia en tiempo real
- Actividad diaria y timeline operativo
- Tareas asignadas con estado y tiempos
- Clientes y proyectos asignados por colaborador
- Control horario y time tracking
- KPIs de productividad individual
- Scores de rendimiento por área
- Dashboard global del equipo

---

## Qué NO vive aquí

Solo equipo interno de Inspyra. Clientes, prospectos y leads son entidades de otros módulos.

---

## Modelo de datos

### TeamMember (Colaborador)

#### Identidad

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Identificador único |
| `user_id` | uuid (FK User) | Usuario del sistema vinculado |
| `nombre` | string | Nombre |
| `apellido` | string | Apellido |
| `email` | string | Email corporativo |
| `username` | string | Alias interno |
| `avatar_url` | string | URL foto de perfil (nullable) |

#### Posición

| Campo | Tipo | Descripción |
|---|---|---|
| `cargo` | string | Título del puesto (ej: "SEO Specialist") |
| `area` | enum | Ver áreas posibles |
| `rol_erp` | enum | Ver roles ERP |
| `supervisor_id` | uuid (FK TeamMember) | Supervisor directo (nullable) |
| `fecha_ingreso` | date | Fecha de inicio en Inspyra |
| `estado_laboral` | enum | activo / inactivo / licencia / freelance |

#### Contacto

| Campo | Tipo | Descripción |
|---|---|---|
| `telefono` | string | Teléfono de contacto (nullable) |
| `timezone` | string | Zona horaria (`America/Argentina/Buenos_Aires`) |
| `horario_trabajo` | jsonb | Ej: `{lun-vie: "09:00-18:00"}` (nullable) |

---

### TeamPresence (Presencia en tiempo real)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `member_id` | uuid (FK TeamMember) | Colaborador |
| `estado` | enum | online / offline / ausente / en_reunion / trabajando / en_pausa / desconectado |
| `ultima_actividad_at` | timestamp | Última acción dentro del ERP |
| `ultima_pantalla` | string | Última sección del ERP visitada (nullable) |
| `sesion_iniciada_at` | timestamp | Inicio de la sesión actual (nullable) |
| `duracion_sesion_minutos` | int (calculado) | `now − sesion_iniciada_at` |

---

### ActivityLog (Actividad diaria — append-only)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `member_id` | uuid (FK TeamMember) | Colaborador |
| `tipo` | enum | tarea_completada / ticket_resuelto / email_respondido / deployment / propuesta_creada / factura_generada / reunion_realizada / contenido_publicado / lead_cerrado / otro |
| `descripcion` | text | Texto legible de la acción |
| `entity_type` | string | Tipo de entidad relacionada (`Task`, `Ticket`, `Deal`, etc.) |
| `entity_id` | uuid | ID de la entidad relacionada |
| `client_id` | uuid (FK) | Cliente relacionado (nullable) |
| `project_id` | uuid (FK) | Proyecto relacionado (nullable) |
| `created_at` | timestamp | Momento de la acción |

---

### TimeEntry (Registro de tiempo)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `member_id` | uuid (FK TeamMember) | Colaborador |
| `fecha` | date | Fecha de la jornada |
| `inicio_at` | timestamp | Inicio del bloque de trabajo |
| `fin_at` | timestamp | Fin del bloque (nullable si en curso) |
| `duracion_minutos` | int (calculado) | `fin_at − inicio_at` |
| `tipo` | enum | jornada / pausa / reunion / tarea / proyecto |
| `task_id` | uuid (FK) | Tarea asociada (nullable) |
| `project_id` | uuid (FK) | Proyecto asociado (nullable) |
| `client_id` | uuid (FK) | Cliente asociado (nullable) |
| `service_id` | uuid (FK) | Servicio asociado (nullable) |
| `billable` | boolean | Si es tiempo facturable al cliente |
| `notas` | text | Descripción de lo trabajado (nullable) |

---

### PerformanceScore (Score de rendimiento)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `member_id` | uuid (FK TeamMember) | Colaborador |
| `periodo` | string | Mes evaluado (`2026-05`) |
| `productivity_score` | decimal | Tareas completadas / asignadas × 100 |
| `delivery_score` | decimal | Tareas entregadas en fecha / total × 100 |
| `response_score` | decimal | Tiempo promedio respuesta vs SLA |
| `quality_score` | decimal | Evaluación manual o promedio CSAT tickets |
| `consistency_score` | decimal | Días activos / días laborables del período |
| `collaboration_score` | decimal | Actividad colaborativa (comentarios, revisiones, ayuda a otros) |
| `overall_score` | decimal (calculado) | Promedio ponderado de todos los scores |
| `calculado_at` | timestamp | Cuándo se calculó |

---

## Áreas del equipo

| Área | Descripción |
|---|---|
| `direccion` | CEO, dirección general |
| `comercial` | Ventas, cierre, account management |
| `marketing` | Marketing digital, contenido, social media |
| `seo` | SEO técnico, on-page, off-page |
| `disenio` | Diseño gráfico, UX/UI |
| `desarrollo_web` | Frontend, CMS, landing pages |
| `desarrollo_software` | Backend, APIs, integraciones |
| `cloud` | AWS, infraestructura cloud |
| `hosting` | HostingGuard, VPS, soporte infra |
| `soporte` | Tickets, atención al cliente |
| `facturacion` | Cobranza, facturación, administración |
| `laboratorio_ia` | Agentes IA, automatizaciones, prompts |
| `administracion` | RRHH, legal, contabilidad |

---

## Roles ERP y permisos

| Rol | Descripción | Nivel acceso |
|---|---|---|
| `super_admin` | Control total del sistema | Total |
| `direccion` | Acceso a todos los módulos + reportes financieros | Total |
| `manager_comercial` | Módulos Comercial + Clientes + Pipeline | Alto |
| `closer_comercial` | Prospectos + Seguimiento + Reuniones | Medio |
| `project_manager` | Proyectos + Tareas + Clientes + Servicios | Alto |
| `disenio` | Proyectos + Tareas propias | Básico |
| `marketing_specialist` | Campañas + Tareas + Email Marketing | Medio |
| `seo_specialist` | Proyectos + Tareas propias + Clientes lectura | Básico |
| `developer` | Proyectos + Tareas + Inspyra Cloud lectura | Medio |
| `cloud_operator` | Inspyra Cloud + HostingGuard + Tareas | Alto técnico |
| `hosting_operator` | HostingGuard + Tickets + Tareas | Medio técnico |
| `support_agent` | Tickets + Clientes lectura + Inspyra Mail | Básico |
| `billing_admin` | Facturación + Cobranza + Finanzas + Clientes | Alto financiero |
| `ai_operator` | Laboratorio IA + todos los módulos lectura | Transversal |

---

## Estructura interna — Vistas del módulo

### Vista 1 — Directorio del Equipo
Tarjetas o tabla de todos los colaboradores con: avatar, nombre, cargo, área, estado de presencia, última actividad. Click → perfil completo.

### Vista 2 — Estado Operativo en Tiempo Real
Grid de presencia de todo el equipo ahora mismo. Indicador de color por estado. Útil para dirección a primera hora del día.

| Estado | Indicador |
|---|---|
| `online` / `trabajando` | 🟢 Verde |
| `en_reunion` / `en_pausa` | 🟡 Amarillo |
| `ausente` / `desconectado` | ⚫ Gris |
| `offline` | ⚪ Blanco |

### Vista 3 — Actividad Diaria
Timeline por colaborador del día de hoy. Filtrable por fecha, área, tipo de acción.

### Vista 4 — Gestión de Tareas por Colaborador
Vista Kanban o tabla de tareas agrupadas por assignee. Filtros: pendiente / en_progreso / vencida / completada.

### Vista 5 — Clientes Asignados
Por colaborador: qué clientes gestiona, último contacto, tickets abiertos, reuniones realizadas, MRR de sus clientes.

### Vista 6 — Proyectos Asignados
Por colaborador: proyectos activos, rol en cada proyecto, horas dedicadas, estado.

### Vista 7 — Time Tracking
Registro diario de tiempo con imputación a cliente/proyecto/servicio. Vista semanal con total de horas billables vs no billables.

### Vista 8 — Productividad Individual
Dashboard por colaborador con todos los KPIs del período: tareas, tickets, tiempo, CSAT, puntualidad.

### Vista 9 — Performance Scores
Tabla comparativa de scores por período. Filtrable por área. Sin rankings públicos — solo para dirección.

### Vista 10 — Dashboard Global del Equipo
Vista ejecutiva de todo el equipo con los KPIs agregados.

---

## KPIs del módulo (siempre visibles)

| KPI | Cálculo | Alerta |
|---|---|---|
| Colaboradores activos hoy | COUNT con sesión activa hoy | — |
| Conectados ahora | COUNT estado `online` o `trabajando` | — |
| Tareas pendientes globales | COUNT estado pendiente sin asignar | si > 20 |
| Tareas vencidas globales | COUNT vencidas sin completar | si > 5 |
| Productividad semanal | AVG tareas cerradas / asignadas esta semana | si < 70% |
| Horas trabajadas semana | SUM TimeEntry semana actual | — |
| Colaboradores saturados | COUNT con > N tareas activas (umbral configurable) | si > 2 |
| Colaboradores disponibles | COUNT con carga < umbral | — |

---

## Bots y automatizaciones

| Bot | Trigger | Acción |
|---|---|---|
| **Auto Assignment Bot** | Nueva tarea sin owner en área específica | Asigna automáticamente al colaborador del área con menor carga activa |
| **Workload Balance Bot** | Colaborador supera umbral de tareas activas configurado | Alerta al manager del área para redistribuir |
| **Deadline Reminder Bot** | Tarea con deadline en 24h sin completar | Recuerda al colaborador asignado |
| **Productivity Summary Bot** | Cada viernes 18:00 | Genera resumen semanal de productividad por colaborador y por área |
| **Idle Detection Bot** | Sesión activa sin actividad > 30 min | Actualiza estado a `en_pausa` automáticamente |
| **Performance Alert Bot** | `delivery_score` de un colaborador < umbral por 2 semanas | Alerta privada al supervisor directo |
| **Availability Bot** | Solicitud de asignación nueva | Sugiere los 3 colaboradores del área con menor carga actual |

---

## Capacidades IA del módulo

| Función IA | Descripción |
|---|---|
| **Detección de sobrecarga** | Identifica colaboradores con carga desproporcionada vs su productividad histórica |
| **Predicción de retrasos** | Si un colaborador tiene X tareas vencidas y Y proyectos, predice qué deadlines están en riesgo |
| **Resumen semanal del equipo** | Narrativa en 5 líneas del estado del equipo: logros, riesgos, cuellos de botella |
| **Recomendación de redistribución** | Sugiere mover tareas específicas de un colaborador saturado a uno disponible |
| **Análisis de performance** | Detecta patrones: baja entrega en días específicos, áreas con mayor retraso, correlación carga-calidad |
| **Detección de tareas bloqueadas** | Identifica tareas sin movimiento > N días y sugiere acción |

Toda ejecución IA registra métricas de coste según `01-constitution-v1.md §7`.

---

## Relaciones con otros módulos

| Módulo | Relación |
|---|---|
| **Clientes (ERP-006)** | Account manager asignado por cliente |
| **Proyectos (ERP-008)** | Equipo por proyecto; horas imputadas |
| **Tareas (ERP-009)** | Ejecución diaria; asignación y tracking |
| **Tickets (ERP-013)** | Tickets asignados por colaborador; CSAT individual |
| **Comercial (ERP-001 a ERP-005)** | Seguimiento de leads por comercial |
| **Facturación (ERP-012)** | TimeEntry billable → imputación a factura de cliente |
| **Laboratorio IA (ERP-010)** | Uso de agentes IA por usuario; coste IA por colaborador |
| **Reportes (ERP-014)** | KPIs de productividad, performance y carga de trabajo |
| **Inspyra Mail (ERP-017)** | Emails respondidos como actividad registrada |

---

## Reglas críticas de negocio

### Regla 1 — Perfil único por colaborador
Todo colaborador tiene exactamente un `TeamMember` vinculado a su `User`. No pueden existir duplicados.

### Regla 2 — Rol obligatorio antes de acceder al ERP
Un usuario sin `rol_erp` asignado no puede acceder a ningún módulo salvo la pantalla de onboarding de perfil.

### Regla 3 — Toda tarea debe poder asociarse a colaborador
El campo `owner_id` en `Task` nunca puede estar vacío en tareas en estado `en_progreso`.

### Regla 4 — Historial de actividad es inmutable
`ActivityLog` es append-only. Ninguna actividad puede modificarse o eliminarse. Es el registro oficial de lo que hizo cada persona.

### Regla 5 — Permisos granulares por rol
Cada rol tiene un conjunto explícito de permissions. No existen permisos heredados implícitos. Si el rol no lo define → acceso denegado.

### Regla 6 — KPIs revisables por período
Todo indicador de productividad debe poder consultarse para cualquier período histórico, no solo el actual.

### Regla 7 — Medición para gestión, no vigilancia
Los scores de performance son visibles para el colaborador y su supervisor. No son rankings públicos competitivos entre pares. El objetivo es identificar dónde apoyar, no presionar.

---

## Criterios de aceptación (DoD)

Para que esta spec se considere implementada:

- [ ] Schema Prisma: `TeamMember`, `TeamPresence`, `ActivityLog`, `TimeEntry`, `PerformanceScore`
- [ ] CRUD completo de perfiles con validaciones
- [ ] RBAC completo: 14 roles con sus permission sets definidos
- [ ] Vista de Directorio con búsqueda y filtro por área
- [ ] Vista de Estado Operativo en tiempo real con polling cada 30 segundos
- [ ] ActivityLog generado automáticamente por acciones en otros módulos (hooks)
- [ ] Timeline de actividad diaria por colaborador
- [ ] Vista de Tareas por Colaborador sincronizada con ERP-009
- [ ] Vista de Clientes Asignados con métricas de relación
- [ ] Vista de Proyectos Asignados con horas dedicadas
- [ ] Time Tracking: inicio/fin manual + imputación a proyecto/cliente/servicio
- [ ] Cálculo automático de `PerformanceScore` mensual (cron job día 1)
- [ ] Dashboard Global con los 8 KPIs en tiempo real
- [ ] Auto Assignment Bot por carga mínima del área
- [ ] Workload Balance Bot con umbral configurable
- [ ] Deadline Reminder Bot 24h antes del vencimiento
- [ ] Productivity Summary Bot semanal automático
- [ ] Idle Detection Bot → estado `en_pausa` tras 30 min sin actividad
- [ ] Scores de rendimiento visibles solo para el colaborador y su supervisor
- [ ] Exportar reporte de productividad por período a CSV
- [ ] Tests unitarios ≥ 85% en servicios de cálculo de scores y asignación

---

## Próximos pasos

1. Aprobar esta spec
2. Definir el módulo siguiente: `20-erp-019-account-configuracion.md` (Account / Configuración del sistema)
3. Definir schema Prisma: `TeamMember`, `TeamPresence`, `ActivityLog`, `TimeEntry`, `PerformanceScore`
4. Diseñar endpoints REST: `/api/team`, `/api/team/:id/activity`, `/api/team/:id/time-entries`
5. Definir los hooks automáticos que generan `ActivityLog` desde otros módulos (ej: `Task.status → completed` → log entry)
6. Definir el modelo de imputación billable: `TimeEntry.billable = true` → aparece en próxima factura del cliente
7. Especificar qué métricas componen cada score y con qué peso en el `overall_score`
