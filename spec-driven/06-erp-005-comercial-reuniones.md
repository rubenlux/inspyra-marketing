# ERP-005 — Comercial / Reuniones

**Spec ID:** 06  
**Código:** ERP-005  
**Módulo:** Comercial → Reuniones  
**Estado:** 🟡 DRAFT v1  
**Fecha:** 2026-05-31  
**Autor:** Inspyra Team  

---

## Objetivo del módulo

El módulo Reuniones centraliza toda interacción comercial agendada entre Inspyra y prospectos, leads o clientes.

Su función es organizar, registrar, preparar y dar continuidad a todas las reuniones vinculadas al proceso comercial.

Es el **centro de gestión de reuniones de venta y discovery** de la agencia.

---

## Qué resuelve

| Sin módulo Reuniones | Con módulo Reuniones |
|---|---|
| Reuniones perdidas u olvidadas | Agenda comercial centralizada |
| Poca preparación previa | Briefing automático antes de cada encuentro |
| Falta de contexto previo | Contexto completo: historial, lead, propuestas |
| Acuerdos no documentados | Registro posterior estructurado |
| Tareas post-reunión olvidadas | Tareas derivadas automáticamente |
| Falta de seguimiento posterior | Continuidad comercial inmediata |

---

## Qué vive aquí

Todas las reuniones relacionadas al **proceso comercial**:

- Discovery calls
- Reuniones iniciales / diagnóstico comercial
- Demo comercial
- Presentación de propuesta
- Reunión de negociación
- Cierre comercial
- Reunión de onboarding inicial
- Reuniones de upsell
- Reuniones de reactivación

---

## Qué NO vive aquí

| ❌ No aquí | ✅ Dónde va |
|---|---|
| Tareas internas del equipo | Módulo Tareas |
| Reuniones operativas internas | Módulo Proyectos (futuro) |
| Reuniones de producción de proyectos | Módulo Proyectos (futuro) |

---

## Flujo del módulo

```
Agendamiento → Preparación previa → Recordatorios → Reunión → Registro posterior → Derivación
```

### Paso 1 — Agendamiento

Puede originarse desde:

| Origen | Canal |
|---|---|
| Módulo Seguimiento | Link interno |
| Módulo Pipeline | Link interno |
| Calendly | Integración externa |
| Google Calendar | Integración externa |
| WhatsApp | Manual + bot |
| Formulario web | CTA del sitio |
| Link de reserva automática | URL pública de agendamiento |
| Manual por el equipo | Input directo en ERP |

### Paso 2 — Preparación previa (IA)

Antes de la reunión el sistema arma automáticamente un **briefing comercial** que incluye:

- Información de la empresa
- Historial de contacto
- Origen del lead (fuente)
- Servicio de interés detectado
- Problemas detectados por IA
- Conversaciones previas resumidas
- Notas comerciales del equipo
- Oportunidad detectada
- Propuesta previa si existe

### Paso 3 — Recordatorios automáticos

| Destinatario | Cuándo | Canal |
|---|---|---|
| Equipo interno | 24h antes | Notificación + email |
| Equipo interno | 1h antes | Push interno |
| Prospecto / Cliente | 24h antes | Email |
| Prospecto / Cliente | 30 min antes | WhatsApp (si hay número) |

### Paso 4 — Reunión ocurre

Canales soportados: Google Meet / Zoom / Llamada / Presencial / WhatsApp / Teams.

### Paso 5 — Registro posterior

Al finalizar, se documenta:

- Resumen de la conversación
- Acuerdos alcanzados
- Objeciones detectadas
- Próximos pasos definidos
- Tareas generadas
- Probabilidad de cierre actualizada

### Paso 6 — Derivación

La reunión puede disparar automáticamente:

| Resultado | Derivación |
|---|---|
| Interés confirmado | → Avanzar etapa en Pipeline |
| Requiere propuesta | → Trigger Propuesta comercial |
| Más tiempo / revisión | → Crear seguimiento programado |
| Listo para cerrar | → Mover a `cierre_pendiente` en Pipeline |
| No hay fit | → Marcar como `perdido` (motivo requerido) |
| Cerrado | → Crear ficha en Clientes + onboarding |

