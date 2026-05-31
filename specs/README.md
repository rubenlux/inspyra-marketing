# Spec Registry — Source of Truth

Los siguientes documentos son la referencia oficial del sistema y deben considerarse obligatorios antes de implementar cualquier feature.

## ERP Functional Specs

```bash
spec-driven/
```

ERP-001 → ERP-023

Las specs funcionales del ERP viven en `spec-driven/` en la raiz del proyecto.

---

## Security Specs

```bash
specs/security/
```

- `SEC-001-security-baseline.md` — Security Baseline.
- `SEC-002-security-testing.md` — Security Testing & Verification.
- `SEC-003-incident-response.md` — Incident Response.
- `SEC-004-backup-disaster-recovery.md` — Backup & Disaster Recovery.
- `SEC-005-security-checklists.md` — Security Checklists.

SEC-001 define como protegemos. SEC-002 define como lo validamos. Las dos deben viajar juntas siempre.

---

## Development Standards

```bash
specs/standards/
```

- `frontend-standards.mdc`
- `backend-standards.mdc`
- `testing-standards.mdc`
- `infra-standards.mdc`

---

## Mandatory Agent Rules

Antes de generar codigo:

- leer specs relacionadas al dominio afectado;
- validar restricciones de seguridad;
- respetar arquitectura definida;
- respetar naming conventions;
- respetar estructura de carpetas;
- no romper APIs existentes;
- no romper tenant isolation;
- no romper RBAC;
- generar tests junto con implementacion;
- actualizar documentacion si cambia comportamiento.

---

## Priority Order

En caso de conflicto:

1. Security specs
2. Backend / architecture specs
3. ERP module specs
4. Local implementation details

Security siempre tiene prioridad.
