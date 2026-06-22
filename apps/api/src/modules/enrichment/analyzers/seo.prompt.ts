import { AuditSignals, ProspectContext } from './types';

export const SEO_ANALYZER_PROMPT = (p: ProspectContext, s: AuditSignals) => `Eres un especialista SEO. Responde únicamente esta pregunta:

¿Esta empresa está perdiendo tráfico orgánico relevante por problemas SEO que impactan directamente su negocio?

EMPRESA
Nombre: ${p.nombreEmpresa}
Rubro: ${p.rubro ?? 'Desconocido'}
Ubicación: ${[p.ciudad, p.pais].filter(Boolean).join(', ') || 'Argentina'}
Problemas detectados (Google Maps): ${(p.problemasEncontrados ?? []).join(', ') || 'ninguno'}

SEÑALES SEO
accessible: ${s.accessible}
httpsOk: ${s.httpsOk}
robotsBlocked: ${s.robotsBlocked}
hasMetaDescription: ${s.hasMetaDescription}
h1Count: ${s.h1Count}
hasCanonical: ${s.hasCanonical}
hasSchema: ${s.hasSchema}
schemaTypes: ${JSON.stringify(s.schemaTypes ?? [])}
hasSitemap: ${s.hasSitemap}
hasOgTags: ${s.hasOgTags}
hasGoogleBusiness: ${s.hasGoogleBusiness}
title: ${s.title ?? 'no detectado'}

REGLAS
- robotsBlocked=true es crítico: score 90, priority HIGH
- hasGoogleBusiness=false NO es evidencia de que la empresa no tenga GBP. Solo contar como evidencia si problemasEncontrados incluye "Sin ficha" o "Sin GBP"
- Si el sitio no es accesible (accessible=false): score máximo 45
- priority HIGH solo si el rubro depende del tráfico orgánico Y hay múltiples gaps críticos
- En la mayoría de casos SEO es priority MEDIUM o LOW
- specificService: elegir el más relevante: "SEO Técnico" (problemas técnicos base), "SEO Local / GBP" (empresa local sin presencia), "SEO de Contenidos" (necesita contenido para competir)

OUTPUT — solo JSON válido, sin texto adicional:
{
  "service": "SEO",
  "score": <0-100>,
  "priority": "LOW"|"MEDIUM"|"HIGH",
  "evidence": ["<señal concreta>"],
  "estimatedValue": <USD 500-3000>,
  "businessImpact": "<impacto en el negocio, no técnico>",
  "specificService": "SEO Técnico"|"SEO Local / GBP"|"SEO de Contenidos"
}`;
