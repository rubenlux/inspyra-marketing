# 09 — Roadmap

---

## Completado

### Pipeline de Prospección (Core)
| Spec | Módulo | Descripción |
|---|---|---|
| ERP-001 | prospects | CRM core — CRUD, estados, filtros, tabla |
| ERP-023 | core foundation | Backend NestJS, Prisma, PostgreSQL, auth, tenants |
| ERP-024 | prospect-validation | Opportunity Agent — scoring 0–100, validación humana |
| — | research | Research Agent — investigación inicial de prospectos |
| — | enrichment | Enrichment Agent — enriquecimiento de perfil completo |
| ERP-026 | proposals | Proposal Agent — Outreach Brief y Commercial Proposal |
| ERP-027/028 | proposals | Multimercado — LATAM vs USA, outreach refinements |
| ERP-029 | proposals | Outreach Brief refinements — tono, CTA suave |
| ERP-030 | proposals | communicationLanguage + correcciones de tono |
| ERP-031 | proposals | Translation Layer — traducción on-demand al español |
| ERP-032 | outreach | Outreach Execution MVP — contactar, registrar respuesta, reunión |

### Pipeline Comercial
| Spec | Módulo | Descripción |
|---|---|---|
| ERP-004 | deals | Pipeline de ventas (kanban/list) |
| ERP-006 | clients | Gestión de clientes activos |
| ERP-007 | services | Servicios contratados por cliente |

### Infraestructura
| Spec | Módulo | Descripción |
|---|---|---|
| ERP-015 | hostingguard | Monitoreo de dominios, SSL, hosting |
| ERP-022 | mcp-ai-tool-gateway | Gateway MCP para herramientas IA |
| spec-27 | openclaw | Arquitectura de agentes — diseñada, MCP server pendiente |
| ERP-033 | project-brain | Memoria persistente del proyecto (este documento) |

### Catálogo y Operaciones
- `service-catalog` — catálogo de servicios
- `service-intelligence` — reglas de oportunidad
- `pricing` — modelos de precio
- `service-accounts` — identidad de agentes
- `agent-runs` — log de ejecuciones
- `agent-roi` — ROI de agentes por período

---

## En curso

### ERP-032 — Outreach Execution
Estado: **implementado**, en uso operativo. Pendiente:
- Seguimiento multi-toque (múltiples intentos de contacto)
- Métricas de tasa de respuesta por canal
- Integración WhatsApp/Email (futura)

---

## Futuro (backlog)

### Próximo en pipeline comercial

| Item | Descripción | Prioridad |
|---|---|---|
| Columna Contactability | Score de contactabilidad visible en la tabla de prospectos | Alta |
| Email Marketing (ERP-021) | Campañas masivas + segmentación | Media |
| Seguimiento automatizado | Recordatorios, follow-up scheduling | Media |
| Integración WhatsApp API | Envío directo desde el ERP | Futura |

### Knowledge Layer (LAB-005)

| Fase | Descripción | Estado |
|---|---|---|
| Fase 1 | Project Brain (este doc) + Claude Code Memory | En ejecución |
| Fase 2 | Graphify — grafo de código sobre el codebase | Pendiente |
| Fase 3 | Rebuild automatizado del grafo en CI | Futuro |
| Fase 4 | MCP Server Inspyra (:4000) — acceso de agentes a datos de negocio | Futuro |

**Graphify:** Herramienta evaluada para generar un grafo semántico del código (71.5x reducción de tokens). Se implementará cuando el codebase esté más estabilizado (post-ERP-035 aproximadamente). Ver `LAB-005` en los chats del proyecto.

### Productos nuevos

| Producto | Descripción | Horizonte |
|---|---|---|
| Content Lab | Generación y gestión de contenido para redes | 2026-H2 |
| News Engine | Monitoreo de noticias relevantes por cliente | 2026-H2 |
| Social Publishing Hub (ERP-020) | Publicación multi-red desde el ERP | 2027 |
| Inspyra Cloud (ERP-016) | Infraestructura gestionada | 2027 |
| Inspyra Mail (ERP-017) | Email gestionado | 2027 |

---

## Criterio de priorización del roadmap

> ¿Esta feature acerca un prospecto a convertirse en cliente?

Si sí → Alta prioridad.  
Si reduce trabajo operativo → Media prioridad.  
Si es infraestructura/producto nuevo → Baja prioridad hasta que el pipeline comercial sea estable.
