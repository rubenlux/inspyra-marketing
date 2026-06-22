import { AuditSignals, ProspectContext } from './types';

export const CRM_ANALYZER_PROMPT = (p: ProspectContext, s: AuditSignals) => `Eres un especialista en CRM y automatización de marketing. Responde únicamente esta pregunta:

¿Esta empresa está perdiendo oportunidades de venta por no capturar, rastrear o nutrir a sus leads y clientes?

EMPRESA
Nombre: ${p.nombreEmpresa}
Rubro: ${p.rubro ?? 'Desconocido'}
Ubicación: ${[p.ciudad, p.pais].filter(Boolean).join(', ') || 'Argentina'}
Problemas detectados (Google Maps): ${(p.problemasEncontrados ?? []).join(', ') || 'ninguno'}

SEÑALES
accessible: ${s.accessible}
hasLeadForm: ${s.hasLeadForm}
hasContactForm: ${s.hasContactForm}
hasAnalytics: ${s.hasAnalytics}
hasGTM: ${s.hasGTM ?? false}
hasGA4: ${s.hasGA4 ?? false}
hasMetaPixel: ${s.hasMetaPixel}
hasHubSpot: ${s.hasHubSpot ?? false}
hasMautic: ${s.hasMautic ?? false}
hasHotjar: ${s.hasHotjar ?? false}
hasEcommerce: ${s.hasEcommerce}
hasOnlineBooking: ${s.hasOnlineBooking}

CONTEXTO DE EVALUACIÓN
Un negocio necesita CRM/Automatización cuando:
- Recibe leads o consultas pero no tiene sistema para darles seguimiento
- Tiene ecommerce o reservas pero no automatiza post-compra/post-visita
- No puede segmentar ni contactar a su base de clientes

REGLAS
- Si hasHubSpot=true o hasMautic=true: ya tienen CRM. Score máximo 25.
- Si hasLeadForm=true + hasAnalytics=true + hasMetaPixel=true: tienen infraestructura básica. Score máximo 50 (evalúa si hay seguimiento real o solo tracking).
- Si hasEcommerce=true y hasMetaPixel=false: pierden retargeting de carritos abandonados — esto es HIGH.
- Si hasOnlineBooking=true y no hay pixel/analytics: no están midiendo ni retargeteando — esto es MEDIUM.
- Si el sitio es inaccesible: score máximo 30.

OUTPUT — solo JSON válido, sin texto adicional:
{
  "service": "CRM",
  "score": <0-100>,
  "priority": "LOW"|"MEDIUM"|"HIGH",
  "evidence": ["<señal concreta>"],
  "estimatedValue": <USD 1000-3000>,
  "businessImpact": "<oportunidades de venta que se pierden sin seguimiento>",
  "specificService": "Automatización / CRM"
}`;
