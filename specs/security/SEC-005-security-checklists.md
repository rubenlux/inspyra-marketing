# SEC-005 — Security Checklists

**Estado:** Draft v1

---

## Objetivo

Centralizar checklists operativas de seguridad para desarrollo, revision, deploy y respuesta a incidentes.

Esta spec convierte `SEC-001` y `SEC-002` en listas practicas de ejecucion.

---

## Checklist Pre-PR

- No hay secretos en codigo, logs, fixtures o bundle.
- Inputs nuevos tienen validacion y normalizacion.
- Acciones nuevas validan auth, permisos y ownership.
- Endpoints nuevos tienen rate limit y payload limit.
- Logs nuevos no exponen datos sensibles.
- Uploads nuevos validan MIME, extension, tamano y path traversal.
- Cambios de frontend evitan HTML crudo y links externos inseguros.

---

## Checklist Pre-Deploy

- Build productivo OK.
- Tests de seguridad criticos OK.
- Secret scanning OK.
- Dependency scan sin vulnerabilidades criticas abiertas.
- Headers HTTP configurados.
- CORS restringido.
- `.env` de produccion revisado.
- `NODE_ENV=production`.
- DB y Redis no expuestos publicamente.
- Backup previo realizado.
- Rollback preparado.
- Healthcheck OK.

---

## Checklist Post-Incident

- Incidente clasificado.
- Evidencia preservada.
- Causa raiz documentada.
- Fix aplicado.
- Test de regresion agregado.
- Credenciales rotadas si aplica.
- Comunicacion externa decidida.
- Postmortem creado.

---

## Regla

Las checklists no reemplazan `SEC-001` ni `SEC-002`; las hacen ejecutables.