---

## Tipos de reunión

| Tipo | Descripción | Etapa típica en Pipeline |
|---|---|---|
| `discovery` | Primer diagnóstico comercial | Descubrimiento |
| `presentacion` | Presentación de solución o servicio | Reunión realizada |
| `demo` | Demostración técnica o visual | Reunión realizada |
| `propuesta` | Presentación económica / comercial | Propuesta enviada |
| `negociacion` | Discusión de condiciones finales | Negociación |
| `cierre` | Confirmación comercial final | Cierre pendiente |
| `onboarding` | Primera reunión post-cierre | Ganado |
| `reactivacion` | Volver a activar oportunidad pausada | Pausado / Nuevo ingreso |
| `upsell` | Presentar nuevo servicio a cliente existente | Nuevo ingreso (upsell) |

---

## Modelo de datos

### Reunión (entidad principal)

#### Identificación

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Identificador único |
| `titulo` | string | Título descriptivo de la reunión |
| `tipo` | enum | discovery / presentacion / demo / propuesta / negociacion / cierre / onboarding / reactivacion / upsell |

#### Participantes

| Campo | Tipo | Descripción |
|---|---|---|
| `owner_id` | uuid (FK User) | Comercial responsable de Inspyra |
| `empresa` | string | Empresa del prospecto / cliente |
| `contacto_nombre` | string | Nombre del contacto externo |
| `contacto_email` | string | Email del contacto externo |
| `participantes_internos` | uuid[] (FK Users) | Otros miembros de Inspyra (array) |

#### Logística

| Campo | Tipo | Descripción |
|---|---|---|
| `canal` | enum | google_meet / zoom / llamada / presencial / whatsapp / teams |
| `fecha` | date | Fecha de la reunión |
| `hora_inicio` | time | Hora de inicio |
| `duracion_estimada_min` | int | Duración estimada en minutos |
| `duracion_real_min` | int | Duración real (cargada post-reunión) |
| `link_reunion` | string | URL del Meet / Zoom (nullable) |
| `estado` | enum | Ver estados posibles |

#### Pre-reunión

| Campo | Tipo | Descripción |
|---|---|---|
| `notas_previas` | text | Notas del equipo antes de la reunión |
| `briefing_ia` | text | Briefing automático generado por IA |

#### Post-reunión

| Campo | Tipo | Descripción |
|---|---|---|
| `resumen_posterior` | text | Resumen de lo que ocurrió |
| `acuerdos_alcanzados` | text | Acuerdos concretos registrados |
| `objeciones_detectadas` | string[] | Objeciones expresadas en la reunión |
| `siguiente_paso` | string | Descripción de la próxima acción |
| `proxima_fecha_sugerida` | date | Fecha sugerida para siguiente contacto |
| `probabilidad_cierre_post` | int (0–100) | % probabilidad actualizada post-reunión |
| `outcome` | enum | Ver outcomes posibles |

#### Relaciones

| Campo | Tipo | Descripción |
|---|---|---|
| `deal_id` | uuid (FK) | Oportunidad en Pipeline asociada |
| `prospect_id` | uuid (FK) | Prospecto asociado (nullable) |
| `lead_id` | uuid (FK) | Lead inbound asociado (nullable) |
| `cliente_id` | uuid (FK) | Cliente asociado si ya cerró (nullable) |
| `propuesta_id` | uuid (FK) | Propuesta asociada (nullable) |
| `followup_id` | uuid (FK) | Seguimiento generado post-reunión (nullable) |

#### Metadata

| Campo | Tipo | Descripción |
|---|---|---|
| `created_at` | timestamp | Fecha de creación |
| `updated_at` | timestamp | Última actualización |
| `finalizada_at` | timestamp | Cuándo se cerró el registro |

---

### Outcomes posibles (post-reunión)

