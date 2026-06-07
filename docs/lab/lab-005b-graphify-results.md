# LAB-005B — Graphify MVP: Resultados

**Fecha:** 2026-06-07  
**Decisión final:** Adoptar parcialmente (backend excelente, frontend limitado)

---

## Instalación realizada

**Paquete:** `graphifyy 0.8.33` (PyPI name: `graphifyy`, no `graphify-ai`)  
**Fuente:** `pip install git+https://github.com/safishamsi/graphify.git`  
**Mecanismo:** Skill de Claude Code instalada en `~/.claude/skills/graphify/SKILL.md`  
**Comando de activación:** `/graphify` dentro de Claude Code

### Proceso de indexación

```
Paths indexados:
  apps/api/src/            → 96 archivos .ts (backend NestJS)
  src/api/inspyra.ts       → 1 archivo (API client frontend)
  src/erp/ERPPrototype.tsx → 1 archivo (frontend principal)

Total: 98 archivos backend + 2 frontend = 673 nodos, 1329 edges, 20 comunidades
Costo LLM: $0 (Pass 1 AST local únicamente — corpus code-only, Pass 3 no aplica)
Tiempo de indexación: ~15 segundos
```

### Limitación encontrada en detección

`graphify detect()` no procesa archivos individuales (`.ts`, `.tsx`), solo directorios. Los archivos `inspyra.ts` y `ERPPrototype.tsx` requirieron extracción manual directa via `extract(files, cache_root)`. Se integró el resultado al grafo final manualmente.

**Workaround confirmado:** `extract([Path('src/api/inspyra.ts'), Path('src/erp/ERPPrototype.tsx')], cache_root=Path('.'))` funciona correctamente.

---

## Problemas encontrados

| Problema | Severidad | Workaround |
|---|---|---|
| `detect()` ignora archivos individuales, solo directorios | Media | Usar `extract()` directamente sobre archivos individuales |
| `schema.prisma` no indexado (Tree-sitter no tiene parser Prisma) | Alta | Sin workaround — los enums y modelos Prisma no aparecen en el grafo |
| Queries en lenguaje natural fallan si el vocabulario no coincide exactamente con IDs del grafo | Media | Usar `graphify explain "NombreExacto"` en vez de queries libres |
| `ProspectEstado` (enum) no encontrado como nodo | Alta | El AST extractor no parsea enums de Prisma schema |
| Nodo `inspyra.ts` se llama `api_inspyra` en el grafo (no `inspyra.ts`) | Baja | Usar `graphify explain "api_inspyra"` |

---

## Resultado de las 5 queries

### Query 1 — ¿Dónde se implementa LISTO_PROPUESTA → LISTO_OUTREACH?

**Método usado:** `graphify explain ".approve()"` + `graphify explain "ProposalsService"`

**Resultado:**

```
graphify explain "ProposalsService" →
  ProposalsService (proposals/proposals.service.ts L203, degree=19)
  Métodos: .approve(), .generate(), .reject(), .regenerate(), .translate(),
           .runProposalAgent(), .buildOutreachPrompt(), .buildCommercialPrompt(),
           .spawnClaude(), .parseAgentOutput(), .toOutreachMarkdown(), etc.
  Consumido por: proposals.module.ts, proposals.controller.ts

graphify explain ".approve()" →
  ID: proposals_proposals_controller_proposalscontroller_approve
  Source: proposals.controller.ts L39, degree=1
  Solo conectado a: ProposalsController [method]
```

**Evaluación:** PARCIAL. El grafo identifica `ProposalsService` y su método `.approve()` en `proposals.service.ts`, pero no puede trazar que dentro de ese método se ejecuta `prospect.update → estado: LISTO_OUTREACH`. El AST captura la existencia del método, no su lógica interna. Para saber el detalle hay que leer el archivo.

**Veredicto Query 1:** 3/5 — módulo y servicio correctos, método identificado, pero el side-effect de estado no es visible sin leer el código.

---

### Query 2 — ¿Qué módulos dependen de ProspectValidation?

**Método usado:** `graphify query "ProspectValidation modules"` + `graphify explain "ProspectValidationController"`

**Resultado:**

```
graphify explain "ProspectValidationController":
  Source: prospect-validation.controller.ts L14, degree=11
  Métodos: .create(), .review(), .runAgent(), .findAll(), .findOne(),
           .getKpis(), .getScoreDrift(), .recalculate()
  Consumido por: prospect-validation.module.ts

graphify query "ValidationFeedback ProspectValidationService":
  → ProspectValidationService (backend: prospect-validation.service.ts L25)
  → ValidationFeedback (frontend: src/api/inspyra.ts L199)
```

