# CODEX.md

## Contexto Operativo

Codex debe tratar el Spec Registry como fuente obligatoria del proyecto:

- `specs/README.md`

Las specs funcionales oficiales del ERP viven en:

- `spec-driven/`

Ese directorio esta en la raiz del proyecto y contiene la constitucion del sistema y las specs `ERP-001` a `ERP-023`.

## Referencias Obligatorias

- `spec-driven/`
- `specs/security/SEC-001-security-baseline.md`
- `specs/security/SEC-002-security-testing.md`
- `specs/standards/frontend-standards.mdc`
- `specs/standards/backend-standards.mdc`
- `specs/standards/testing-standards.mdc`
- `specs/standards/infra-standards.mdc`

SEC-001 define como protegemos. SEC-002 define como lo validamos. Deben revisarse siempre juntas.

## Criterio De Trabajo

Al modificar codigo, configuracion, infraestructura o documentacion tecnica:

- aplicar security by design;
- validar impacto en auth, permisos, datos, logs, secretos y exposicion publica;
- leer specs relacionadas al dominio afectado;
- leer la spec ERP correspondiente en `spec-driven/` antes de modificar un modulo funcional;
- respetar arquitectura, naming conventions y estructura de carpetas;
- no romper APIs existentes, tenant isolation ni RBAC;
- generar tests junto con implementacion cuando corresponda;
- actualizar documentacion si cambia comportamiento;
- preferir cambios pequenos, auditables y testeables;
- no conectar backend, DB o servicios externos sin controles de seguridad definidos;
- advertir si un pedido contradice SEC-001 o SEC-002.

## Prioridad

1. Security specs
2. Backend / architecture specs
3. ERP module specs
4. Local implementation details

Security siempre tiene prioridad.
