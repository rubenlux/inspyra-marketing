import { AuditSignals, ProspectContext } from './types';

export const WEB_ANALYZER_PROMPT = (p: ProspectContext, s: AuditSignals) => `Eres un especialista en desarrollo web. Responde únicamente esta pregunta:

¿Esta empresa necesita un sitio web nuevo o un rediseño profundo de su sitio actual?

EMPRESA
Nombre: ${p.nombreEmpresa}
Rubro: ${p.rubro ?? 'Desconocido'}
Website declarado: ${p.website ?? 'Sin sitio web'}
Problemas detectados (Google Maps): ${(p.problemasEncontrados ?? []).join(', ') || 'ninguno'}

SEÑALES
accessible: ${s.accessible}
noWebsite: ${s.noWebsite ?? false}
fetchError: ${s.fetchError ?? 'ninguno'}
httpsOk: ${s.httpsOk}
hasViewport: ${s.hasViewport}
technology: ${JSON.stringify(s.technology ?? [])}
hasWordPress: ${s.hasWordPress}
hasShopify: ${s.hasShopify}
estimatedPageWeightKb: ${s.estimatedPageWeightKb ?? 'desconocido'}
mainNavSections: ${JSON.stringify(s.mainNavSections ?? [])}

CRITERIOS
Desarrollo Web nuevo (score 80-100):
- noWebsite=true: la empresa no tiene presencia digital en absoluto
- accessible=false con fetchError grave (timeout, 404, ENOTFOUND): el sitio no existe o está caído

Rediseño Web (score 50-75):
- Sitio accesible pero sin viewport (no mobile)
- Tecnología obsoleta o sitio con estructura mínima (menos de 3 secciones en nav)
- Sitio existe pero los otros analyzers detectan múltiples problemas de conversión y UX

Optimización menor (score 20-45):
- Sitio funcional, moderno, mobile-friendly
- Solo necesita ajustes puntuales

NO recomendar desarrollo/rediseño cuando:
- El sitio carga bien, es mobile-friendly y tiene navegación clara
- Los problemas son de contenido o SEO, no de desarrollo

OUTPUT — solo JSON válido, sin texto adicional:
{
  "service": "WEB",
  "score": <0-100>,
  "priority": "LOW"|"MEDIUM"|"HIGH",
  "evidence": ["<señal concreta>"],
  "estimatedValue": <USD 1500-6000>,
  "businessImpact": "<clientes que pierde por no tener presencia web adecuada>",
  "specificService": "Desarrollo Web nuevo"|"Rediseño Web"
}`;