**Evaluación:** BUENA. El grafo identifica correctamente que `ProspectValidation` tiene un controlador con 8 endpoints, un módulo de NestJS, y que `ValidationFeedback` también existe en el frontend (inspyra.ts). La conexión frontend↔backend está en el grafo porque indexamos ambos.

**Veredicto Query 2:** 4/5 — módulos identificados, conexión frontend detectada, pero no lista los servicios de otros módulos que importan ProspectValidation (ej: enrichment.service usa el resultado de validation como prerequisito).

---

### Query 3 — ¿Qué archivos participan en el flujo Research→Outreach?

**Método usado:** `graphify path "ResearchService" "OutreachService"`

**Resultado:**

```
Shortest path (4 hops):
ResearchService
  <--imports-- research.module.ts
  --imports--> DatabaseModule
  <--imports-- outreach.module.ts
  --imports--> OutreachService
```

**Evaluación:** LIMITADA pero interesante. El grafo conecta Research y Outreach a través de `DatabaseModule` (el módulo compartido de base de datos). Es una ruta real y válida: ambos módulos dependen de la misma capa de datos. Pero no traza el flujo de negocio (estado de prospecto) — ese conocimiento vive en Project Brain, no en el grafo.

**Veredicto Query 3:** 2/5 — encuentra conexión técnica real, pero no el flujo semántico del pipeline.

---

### Query 4 — ¿Dónde se usa ProspectEstado?

**Método usado:** `graphify explain "ProspectEstado"` (falló: no encontrado)  
**Fallback:** grep + inspección manual del grafo

**Resultado:**

```
graphify explain "ProspectEstado" → "No node matching found"
```

El enum `ProspectEstado` no existe como nodo en el grafo porque:
1. `schema.prisma` no fue indexado (Tree-sitter sin parser Prisma)
2. El tipo `ProspectEstado` importado desde `@prisma/client` en los servicios TypeScript tampoco genera un nodo — Graphify no rastrea tipos de paquetes externos

Para responder esta query habría que leer el archivo directamente.

**Veredicto Query 4:** 0/5 — fallo total. Este es el límite más importante de Graphify para este proyecto.

---

### Query 5 — ¿Qué dependencias tiene ERPPrototype.tsx?

**Método usado:** `graphify explain "api_inspyra"` (node ID de inspyra.ts)

**Resultado:**

```
inspyra.ts (src/api/inspyra.ts L1, community=5, degree=40)

Contiene y expone:
  authApi, enrichmentApi, outreachApi, proposalsApi, prospectsApi,
  researchApi, validationsApi, agentRoiApi

Tipos exportados:
  Prospect, ProspectKpis, PaginationMeta, ProspectValidation,
  ValidationFeedback, ValidationKpis, EnrichmentJob, ResearchJob,
  ResearchCandidate, ContactChannel, CommercialProposalData,
  AgentRoiDashboard, DecisionFactors, OutreachActivity, OutreachFunnel

Importado por: ERPPrototype.tsx ← confirmado con edge [imports_from]
```

**Evaluación:** EXCELENTE. Esta es la query con mejor resultado. El grafo sabe que `ERPPrototype.tsx` importa de `inspyra.ts`, y que `inspyra.ts` contiene 8 namespaces de API con todos sus tipos. En 2 segundos, sin leer el archivo de 6.000 líneas.

**Veredicto Query 5:** 5/5 — respuesta completa, útil, verificable.

---

## Calidad de respuestas por tipo de consulta

| Tipo de query | Calidad | Herramienta que funciona mejor |
|---|---|---|
| "¿Qué métodos tiene X?" | Excelente | `graphify explain "X"` |
| "¿Qué importa X?" | Excelente | `graphify explain "X"` → edges imports_from |
| "¿Quién usa X?" | Buena | `graphify explain "X"` → edges entrantes |
| "¿Camino entre A y B?" | Buena | `graphify path "A" "B"` |
| "¿Qué hace el método Y internamente?" | Nula | El AST no lee lógica, solo estructura |
| "¿Dónde se usa enum Z?" | Nula (si es Prisma) | Sin workaround |
| Query en lenguaje natural libre | Variable | Depende del vocabulario exacto del grafo |

---

## Limitaciones observadas

