# 02 — Arquitectura del Sistema

---

## Stack tecnológico

### Frontend

| Componente | Tecnología | Detalle |
|---|---|---|
| Framework | React 18 + Vite | SPA, build con Vite |
| Archivo principal | `src/erp/ERPPrototype.tsx` | ~6.000 líneas, `@ts-nocheck`, todo el ERP en un archivo |
| Estilos | CSS variables + clases utilitarias | Definidas en `src/erp/erp.css` |
| Data fetching | React Query (`@tanstack/react-query`) | `useQuery` + `useQueryClient` para invalidaciones |
| API client | `src/api/inspyra.ts` | Todas las llamadas a la API en un solo archivo |
| Auth | JWT en `localStorage` vía `authToken` | |

### Backend

| Componente | Tecnología | Detalle |
|---|---|---|
| Framework | NestJS | Modular, decoradores, DI |
| ORM | Prisma | Schema en `apps/api/prisma/schema.prisma` |
| Base de datos | PostgreSQL | Puerto 5433 en local |
| Auth | JWT + Guards (`JwtAuthGuard`) | `@CurrentUser()` decorator para extraer tenant |
| Estructura | `apps/api/src/modules/` | Un directorio por módulo |

### Módulos backend activos

```
auth              — JWT login, refresh tokens
users             — gestión de usuarios por tenant
prospects         — CRM core, estados, validaciones
prospect-validation — Opportunity Agent decisions
deals             — pipeline de ventas
clients           — clientes activos
services          — servicios contratados
service-catalog   — catálogo de servicios
service-intelligence — reglas de oportunidad
pricing           — modelos de precio
service-accounts  — identidad de agentes IA
agent-runs        — log de ejecuciones de agentes
agent-roi         — ROI de agentes por período
health            — healthcheck
research          — Research Agent
enrichment        — Enrichment Agent
proposals         — Proposal Agent + traducción
outreach          — Outreach execution (ERP-032)
```

### Base de datos

- PostgreSQL :5433
- Todas las tablas prefijadas por `@@map("snake_case")`
- Tenant isolation en todas las queries (campo `tenantId`)
- Soft delete via `deletedAt DateTime?` en entidades principales
- Índices en `[tenantId, estado]`, `[tenantId, score]`, etc.

---

## OpenClaw — Capa de Agentes

OpenClaw es la arquitectura de agentes IA del sistema (spec-27).

**Regla de oro (invariante absoluto):**
```
Agente → MCP Server → API REST → PostgreSQL
Nunca saltear capas
```

Los agentes IA interactúan con el sistema exclusivamente a través de la API REST. Nunca acceden a la DB directamente. El MCP Server (:4000, planificado) expondrá herramientas para que los agentes consulten y modifiquen datos.

### Agentes implementados

| Agente | Módulo | Mecanismo | Estado |
|---|---|---|---|
| Research Agent | `research` | `spawn('claude', ...)` subprocess | Activo |
| Opportunity Agent | `prospect-validation` | `spawn('claude', ...)` subprocess | Activo |
| Enrichment Agent | `enrichment` | `spawn('claude', ...)` subprocess | Activo |
| Proposal Agent | `proposals` | `spawn('claude', ...)` subprocess | Activo |

Todos los agentes se ejecutan como subprocesos Claude CLI. El resultado se parsea y persiste via Prisma.

---

## Principios de arquitectura

### 1. Extender antes que reemplazar

Si un módulo o componente ya existe, extenderlo. No crear uno paralelo. Ejemplo: ERP-032 (Outreach) se integró en el drawer y tabs existentes, no creó nuevas páginas.

### 2. Reutilizar antes que crear

Si una funcionalidad existe en otro módulo, importarla. No duplicar. Si un estado ya existe en el enum, usarlo. No agregar uno nuevo equivalente.

### 3. Evitar duplicación en todos los niveles

- No duplicar estados del enum `ProspectEstado`
- No duplicar endpoints con la misma semántica
- No duplicar componentes UI que ya existen
- No duplicar lógica de filtrado, paginación o validación

### 4. Human approval siempre

Ningún agente IA puede aprobar, validar o tomar decisiones finales. Cada acción de agente produce un output que requiere revisión humana antes de avanzar en el pipeline.

### 5. Tenant isolation

Toda query de datos lleva `where: { tenantId }`. Sin excepción.

### 6. Separación de concerns por spec

Cada módulo tiene una spec correspondiente en `spec-driven/`. Leer la spec antes de modificar el módulo.

---

## Estructura de carpetas relevante

```
inspyra-marketing/
├── apps/
│   └── api/
│       ├── prisma/schema.prisma        — fuente de verdad del schema
│       └── src/
│           ├── app.module.ts           — módulos registrados
│           ├── common/                 — guards, decorators, DTOs comunes
│           ├── config/                 — configuración de entorno
│           ├── database/               — PrismaService
│           └── modules/                — 18 módulos de negocio
├── src/
│   ├── api/inspyra.ts                  — cliente API completo
│   └── erp/ERPPrototype.tsx            — frontend principal
├── spec-driven/                        — 29 specs ERP-001..ERP-031
├── specs/                              — seguridad, estándares
├── docs/project-brain/                 — este directorio
└── CLAUDE_PROJECT_CONTEXT.md           — punto de entrada para Claude
```
