#!/usr/bin/env python3
import sys
sys.stdout.reconfigure(encoding='utf-8')

print("""
=== PROJECT BRAIN — CHECKLIST ACTIVO ===

Antes de implementar, verificar:
  1. UI: Ya existe en ERPPrototype.tsx? -> No duplicar
  2. UI: Necesita pagina nueva? -> NO (usar tabs del drawer)
  3. DB: Tiene tenantId en toda query? -> Obligatorio
  4. Estados: Respeta VALID_TRANSITIONS? -> No saltar estados
  5. Agentes: Genera DRAFT? -> Human approval siempre

Contexto completo: CLAUDE_PROJECT_CONTEXT.md
Decisiones historicas: docs/project-brain/08-known-decisions.md

=========================================
""")