### Limitación 1 — Schema Prisma no indexado

**Impacto alto.** Todos los enums y modelos definidos en `schema.prisma` son invisibles para Graphify:
- `ProspectEstado` (12 estados del pipeline) → no existe en el grafo
- `ContactChannel`, `OutreachActivityType`, `ValidationStatus` → no existen
- Relaciones entre tablas → no existen

**Consecuencia:** Para queries relacionadas con el modelo de datos, Graphify no aporta valor.

### Limitación 2 — Lógica interna no visible

El AST captura estructura (clases, métodos, imports) pero no semántica (qué hace el método, qué valores cambia). La transición `LISTO_PROPUESTA → LISTO_OUTREACH` ocurre dentro del método `.approve()` — el grafo sabe que ese método existe pero no qué hace.

**Consecuencia:** Para entender side-effects, reglas de negocio o lógica condicional, hay que leer el código. Graphify reduce el tiempo para llegar al archivo correcto, no elimina la necesidad de leerlo.

### Limitación 3 — Queries en lenguaje natural no son robustas

`graphify query "texto libre"` expande el texto a vocabulario del grafo via IDF scoring. Si el vocabulario del query no coincide exactamente con los labels de los nodos, el resultado es garbage. Las queries más confiables son `graphify explain "NombreExactoDelNodo"` y `graphify path "A" "B"`.

### Limitación 4 — ERPPrototype.tsx produce pocos nodos útiles

El archivo tiene 6.000 líneas pero Graphify extrajo principalmente las importaciones y algunos types. Los componentes React internos, hooks, lógica de tabs y acciones de outreach no son nodos navegables. El grafo sabe que ERPPrototype importa `inspyra.ts`, pero no que dentro hay un ProspectDrawer con 4 tabs.

---

## Recomendación final: Adoptar parcialmente

### Adoptar para el backend

**Graphify aporta valor real y demostrado para el backend NestJS:**

- `graphify explain "XService"` → mapa completo de métodos del servicio en 1 segundo
- `graphify explain "XController"` → lista de endpoints en 1 segundo  
- `graphify path "A" "B"` → ruta de dependencias entre módulos
- `graphify explain "api_inspyra"` → mapa del API client completo

Estos casos de uso son frecuentes en desarrollo y el grafo los resuelve correctamente. El ahorro de tiempo es real aunque menor al 71.5x teórico — estimado real: 10-20x para consultas estructurales de backend.

### No adoptar para modelo de datos ni lógica interna

Graphify no reemplaza la lectura del schema.prisma ni del código interno de los métodos. Para esos dominios, Project Brain + leer el archivo directamente sigue siendo el flujo correcto.

### Mantener el grafo actualizado: sí, pero manual

No automatizar el rebuild en CI todavía. Correr `/graphify apps/api/src src/api/inspyra.ts src/erp/ERPPrototype.tsx` manualmente cuando se agregan nuevos módulos o se refactoriza la estructura. El grafo actual tiene vida útil de semanas o meses dado que la estructura de módulos no cambia frecuentemente.

### Cómo usar de ahora en adelante

```
1. Para saber qué métodos tiene un servicio:
   → graphify explain "NombreServicio"

2. Para saber qué importa un módulo:
   → graphify explain "nombre.module.ts" o "NombreModule"

3. Para encontrar el camino entre dos conceptos:
   → graphify path "A" "B"

4. Para saber qué usa el API client:
   → graphify explain "api_inspyra"

5. Para todo lo demás (estados, lógica, reglas de negocio):
   → Project Brain + leer el archivo
```

---

## Resumen ejecutivo

| Dimensión | Resultado |
|---|---|
| Costo de instalación | $0 (AST local, 15 segundos) |
| Nodos generados | 673 nodos, 1329 edges, 20 comunidades |
| Casos de uso que funcionan | 3/5 queries con resultado útil |
| Casos de uso que fallan | Prisma schema, lógica interna, lenguaje natural |
| God nodes descubiertos | JwtPayload (84 edges), PrismaService (53 edges) |
| Reducción de tokens estimada (real) | 10-20x para consultas estructurales |
| Veredicto | Adoptar parcialmente — valioso para backend, inútil para Prisma/lógica |

**El 20% adicional que Graphify aporta sobre Project Brain es específico del dominio estructural del código backend. Es valor real. No es el 71.5x teórico, pero sí es velocidad medible cuando la pregunta es "¿qué módulos dependen de X?" o "¿qué endpoints expone Y?".**
