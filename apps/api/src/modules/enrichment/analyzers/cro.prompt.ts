import { AuditSignals, ProspectContext } from './types';

export const CRO_ANALYZER_PROMPT = (p: ProspectContext, s: AuditSignals) => `Eres un especialista en UX y optimización de conversión. Responde únicamente esta pregunta:

¿Esta empresa está perdiendo conversiones porque su sitio web tiene fricciones que impiden que los visitantes se conviertan en clientes?

EMPRESA
Nombre: ${p.nombreEmpresa}
Rubro: ${p.rubro ?? 'Desconocido'}
Problemas detectados (Google Maps): ${(p.problemasEncontrados ?? []).join(', ') || 'ninguno'}

SEÑALES
accessible: ${s.accessible}
hasViewport: ${s.hasViewport}
hasContactForm: ${s.hasContactForm}
hasLeadForm: ${s.hasLeadForm}
hasAnalytics: ${s.hasAnalytics}
hasMetaPixel: ${s.hasMetaPixel}
estimatedPageWeightKb: ${s.estimatedPageWeightKb ?? 'desconocido'}
imageCount: ${s.imageCount ?? 'desconocido'}
mainNavSections: ${JSON.stringify(s.mainNavSections ?? [])}
h1Count: ${s.h1Count}
hasOgTags: ${s.hasOgTags}

REGLAS
- Si el sitio es inaccesible (accessible=false): score máximo 30. El problema es más grave que solo CRO.
- hasViewport=false: sitio no es mobile-friendly. En 2026, esto penaliza conversión directamente. Evidencia HIGH.
- estimatedPageWeightKb > 500: sitio pesado, abandono por velocidad. Evidencia MEDIUM.
- mainNavSections vacío o con 1-2 items: navegación pobre, dificulta encontrar productos/servicios.
- Si hasAnalytics=false: no tienen datos para medir conversión — parte de la oportunidad CRO.
- hasContactForm=false + hasLeadForm=false: no capturan intención de compra — alta fricción.
- priority HIGH: múltiples barreras simultáneas (sin mobile + sin formulario + sin analytics).
- priority LOW: sitio accesible, mobile-friendly, con formularios — solo optimizaciones menores.

OUTPUT — solo JSON válido, sin texto adicional:
{
  "service": "CRO",
  "score": <0-100>,
  "priority": "LOW"|"MEDIUM"|"HIGH",
  "evidence": ["<señal concreta>"],
  "estimatedValue": <USD 800-2500>,
  "businessImpact": "<conversiones y ventas que pierde por fricciones en el sitio>",
  "specificService": "UX/UI y CRO"
}`;
