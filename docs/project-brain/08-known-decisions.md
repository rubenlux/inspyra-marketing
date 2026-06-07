# 08 — Decisiones Conocidas

Registro histórico de decisiones técnicas y de producto. Formato:

```
## YYYY-MM-DD — Título
Decisión: qué se decidió
Motivo: por qué
Impacto: qué afecta
Estado: ACTIVA | OBSOLETA
```

---

## 2025-Q3 — ERPPrototype.tsx como frontend principal operativo

**Decisión:** Todo el frontend del ERP vive en un único archivo `src/erp/ERPPrototype.tsx`. No se crean componentes separados, páginas adicionales ni routers nuevos.

**Motivo:** Velocidad de iteración. En prototipado rápido, la colocalización de todo el código reduce el contexto necesario para modificaciones. El costo de navegación entre archivos supera los beneficios de separación en esta etapa.

**Impacto:** Cualquier cambio UI va en ese archivo. El archivo supera 6.000 líneas con `@ts-nocheck`.

**Estado:** ACTIVA

---

## 2025-Q3 — Research Score separado de Opportunity Score

**Decisión:** El score que genera el Research Agent y el score que genera el Opportunity Agent son valores distintos en el sistema. El Research Score va en `Prospect.score`. El Opportunity Score va en `ProspectValidation.agentScore`.

**Motivo:** Tienen metodologías distintas y sirven para propósitos distintos. El Research Score es exploratorio. El Opportunity Score es el que determina prioridad comercial.

**Impacto:** No mezclar los dos scores en KPIs ni reportes. El Commercial Score = promedio del Opportunity Score y el Contactability Score (calculado en enrichment).

**Estado:** ACTIVA

---

## 2025-Q3 — Human Approval obligatoria en cada etapa del pipeline

**Decisión:** Ningún agente IA puede mover un prospecto de una etapa a la siguiente sin revisión humana. Los puntos de aprobación son: Opportunity Assessment → Enrichment → Proposal → Outreach.

**Motivo:** Los agentes cometen errores. La reputación comercial de Inspyra depende de que los contactos sean de calidad. Un outreach equivocado tiene costo real (reputación, tiempo).

**Impacto:** Cada módulo de agente produce output en estado DRAFT/PENDING que el humano debe revisar en el ERP antes de avanzar.

**Estado:** ACTIVA

---

## 2025-Q4 — LATAM pricing distinto de USA

**Decisión:** Las propuestas comerciales para prospectos en LATAM y USA tienen estructuras de pricing distintas. LATAM: paquetes más accesibles, CTA suave. USA: pricing más directo, propuestas más completas.

**Motivo:** El poder adquisitivo y las expectativas de comunicación son distintos. Un email comercial estilo USA enviado a un prospecto argentino genera rechazo.

**Impacto:** El Proposal Agent debe leer `Prospect.communicationLanguage` y `Tenant.marketProfile` para adaptar tono y estructura. Los paquetes Esencial/Crecimiento/Completo aplican en ambos mercados pero con precios calibrados.

**Estado:** ACTIVA

---

## 2026-03 — Prospecto recibe contenido en su idioma

**Decisión:** Las propuestas (Outreach Brief y Commercial Proposal) se generan en el idioma del prospecto (`communicationLanguage`), no en el idioma del operador.

**Motivo:** La calidad de conversión cae significativamente cuando el mensaje de outreach no está en el idioma nativo del prospecto.

**Impacto:** El Proposal Agent usa `communicationLanguage` como instrucción de idioma. El operador puede solicitar traducción al español vía `POST /proposals/translate` pero la fuente de verdad es el idioma original.

**Estado:** ACTIVA

---

## 2026-03 — Operador trabaja 100% en español

**Decisión:** Toda la UI del ERP está en español (operacional: español rioplatense). Los agentes responden al operador en español. Las traducciones son vistas auxiliares temporales.

**Motivo:** El equipo operativo de Inspyra es hispanohablante. Forzarlos a trabajar en inglés o en el idioma del prospecto agrega fricción innecesaria.

**Impacto:** Labels, mensajes de error, notificaciones, textos de UI — todos en español.

**Estado:** ACTIVA

---

## 2026-04 — No crear dashboards paralelos

**Decisión:** No se crean dashboards adicionales dentro del ERP. Todo el contenido operativo va dentro de `ERPPrototype.tsx` usando las secciones y tabs existentes.

**Motivo:** En implementaciones anteriores se crearon KPIs y tablas duplicadas que mostraban información inconsistente. Esto confundió al equipo operativo.

**Impacto:** Antes de agregar cualquier elemento de UI, verificar si ya existe uno equivalente. Si existe, extenderlo. Si no existe, agregarlo al layout existente (no crear una nueva página).

**Estado:** ACTIVA

---

## 2026-05 — OutreachModule como módulo separado (justificado)

**Decisión:** A pesar de la política "extender antes que crear", `outreach` es un módulo NestJS separado (no se integró en `prospects`).

**Motivo:** El módulo maneja el modelo `OutreachActivity` (append-only, nunca se edita) que tiene semántica distinta al CRUD de `Prospect`. La separación mantiene el dominio limpio.

**Impacto:** Todo el frontend de outreach va dentro del `ProspectDrawer` existente (tabs "contacto" e "historial"). Solo el backend justificó el módulo separado.

**Estado:** ACTIVA

---

## 2026-06 — Barra pipeline estática eliminada

**Decisión:** Se eliminó la barra superior del ERP que mostraba los pasos "Descubre → Enriquece → Detecta oportunidad → Califica → Asigna → Prepara outreach".

**Motivo:** Era información estática sin datos operativos. No representaba el pipeline real. Consumía espacio vertical valioso. Agregaba ruido visual.

**Impacto:** El espacio ahora lo ocupan las filas de KPIs operativos (métricas reales de prospectos).

**Estado:** ACTIVA

---

## 2026-06 — Project Brain como fuente de contexto para agentes

**Decisión:** Se crea `/docs/project-brain/` como directorio de memoria persistente del proyecto. Es parte del repositorio y se versiona con Git.

**Motivo:** El contexto del proyecto se perdía entre sesiones de Claude, provocando propuestas repetidas, dashboards duplicados y re-discusión de decisiones ya tomadas.

**Impacto:** Antes de implementar cualquier cosa, Claude debe leer `CLAUDE_PROJECT_CONTEXT.md` y los documentos de Project Brain relevantes.

**Estado:** ACTIVA
