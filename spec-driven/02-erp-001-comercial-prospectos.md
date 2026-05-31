# ERP-001 — Comercial / Prospectos

**Spec ID:** 02  
**Código:** ERP-001  
**Módulo:** Comercial → Prospectos  
**Estado:** 🟡 DRAFT v1  
**Fecha:** 2026-05-31  
**Autor:** Inspyra Team  

---

## Objetivo del módulo

El módulo Prospectos es el sistema de descubrimiento, investigación, clasificación y preparación comercial de potenciales clientes para Inspyra.

Es la puerta de entrada del área comercial.

Su objetivo es encontrar empresas con oportunidad real de convertirse en clientes.

---

## Qué resuelve

| Antes | Con Prospectos |
|---|---|
| Búsqueda manual desordenada | Descubrimiento centralizado |
| Leads dispersos | Scoring automático |
| Información duplicada | Clasificación por oportunidad |
| Oportunidades olvidadas | Asignación comercial |
| Dificultad para priorizar | Preparación de outreach |
| Poca trazabilidad comercial | Derivación automática a Seguimiento / Pipeline |

---

## Tipo de prospectos

### Prospectos Outbound

Los buscamos nosotros. Ejemplos de targets:

- Inmobiliarias
- Clínicas
- Estudios jurídicos
- E-commerce
- Pymes
- Empresas con web antigua
- Negocios sin SEO
- Empresas sin campañas activas
- Marcas con baja presencia digital

### Prospectos enriquecidos por IA

Detectados mediante:

- Scraping
- Google Maps
- Websites
- Instagram
- LinkedIn
- Directorios
- Datasets importados
- CSV
- Fuentes externas conectadas

---

## Qué NO vive aquí

Los siguientes registros **no pertenecen a Prospectos**:

| ❌ No aquí | ✅ Dónde va |
|---|---|
| Clientes cerrados | Módulo Clientes |
| Leads convertidos | Módulo Pipeline |
| Cuentas activas | Módulo Clientes |
| Proyectos vendidos | Módulo Proyectos |

---

## Flujo del módulo

```
Descubre → Enriquece → Detecta oportunidad → Score → Clasifica → Asigna → Prepara outreach
```

### Paso 1 — Descubre

IA busca empresas según prompt comercial.

```
Ejemplo: "inmobiliarias en Buenos Aires con web desactualizada y sin SEO local"
```

### Paso 2 — Enriquece

Completa datos automáticamente:

- Sitio web
- Instagram
- Teléfono
- Email
- Rubro / Ubicación
- Tamaño estimado
- Presencia digital
- Tecnología detectada
- SEO básico

### Paso 3 — Detecta oportunidad

La IA identifica oportunidades comerciales:

- Sin SSL / Web lenta / Web vieja
- Sin landing pages
- Sin SEO local
- Sin Meta Ads / Google Ads
- Instagram abandonado
- Branding inconsistente
- Ecommerce incompleto

### Paso 4 — Score

Score automático **0–100** según potencial comercial.

### Paso 5 — Clasifica servicio sugerido

El sistema recomienda oferta comercial:

| Servicio sugerido | Cuándo |
|---|---|
| Web + SEO | Sin web o web desactualizada |
| Plataforma + Hosting | Necesita infraestructura |
| Ads + Landing | Sin campañas pagas |
| Branding + Redes | Sin presencia social |
| Software + AWS | Necesita desarrollo custom |
| HostingGuard Deploy | Proyecto de hosting |
| Email Marketing | Sin automatización de email |

### Paso 6 — Asignación

Asignación automática o manual al equipo comercial.

### Paso 7 — Preparación outreach

Prospecto queda listo para primer contacto.

---

## Modelo de datos

### Identificación

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Identificador único |
| `nombre_empresa` | string | Nombre de la empresa |
| `nombre_contacto` | string | Nombre del contacto principal |
| `cargo` | string | Cargo del contacto |
| `telefono` | string | Teléfono |
| `email` | string | Email |

### Ubicación

| Campo | Tipo | Descripción |
|---|---|---|
| `pais` | string | País |
| `ciudad` | string | Ciudad |
| `direccion` | string | Dirección (opcional) |

### Negocio

| Campo | Tipo | Descripción |
|---|---|---|
| `rubro` | string | Sector / Industria |
| `tamano_empresa` | enum | micro / pequeña / mediana / grande |
| `empleados_estimado` | int | Cantidad estimada de empleados |

### Digital Footprint

| Campo | Tipo | Descripción |
|---|---|---|
| `website` | string | URL sitio web |
| `instagram` | string | Handle Instagram |
| `linkedin` | string | URL LinkedIn |
| `facebook` | string | URL Facebook |
| `google_business` | string | URL Google Business Profile |

### Opportunity Detection

| Campo | Tipo | Descripción |
|---|---|---|
| `oportunidad_detectada` | string | Descripción principal de oportunidad |
| `problemas_encontrados` | string[] | Lista de problemas detectados |
| `nivel_oportunidad` | enum | baja / media / alta / crítica |

### Comercial

| Campo | Tipo | Descripción |
|---|---|---|
| `servicio_sugerido` | string | Oferta recomendada por IA |
| `score` | int (0–100) | Score de prioridad comercial |
| `prioridad` | enum | baja / media / alta |
| `owner_id` | uuid (FK User) | Comercial asignado |

### Seguimiento

| Campo | Tipo | Descripción |
|---|---|---|
| `ultimo_contacto` | timestamp | Fecha último contacto |
| `proximo_seguimiento` | timestamp | Fecha próximo seguimiento |
| `estado` | enum | Ver estados posibles |

