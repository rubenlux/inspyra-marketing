# 06 — State Machines

---

## Estado Operacional del Prospecto (`ProspectEstado`)

### Estados

| Estado | Descripción |
|---|---|
| `NUEVO` | Recién creado. Aún no investigado. |
| `INVESTIGADO` | Research Agent lo procesó. Score asignado. |
| `ENRIQUECIDO` | Enrichment Agent completó el perfil. Datos de contacto disponibles. |
| `LISTO_PROPUESTA` | Enrichment aprobado por humano. Proposal Agent puede actuar. |
| `LISTO_OUTREACH` | Propuesta aprobada por humano. Listo para contactar. |
| `CONTACTADO` | Operador registró el primer contacto. Canal y fecha registrados. |
| `RESPONDIO` | El prospecto respondió al contacto inicial. |
| `REUNION_AGENDADA` | Se agendó una reunión/llamada. |
| `PASO_A_PIPELINE` | Avanzó al pipeline comercial (Deal creado). |
| `CONVERTIDO` | Cerró como cliente. Estado terminal positivo. |
| `DESCARTADO` | No califica o no respondió. Puede reactivarse. |
| `ARCHIVADO` | Históricamente relevante pero fuera del flujo activo. |

### Transiciones válidas

Definidas en `prospects.service.ts` → `VALID_TRANSITIONS`:

```
NUEVO           → INVESTIGADO, DESCARTADO, ARCHIVADO
INVESTIGADO     → ENRIQUECIDO, DESCARTADO, ARCHIVADO
ENRIQUECIDO     → LISTO_PROPUESTA, DESCARTADO, ARCHIVADO
LISTO_PROPUESTA → LISTO_OUTREACH, DESCARTADO, ARCHIVADO
LISTO_OUTREACH  → CONTACTADO, DESCARTADO, ARCHIVADO
CONTACTADO      → RESPONDIO, DESCARTADO, ARCHIVADO
RESPONDIO       → REUNION_AGENDADA, PASO_A_PIPELINE, DESCARTADO, ARCHIVADO
REUNION_AGENDADA→ PASO_A_PIPELINE, DESCARTADO, ARCHIVADO
PASO_A_PIPELINE → CONVERTIDO, DESCARTADO, ARCHIVADO
CONVERTIDO      → (ninguna — estado terminal)
DESCARTADO      → ARCHIVADO
ARCHIVADO       → NUEVO (permite reactivar)
```

**Cualquier transición fuera de este mapa lanza `BadRequestException`.**

---

## Estado de Validación IA (`ValidationStatus`)

Vive en `ProspectValidation`. Un prospecto tiene a lo sumo una validación activa.

| Estado | Descripción |
|---|---|
| `PENDING` | Opportunity Agent procesó, humano aún no revisó |
| `VALIDATED` | Humano aprobó la evaluación del agente |
| `REJECTED` | Humano rechazó la evaluación. Se registra el motivo (`RejectionReason`) |

**La validación es un prerequisito para enrichment.** Sin `status = VALIDATED`, el Enrichment Agent no puede actuar.

### Scores de la validación

| Campo | Descripción |
|---|---|
| `agentScore` | Score 0–100 asignado por el Opportunity Agent |
| `humanScore` | Score 0–100 asignado por el humano al revisar (opcional) |
| `commercialScore` | `floor((opportunityScore + contactabilityScore) / 2)` — calculado en enrichment approval |

### Buckets de score (display en UI, NO estados en DB)

Estos son labels visuales calculados en el frontend a partir del `agentScore`:

| Label | Condición |
|---|---|
| `PRIORIDAD_MAXIMA` | `agentScore >= 90` |
| `APROBADO_IA` | `agentScore >= 75` |
| `REVISAR` | `agentScore < 75 && agentScore > 0` |
| `PENDIENTE_OPPORTUNITY` | `validation` es null (no procesado aún) |
| `DESCARTADO_IA` | `status = REJECTED` |

**Importante:** Estos buckets no existen como enum en la DB. Son derivados en el frontend.

---

## Estado de Propuesta (`ProposalStatus`)

| Estado | Descripción |
|---|---|
| `DRAFT` | Generada por el agente. Pendiente de revisión humana. |
| `APPROVED` | Aprobada por humano. Lista para usar. |
| `REJECTED` | Rechazada. Se regenera o descarta. |

### Job status del agente (`ProposalJobStatus`)

| Estado | Descripción |
|---|---|
| `PENDING` | En cola |
| `RUNNING` | Agente ejecutándose |
| `COMPLETED` | Texto generado con éxito |
| `FAILED` | Error en generación |

---

## Actividades de Outreach (`OutreachActivityType`)

Registro inmutable (append-only) de acciones del pipeline de contacto:

| Tipo | Cuándo |
|---|---|
| `CONTACTADO` | Operador marcó el primer contacto (cambia estado a CONTACTADO) |
| `SEGUIMIENTO` | Contacto de seguimiento sin respuesta |
| `SIN_RESPUESTA` | Se registra que no hubo respuesta (sin cambio de estado) |
| `RESPONDIO` | El prospecto respondió (cambia estado a RESPONDIO) |
| `REUNION_AGENDADA` | Se agendó reunión (cambia estado a REUNION_AGENDADA) |
| `NOTA` | Nota libre del operador (sin cambio de estado) |

### Canales de contacto (`ContactChannel`)

`EMAIL` · `WHATSAPP` · `INSTAGRAM` · `FACEBOOK` · `LINKEDIN` · `OTRO`

---

## Reglas de transición en outreach (definidas en `outreach.service.ts`)

| Acción | Desde estados permitidos | Nuevo estado |
|---|---|---|
| `contact()` | `LISTO_OUTREACH` | `CONTACTADO` |
| `respond()` | `CONTACTADO` | `RESPONDIO` |
| `scheduleMeeting()` | `CONTACTADO`, `RESPONDIO` | `REUNION_AGENDADA` |
| `noResponse()` | Todos los estados de outreach | sin cambio (solo log) |
| `addNote()` | Cualquiera | sin cambio (solo log) |

---

## Estado de Tenant (`MarketProfile`)

Define reglas comerciales y de pricing por tenant:

`ARGENTINA` · `LATAM` · `USA` · `CANADA` · `EUROPE`

---

## Idiomas de comunicación (`CommunicationLanguage`)

Por prospecto. Define en qué idioma se generan las propuestas:

`EN` · `ES` · `PT` · `FR` · `DE`