| Outcome | Descripción | Acción automática |
|---|---|---|
| `interes_confirmado` | Hay interés real y próximos pasos | Avanza etapa en Pipeline |
| `propuesta_solicitada` | Pidieron propuesta formal | Trigger: crear Propuesta |
| `mas_tiempo` | Necesita más tiempo o información | Crear Seguimiento en 7 días |
| `listo_para_cerrar` | Casi listo, falta una confirmación | Mover Pipeline a `cierre_pendiente` |
| `sin_fit` | No hay encaje real | Mover Pipeline a `perdido` (motivo requerido) |
| `cerrado` | Se confirmó en la reunión | Crear Cliente + onboarding |
| `reagendada` | Se pospuso para otra fecha | Crear nueva reunión vinculada |
| `no_asistio` | El prospecto no asistió | Crear Seguimiento + intento recontacto |

---

## Estados posibles de una reunión

| Estado | Descripción |
|---|---|
| `programada` | Agendada, pendiente de confirmación |
| `confirmada` | Confirmada por ambas partes |
| `pendiente_confirmacion` | Falta confirmación del prospecto |
| `reagendada` | Fue movida a otra fecha |
| `en_curso` | Ocurriendo en este momento |
| `finalizada` | Completada y registrada |
| `cancelada` | Cancelada con motivo |
| `no_asistio_prospecto` | El prospecto no se presentó |
| `no_asistio_inspyra` | Inspyra no se presentó (error interno) |

---

## KPIs del módulo

| KPI | Descripción |
|---|---|
| Reuniones hoy | Programadas para hoy |
| Próximas reuniones | Siguientes 7 días |
| Reuniones esta semana | Total semana actual |
| Discovery agendadas | Tipo `discovery` activas |
| Propuestas presentadas | Tipo `propuesta` finalizadas |
| Reuniones cerradas | Finalizadas con registro completo |
| Ratio de asistencia | (Finalizadas / Programadas) × 100 |
| Ratio conversión post-reunión | Oportunidades que avanzaron tras reunión |
| Tiempo promedio reunión → cierre | Días promedio entre primera reunión y `ganado` |

---

## Bots y automatizaciones

| Bot | Trigger | Acción |
|---|---|---|
| **Auto Scheduling Bot** | Lead confirma interés en reunión | Agenda automáticamente y envía link Calendly/Meet |
| **Reminder Bot — interno** | 24h y 1h antes | Notificación push al owner + participantes |
| **Reminder Bot — prospecto** | 24h y 30 min antes | Email + WhatsApp al contacto externo |
| **Confirmation Bot** | Reunión sin confirmar 24h antes | Solicita confirmación por WhatsApp / email |
| **Meeting Brief Bot** | 1h antes de la reunión | Genera y entrega briefing IA al owner |
| **Meeting Summary Bot** | Reunión finalizada | Genera resumen automático + extrae acuerdos y objeciones |
| **Follow-up Trigger Bot** | Outcome `mas_tiempo` o `no_asistio_prospecto` | Crea Seguimiento programado |
| **Proposal Trigger Bot** | Outcome `propuesta_solicitada` | Crea borrador de Propuesta en módulo Propuestas |
| **CRM Update Bot** | Outcome registrado | Actualiza etapa del Deal en Pipeline automáticamente |

---

## Capacidades IA del módulo

| Función IA | Descripción |
|---|---|
| **Briefing previo automático** | Consolida historial + contexto + oportunidad en documento previo |
| **Resumen de reunión** | Resume el encuentro en 5 puntos clave |
| **Extracción de acuerdos** | Detecta y lista compromisos concretos |
| **Detección de objeciones** | Identifica resistencias expresadas |
| **Detección de intención de compra** | Evalúa nivel real de interés |
| **Probabilidad de cierre post-reunión** | Recalcula % según lo ocurrido |
| **Próximo paso sugerido** | Recomienda la acción más efectiva |
| **Email post-reunión** | Genera borrador de email de seguimiento |
| **WhatsApp post-reunión** | Genera mensaje corto de seguimiento |

Toda ejecución IA debe registrar métricas de coste según `01-constitution-v1.md §7`.