### Metadata

| Campo | Tipo | Descripción |
|---|---|---|
| `fuente` | enum | Origen del prospecto |
| `created_at` | timestamp | Fecha de creación |
| `updated_at` | timestamp | Última actualización |
| `creado_por` | uuid (FK User) | Usuario que lo creó |
| `detectado_por` | enum | ia / manual |

---

## Estados posibles

```
Nuevo → Investigado → Enriquecido → Listo para outreach
   → Contactado → Respondió → Reunión agendada
   → Pasó a pipeline → Convertido a cliente
   → Descartado | Archivado
```

| Estado | Descripción |
|---|---|
| `nuevo` | Recién ingresado, sin procesar |
| `investigado` | Datos básicos verificados |
| `enriquecido` | Datos completados por IA |
| `listo_outreach` | Preparado para primer contacto |
| `contactado` | Se realizó primer contacto |
| `respondio` | El prospecto respondió |
| `reunion_agendada` | Reunión en calendario |
| `paso_a_pipeline` | Derivado al embudo de ventas |
| `convertido` | Se cerró como cliente |
| `descartado` | No tiene oportunidad real |
| `archivado` | Pausado, puede retomarse |

---

## Fuentes posibles

| Fuente | Descripción |
|---|---|
| `google_maps` | Búsqueda IA en Google Maps |
| `instagram` | Búsqueda por hashtags / perfil |
| `linkedin` | Sales Navigator / búsqueda |
| `meta_ads_lead` | Lead capturado desde Meta Ads |
| `google_ads_lead` | Lead capturado desde Google Ads |
| `formulario_web` | Formulario del sitio Inspyra |
| `whatsapp` | Contacto directo por WhatsApp |
| `csv_import` | Importación masiva CSV |
| `referral` | Referencia de cliente existente |
| `manual` | Cargado manualmente por el equipo |

---

## Filtros disponibles

El usuario puede filtrar la tabla por:

- Rubro
- País / Ciudad
- Tamaño empresa
- Score (rango)
- Estado
- Owner asignado
- Fuente origen
- Servicio sugerido
- Fecha creación (rango)
- Oportunidad detectada
- Nivel oportunidad
- Detectado por (IA / manual)

---

## KPIs del módulo

Dashboard superior con las siguientes métricas:

| KPI | Descripción |
|---|---|
| Total prospectos | Todos los registros activos |
| Nuevos esta semana | Creados en los últimos 7 días |
| Sin web | Sin sitio web detectado |
| Sin SEO | Sin SEO técnico básico |
| Score promedio | Media de score de todos |
| Oportunidad alta | Score ≥ 80 |
| Listos para outreach | En estado `listo_outreach` |
| Convertidos a pipeline | Estado `paso_a_pipeline` o `convertido` |

---

## Agentes IA del módulo

| Agente | Función |
|---|---|
| **Prospect Discovery Agent** | Busca empresas según prompt comercial libre |
| **Enrichment Agent** | Completa datos faltantes (web, IG, contacto, etc.) |
| **Opportunity Detection Agent** | Detecta necesidades comerciales digitales |
| **Scoring Agent** | Calcula prioridad 0–100 |
| **Outreach Prep Agent** | Genera primer contacto sugerido personalizado |
| **Assignment Agent** | Asigna comercial responsable automáticamente |

Cada agente debe registrar métricas de coste según `01-constitution-v1.md §7`.

---

## Relaciones con otros módulos

| Módulo | Relación |
|---|---|
| **Campañas** | Un prospecto puede pertenecer a una campaña outbound |
| **Seguimiento** | Al contactar → pasa a Seguimiento (estado `contactado`) |
| **Pipeline** | Si responde → se crea Deal en Pipeline |
| **Reuniones** | Si agenda → aparece en Reuniones con link al prospecto |
| **Clientes** | Si cierra → se convierte en Cliente (estado `convertido`) |

---

## Regla de negocio clave

> **Un prospecto nunca se pierde.**

Todo prospecto debe terminar en uno de estos tres estados finales:

| Estado final | Cuándo |
|---|---|
| `convertido` | Se cerró como cliente |
| `descartado` | No hay oportunidad real (documentar motivo) |
| `archivado` | Válido pero no ahora (tiene fecha de revisión) |

**Nunca puede quedar olvidado en estado indefinido.**

---

## Criterios de aceptación (DoD)

Para que esta spec se considere implementada, el módulo debe cumplir:

- [ ] Tabla de prospectos paginada con todos los campos definidos
- [ ] Filtros funcionales (mínimo: rubro, score, estado, owner)
- [ ] KPIs del dashboard actualizados en tiempo real
- [ ] CRUD completo (crear, ver, editar, archivar, descartar)
- [ ] Estados con transiciones válidas (no puede pasar de `nuevo` a `convertido` sin pasar por `contactado`)
- [ ] Score calculado automáticamente al enriquecer
- [ ] Fuente registrada en cada prospecto
- [ ] Asignación de owner (manual o automática)
- [ ] Audit trail: quién creó, quién editó, cuándo
- [ ] Exportar a CSV
- [ ] Relación funcional con Seguimiento y Pipeline
- [ ] Agentes IA con registro de coste por ejecución

---

## Próximos pasos

1. Aprobar esta spec con el equipo
2. Crear `03-erp-002-comercial-seguimiento.md`
3. Definir schema Prisma para entidad `Prospect`
4. Diseñar endpoints REST (`/api/prospects`)
5. Implementar en el frontend (React + TypeScript)
