# 03 — Reglas de UI (CRÍTICO)

Este archivo contiene restricciones obligatorias. Violarlas genera deuda técnica inmediata.

---

## Regla principal

**ERPPrototype.tsx es el frontend operativo único.**

Todo cambio de UI va dentro de `src/erp/ERPPrototype.tsx`. No se crean archivos de componentes separados, no se crean páginas nuevas, no se crean layouts alternativos.

---

## LO QUE NO SE HACE (lista de prohibiciones)

### Estructuras prohibidas

- **NO** crear dashboards dentro de dashboards
- **NO** crear páginas nuevas sin justificación técnica explícita y aprobación
- **NO** crear routers nuevos (`<Routes>`, `<Switch>`, nuevas rutas en `main.tsx`)
- **NO** crear layouts paralelos al layout actual del ERP
- **NO** crear sistemas de navegación alternativos

### Duplicación prohibida

- **NO** duplicar KPIs que ya existen en la fila de métricas
- **NO** duplicar tablas de prospectos
- **NO** duplicar tabs en el ProspectDrawer (ya existen: assessment, contacto, propuesta, historial)
- **NO** duplicar el ProspectDrawer
- **NO** duplicar filtros que ya existen en el panel de búsqueda
- **NO** agregar estados a `ProspectEstado` que sean equivalentes a uno existente

### Complejidad prohibida

- **NO** agregar librerías de UI sin justificación (Chakra, MUI, Ant, etc.)
- **NO** agregar sistemas de estado globales (Redux, Zustand) — React Query ya maneja el estado del servidor
- **NO** agregar abstracciones prematuras (hooks genéricos, factories de componentes)

---

## LO QUE SÍ SE HACE

### Extensión

- **SÍ** extender `ERPPrototype.tsx` con nuevas secciones dentro del layout existente
- **SÍ** agregar nuevas acciones dentro del `ProspectDrawer` existente
- **SÍ** agregar contenido dentro de los tabs existentes (assessment, contacto, propuesta, historial)
- **SÍ** agregar nuevas filas de KPIs abajo de las existentes cuando hay datos nuevos para mostrar
- **SÍ** reutilizar los componentes locales ya definidos (`MiniStatP`, `Icon`, `Badge`, etc.)

### Data fetching

- **SÍ** usar `useQuery` con `queryKey` descriptivo para todos los datos del servidor
- **SÍ** invalidar queries relacionadas después de mutaciones (`queryClient.invalidateQueries`)
- **SÍ** pasar `enabled: !!token` o `enabled: isRealId` para evitar fetches sin contexto

---

## Estructura del ProspectDrawer

El drawer tiene tabs fijas. Antes de agregar contenido, identificar en qué tab corresponde:

| Tab | Key | Contenido |
|---|---|---|
| Calificación IA | `assessment` | Validation score, opportunity analysis, enrich trigger |
| Contacto | `contacto` | Datos de contacto, acciones de outreach, canal, notas |
| Propuesta | `propuesta` | Outreach Brief, Commercial Proposal, traducción |
| Historial | `historial` | Timeline de eventos, activities, estados pasados |

Si el contenido no encaja en ninguno de los 4, justificar antes de crear un quinto tab.

---

## Convenciones de estilo

- Variables CSS: `var(--primary)`, `var(--primary-soft)`, `var(--ink-900)`, `var(--ink-500)`, etc.
- Botones de acción: `style={{ fontSize: 12, padding: "4px 12px", borderRadius: 8 }}`
- Cards: `className="card"` con padding interno
- Grids de KPIs: `className="grid"` con `gridTemplateColumns`
- Colores de estado:
  - Verde: `#10B981` (convertido, aprobado)
  - Azul: `#5B5BF7` / `var(--primary)` (en proceso)
  - Naranja: `#F59E0B` (pendiente, atención)
  - Rojo: `#EF4444` (descartado, error)
  - Gris: `#9CA3AF` / `var(--ink-400)` (neutro, archivado)

---

## Densidad de información

El ERP está diseñado para densidad alta. No agregar espacios en blanco innecesarios, headers decorativos ni separadores vacíos. Cada elemento visible debe aportar información operativa.
