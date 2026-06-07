# LAB-005A — Graphify Feasibility

**Fecha:** 2026-06-07  
**Estado:** Evaluación — no implementar todavía  
**Contexto previo:** LAB-005 evaluó Graphify teóricamente. ERP-033 construyó Project Brain (memoria de negocio + arquitectura). Este documento evalúa si Graphify agrega valor incremental real ahora que la base existe.

---

## Premisa

Project Brain cubre ~80% del problema de pérdida de contexto. Antes de Graphify, la pregunta era "¿cómo construir memoria?". Ahora la pregunta es más precisa:

> ¿Qué consultas reales del desarrollo diario hace Claude que Project Brain NO puede responder, y Graphify sí?

---

## 1. Qué cubre Project Brain (y por qué Graphify no lo duplica)

| Dominio | Cubierto por Project Brain | Graphify agregaría |
|---|---|---|
| Reglas de negocio | ✓ `04-commercial-rules.md`, `05-proposal-rules.md` | ✗ Nada |
| Decisiones históricas | ✓ `08-known-decisions.md` | ✗ Nada |
| Convenciones UI | ✓ `03-ui-rules.md` | ✗ Nada |
| State machines | ✓ `06-state-machines.md` | ✗ Nada |
| Responsabilidades de agentes | ✓ `07-agent-rules.md` | ✗ Nada |
| Roadmap | ✓ `09-roadmap.md` | ✗ Nada |
| Relaciones entre funciones | ✗ No cubierto | ✓ Call graph completo |
| Qué módulo llama a qué servicio | ✗ No cubierto | ✓ Edge graph preciso |
| Dónde se usa una función específica | ✗ No cubierto | ✓ Búsqueda semántica |
| Schema DB → código que lo usa | ✗ No cubierto | ✓ AST + Prisma introspection |
| Clusters de módulos por responsabilidad | ✗ No cubierto | ✓ Leiden clustering |

**Conclusión:** Project Brain y Graphify son complementarios, no competidores. Cubren dominios distintos.

---

## 2. Consultas reales del desarrollo que Graphify aceleraría

Estas son consultas reales que aparecen en sesiones de desarrollo de Inspyra:

### "¿Qué pasa cuando se aprueba un enrichment?"
**Sin Graphify:** Claude lee `enrichment.service.ts` completo (~400 líneas) + busca referencias en `prospects.service.ts`.  
**Con Graphify:** `graph.query("enrichment approve side effects")` → respuesta en ~150 tokens con los 3 métodos que se llaman.

### "¿Qué módulos dependen de PrismaService directamente?"
**Sin Graphify:** grep manual en 18 directorios.  
**Con Graphify:** BFS desde nodo `PrismaService` → lista inmediata de los 18 módulos con sus profundidades.

### "¿Dónde se usa el enum ProspectEstado fuera de prospects.service.ts?"
**Sin Graphify:** Claude lee todos los archivos donde grep encuentra `ProspectEstado`.  
**Con Graphify:** `graph.query("ProspectEstado references")` → lista de 4-5 archivos en 80 tokens.

### "¿Qué endpoints expone el módulo outreach?"
**Sin Graphify:** Claude lee `outreach.controller.ts` completo.  
**Con Graphify:** nodo `OutreachController` → edges a 7 rutas en 60 tokens.

### "¿Qué campos de Prospect usa el Proposal Agent al generar?"
**Sin Graphify:** Claude lee `proposals.service.ts` → 400+ líneas para encontrar los 12 campos.  
**Con Graphify:** edge graph desde `ProposalAgent.generate` → campos de Prospect referenciados.

---

## 3. Ahorro estimado de tokens por sesión

Baseline actual (sesión típica de implementación de una feature):

| Tarea | Tokens sin Graphify | Tokens con Graphify |
|---|---|---|
| Entender módulo destino (leer completo) | ~8.000 | ~600 (query) |
| Encontrar dependencias (grep + leer) | ~12.000 | ~400 (BFS) |
| Verificar no romper otros módulos | ~15.000 | ~800 (impact analysis) |
| Entender schema relevante | ~3.000 | ~300 (Prisma introspection) |
| **Total exploración** | **~38.000** | **~2.100** |
| **Ahorro** | — | **~94%** |

Nota: Los tokens de implementación (escribir código) no cambian. El ahorro es solo en la fase de exploración.

Con 10 features/mes × $0.03 exploración promedio = **$0.30/mes ahorrado en tokens**. El ahorro real es en **calidad de decisiones** (Claude con el mapa completo comete menos errores de integración).

---

## 4. Cómo integrar Graphify con Project Brain

### Separación clara de responsabilidades

```
Project Brain  →  "Por qué" y "qué reglas"
Graphify       →  "Dónde está" y "quién llama a quién"
CLAUDE.md      →  Instrucciones operativas para Claude
spec-driven/   →  Constitución técnica del sistema
```