---

## Relaciones con otros módulos

| Módulo | Relación |
|---|---|
| **Prospectos** | Una reunión puede originarse desde un prospecto trabajado |
| **Campañas** | Una reunión puede originarse desde un lead inbound |
| **Seguimiento** | Opera antes y después — Seguimiento alimenta Reuniones, Reuniones crea nuevos Seguimientos |
| **Pipeline** | Toda reunión impacta el Deal asociado (etapa, probabilidad, siguiente paso) |
| **Propuestas** | Puede generar propuesta comercial post-discovery |
| **Clientes** | Si cierra → derivación a ficha de Cliente con onboarding |

---

## Reglas críticas de negocio

### Regla 1 — Owner obligatorio
Toda reunión debe tener `owner_id` asignado antes de guardarse.

### Regla 2 — Siguiente paso obligatorio al finalizar
Al marcar una reunión como `finalizada`, el campo `siguiente_paso` es obligatorio.

### Regla 3 — Resumen obligatorio al finalizar
`resumen_posterior` es obligatorio al cerrar el registro. Sin resumen → no puede pasar a `finalizada`.

### Regla 4 — Toda reunión comercial impacta Pipeline
Al registrar outcome, el sistema actualiza automáticamente la etapa del Deal asociado. Si no hay Deal → propone crearlo.

### Regla 5 — Ninguna reunión puede cerrarse sin outcome
`outcome` es obligatorio para completar el registro. Sin outcome → estado bloqueado en `en_curso`.

### Resumen: campos obligatorios al finalizar

| # | Campo | Cuándo es obligatorio |
|---|---|---|
| 1 | `owner_id` | Al crear |
| 2 | `outcome` | Al finalizar |
| 3 | `resumen_posterior` | Al finalizar |
| 4 | `siguiente_paso` | Al finalizar |

---

## Objetivo estratégico — Las 4 preguntas del módulo

| Pregunta | Fuente de datos |
|---|---|
| ¿Qué reuniones tenemos hoy? | `fecha = hoy` + `estado IN (programada, confirmada)` |
| ¿Qué reuniones están por cerrar negocio? | `tipo IN (negociacion, cierre)` + `probabilidad_cierre_post ≥ 70` |
| ¿Qué se habló con cada prospecto? | `resumen_posterior` + `acuerdos_alcanzados` por `prospect_id` |
| ¿Qué próximos pasos hay post-reunión? | `siguiente_paso` + `proxima_fecha_sugerida` de reuniones `finalizadas` |

---

## Criterios de aceptación (DoD)

Para que esta spec se considere implementada:

- [ ] Vista de agenda (calendario + lista) con reuniones del día y semana
- [ ] CRUD completo de reuniones
- [ ] Validación de los 4 campos obligatorios (owner, outcome, resumen, siguiente paso)
- [ ] KPIs del dashboard en tiempo real
- [ ] Briefing IA generado automáticamente 1h antes
- [ ] Recordatorios automáticos (interno 24h/1h + externo 24h/30min)
- [ ] Registro de outcome con derivación automática al Pipeline
- [ ] Resumen IA post-reunión generado automáticamente
- [ ] Email + WhatsApp post-reunión generados por IA (borradores)
- [ ] Estados de reunión con transiciones válidas
- [ ] Meeting Summary Bot extrae acuerdos y objeciones automáticamente
- [ ] CRM Update Bot actualiza Pipeline al registrar outcome
- [ ] Historial de reuniones por prospecto / cliente
- [ ] Exportar reuniones a CSV
- [ ] Métricas IA registradas por cada ejecución

---

## Próximos pasos

1. Aprobar esta spec con el equipo — **cierra el módulo Comercial completo**
2. Iniciar specs del módulo **Delivery** (Clientes, Servicios, Proyectos, Tareas)
3. Definir schema Prisma para entidad `Meeting`
4. Diseñar endpoints REST (`/api/meetings`)
5. Definir integración con Google Calendar y Calendly
6. Especificar el Meeting Brief Bot como servicio IA pre-scheduled
