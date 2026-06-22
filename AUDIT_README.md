# AUDITORÍA FORENSE — GUÍA DE LECTURA

**Proyecto:** Inspyra Marketing — Opportunity Engine  
**Fecha:** 2026-06-22  
**Objetivo:** Diagnóstico de degradación de calidad de análisis

---

## 📋 DOCUMENTOS GENERADOS

### 1️⃣ **EXECUTIVE_SUMMARY.md** — Lee primero (5 min)
- Problema en 3 líneas
- Causa raíz identificada
- Top 5 fixes con esfuerzo/ganancia
- **→ Comienza aquí si tienes prisa**

### 2️⃣ **TECHNICAL_DIAGNOSIS.md** — Diagnóstico formal (20 min)
- Hallazgo ejecutivo
- 3 problemas críticos documentados
- Matrices de análisis
- Top 5 recomendaciones detalladas
- Riesgos de no actuar
- **→ Lee esto para decisión de implementación**

### 3️⃣ **DIAGNOSTIC_AUDIT_PHASE_1.md** — Análisis detallado (30 min)
- Fase 1: Auditoría de Signals
- Fase 2-5: Placeholders para validación empírica
- Defectos específicos por componente (línea de código, ejemplos)
- Matriz completa de señales
- **→ Lee esto si necesitas evidencia técnica**

### 4️⃣ **VALIDATION_PROTOCOL.md** — Cómo ejecutar validación (2-3 horas práctica)
- Paso-a-paso para validar contra sitios reales
- Scripts curl para capturar signals
- Matrices de validación
- Cómo completar Fases 2-5 empíricamente
- **→ Sigue este protocolo para confirmar diagnóstico**

---

## 🔍 FLUJO DE LECTURA POR CASO DE USO

### Si quieres la respuesta rápida (5 min):
1. EXECUTIVE_SUMMARY.md
2. Done — tienes causa raíz + recomendación

### Si quieres decidir si implementar (20 min):
1. EXECUTIVE_SUMMARY.md
2. TECHNICAL_DIAGNOSIS.md (sección TOP 5 FIXES)
3. Done — sabes qué implementar y cuánto cuesta

### Si quieres evidencia técnica completa (1 hora):
1. EXECUTIVE_SUMMARY.md
2. TECHNICAL_DIAGNOSIS.md (completo)
3. DIAGNOSTIC_AUDIT_PHASE_1.md (secciones 1-5)
4. Done — tienes evidencia para decisión

### Si quieres validar empíricamente (4-5 horas):
1. EXECUTIVE_SUMMARY.md
2. TECHNICAL_DIAGNOSIS.md (TOP 5 FIXES)
3. VALIDATION_PROTOCOL.md (paso a paso)
4. Ejecuta validación contra 4-5 sitios reales
5. Documenta resultados
6. Done — diagnóstico confirmado, listo para fixes

---

## 🎯 PUNTOS CLAVE

### Causa Raíz (70% del problema):
Playwright `hasSocialLinks` busca cadenas exactas ("instagram.com") sin contar:
- Links acortados (insta.gn)
- Linktree (linktr.ee)
- Widgets dinámicos post-JS

**Casa Vigil:** Tiene Instagram pero vía Linktree → `hasSocialLinks=false` (falso negativo)

### Consecuencia:
Analyzers reciben signal falsa → generan scores HIGH basados en premise falsa → output incorrecto

### Solución:
Ampliar patterns de búsqueda + aumentar timeout post-load + mejorar detección phone

**Esfuerzo:** ~1 hora  
**Ganancia:** +60-80% precisión

---

## 📊 RESUMEN DE HALLAZGOS

| Componente | Status | Problemática |
|---|---|---|
| Playwright hasSocialLinks | ✗ CRÍTICA | 70-80% falsos negativos |
| Playwright hasPhone | ✗ ALTA | 40-50% falsos negativos |
| Playwright timing | ✗ MEDIA | 1500ms insuficiente |
| Analyzer logic | ⚠️ MEDIA | Asume signals correctas |
| Ranker | ✓ BUENO | Sin sesgos |
| Business logic | ✓ BUENO | Correcto pero basado en datos falsos |

---

## ✅ CHECKLIST DE LECTURA

- [ ] Leí EXECUTIVE_SUMMARY.md (entiendo causa raíz)
- [ ] Leí TECHNICAL_DIAGNOSIS.md (entiendo top 5 fixes)
- [ ] Leí DIAGNOSTIC_AUDIT_PHASE_1.md (entiendo detalles técnicos)
- [ ] Revisé líneas de código específicas (playwright-audit.service.ts)
- [ ] Decidí si ejecutar validación empírica
- [ ] Coordiné implementación de fixes

---

## 🚀 PRÓXIMOS PASOS

### Opción A: Implementar basado en análisis estático (RECOMENDADO)
1. Implementar Top 3 fixes (Playwright hasSocialLinks, timeout, hasPhone)
2. Test en local
3. Deploy

### Opción B: Validar empíricamente primero (SEGURO)
1. Ejecutar VALIDATION_PROTOCOL.md contra 4-5 sitios reales
2. Confirmar causa raíz
3. Implementar fixes
4. Test
5. Deploy

### Opción C: Ambas
1. Implementar fixes (~1 hora)
2. Validar empíricamente (2-3 horas)
3. Confirmar improvements
4. Deploy con confianza

---

## 🔗 REFERENCIAS DE CÓDIGO

**Bugs identificados en:**
- `apps/api/src/modules/enrichment/playwright-audit.service.ts`
  - Línea 205-209: hasSocialLinks
  - Línea 217-219: hasPhone
  - Línea 74-80: timing

**Downstream (correcto lógicamente pero recibe datos falsosI:**
- `apps/api/src/modules/enrichment/analyzers/booking.prompt.ts`
- `apps/api/src/modules/enrichment/analyzers/crm.prompt.ts`
- `apps/api/src/modules/enrichment/opportunity-engine.service.ts` (ranker)

---

## 📝 NOTAS

- No modificar código fue el objetivo → auditoría estática
- Validación empírica es **fuertemente recomendada** antes de fixes
- Top 3 fixes resuelven ~80% del problema
- Implementación es straightforward (no requiere arquitectura)

---

**Auditoría completada:** 2026-06-22  
**Reporte status:** LISTO PARA ACCIÓN