### Sin duplicación

Graphify no debe documentar lo que ya está en Project Brain:
- `GRAPH_REPORT.md` (output de Graphify) → solo estructura de código, no reglas de negocio
- Las decisiones siguen en `08-known-decisions.md`, no en el grafo

### Flujo de consulta recomendado para Claude

```
1. Leer CLAUDE_PROJECT_CONTEXT.md (reglas, restricciones, invariantes)
2. Leer Project Brain relevante (contexto de negocio)
3. Consultar Graphify MCP (estructura del código)
4. Leer solo los archivos específicos que Graphify señala
5. Implementar
```

---

## 5. Arquitectura recomendada para prueba MVP

### Alcance mínimo

```
/graphify .                    → genera graph.json + graph.html
python -m graphify serve       → MCP server en stdio
.mcp.json                      → registra el MCP en el proyecto
```

### Qué indexar

| Target | Razón |
|---|---|
| `apps/api/src/modules/` | 18 módulos — el mapa de dependencias es el mayor valor |
| `apps/api/prisma/schema.prisma` | Prisma introspection → relaciones tabla/modelo |
| `src/api/inspyra.ts` | API client — cómo el frontend llama al backend |
| `src/erp/ERPPrototype.tsx` | El monolito frontend — clusters por feature |

**No indexar con Pass 3 (Claude semantic):**
- `spec-driven/` → ya está cubierto por Project Brain + CLAUDE.md
- `docs/project-brain/` → es el Project Brain mismo
- `node_modules/`, `dist/`, `prisma/migrations/`

### Configuración de Graphify (estimada)

```bash
# Instalar
pip install graphify-ai

# Correr Pass 1+2 (gratis, local)
graphify apps/api/src/modules src/api/inspyra.ts src/erp/ERPPrototype.tsx apps/api/prisma/schema.prisma

# Iniciar MCP server
python -m graphify serve --port stdio

# Registrar en .mcp.json del proyecto
{
  "mcpServers": {
    "graphify": {
      "command": "python",
      "args": ["-m", "graphify", "serve"]
    }
  }
}
```

### Costo estimado del MVP

| Paso | Costo |
|---|---|
| Pass 1 (AST, local) | $0 |
| Pass 2 (no aplica — sin videos) | $0 |
| Pass 3 sobre spec-driven/ (si se incluye) | ~$1.50 |
| MCP server (proceso local) | $0 |
| **Total** | **$0–$1.50** |

---

## 6. Riesgos del MVP

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| graph.json se desactualiza con el código | Alta | Rebuildar manualmente en cada sesión de desarrollo importante |
| Graphify no entiende los patrones NestJS específicos | Media | Verificar la calidad del grafo con 3-4 queries de prueba antes de confiar |
| `ERPPrototype.tsx` (6.000 líneas) produce nodos confusos | Alta | Indexarlo por separado, evaluar calidad del grafo resultante |
| Falsos positivos en el call graph | Baja | Usar como guía, siempre verificar contra el código |
| Herramienta abandonada sin mantenimiento | Baja | graph.json es formato estándar NetworkX, portable |

---

## 7. Criterio de éxito del MVP

Antes de considerar Graphify como parte permanente del stack, verificar que responde correctamente estas 5 queries:

1. `"What calls ProspectsService.updateEstado?"` → debe listar outreach.service, proposals.service
2. `"Dependencies of OutreachController"` → debe listar OutreachService, PrismaService, JwtAuthGuard
3. `"Fields of Prospect used in proposals.service.ts"` → debe listar ~12 campos
4. `"What endpoints does ProposalsController expose?"` → debe listar los 6 endpoints
5. `"What modules import DatabaseModule?"` → debe listar los 18 módulos

Si responde correctamente ≥4/5, el valor está validado.

---

## 8. Recomendación

**Instalar el MVP en la próxima sesión disponible.**

El costo es prácticamente cero (30-60 minutos, $0 si se omite Pass 3). El riesgo es mínimo. Y ahora que Project Brain cubre el contexto de negocio, Graphify tiene una base sobre la cual integrarse sin duplicar funciones.

La combinación de las tres capas:

```
Project Brain      →  Contexto de negocio (reglas, decisiones, restricciones)
Graphify MCP       →  Mapa estructural del código (relaciones, dependencias)
Claude Code Memory →  Preferencias del equipo y contexto operativo
```

...produce un agente que puede arrancar una tarea con contexto completo sin leer miles de líneas de código en cada sesión.

**Orden de ejecución:**
1. Instalar Graphify (Pass 1 local, sin Pass 3 inicialmente)
2. Verificar calidad con las 5 queries de validación
3. Si pasa el test → registrar en `.mcp.json` permanentemente
4. Si no pasa → evaluar configuración o descartar

No bloquear features comerciales por esto. Este MVP puede hacerse en paralelo con ERP-034.
