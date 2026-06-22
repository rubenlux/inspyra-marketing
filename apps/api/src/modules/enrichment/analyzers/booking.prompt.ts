import { AuditSignals, ProspectContext } from './types';

export const BOOKING_ANALYZER_PROMPT = (p: ProspectContext, s: AuditSignals) => `Eres un especialista en captación de reservas online. Responde únicamente esta pregunta:

¿Esta empresa está perdiendo reservas o turnos por no tener un sistema digital de reservas?

EMPRESA
Nombre: ${p.nombreEmpresa}
Rubro: ${p.rubro ?? 'Desconocido'}
Ubicación: ${[p.ciudad, p.pais].filter(Boolean).join(', ') || 'Argentina'}
Problemas detectados (Google Maps): ${(p.problemasEncontrados ?? []).join(', ') || 'ninguno'}

SEÑALES
accessible: ${s.accessible}
hasOnlineBooking: ${s.hasOnlineBooking}
hasContactForm: ${s.hasContactForm}
hasLeadForm: ${s.hasLeadForm}
hasPhone: ${s.hasPhone}
mainNavSections: ${JSON.stringify(s.mainNavSections ?? [])}

RUBROS QUE NECESITAN RESERVAS
Alta prioridad: bodega/winery, restaurante, hotel, hospedaje, spa, clínica, médico, psicólogo, dentista, barbería, turismo, tour operadora, sala de eventos.
Media prioridad: consultor, arquitecto, abogado, contador, estudio profesional.
Baja prioridad: comercio minorista puro, fábrica, distribuidora.

REGLAS CRÍTICAS
- Si hasOnlineBooking=true: ya tienen sistema de reservas. Score máximo 20.
- Si el rubro NO recibe clientes con cita o reserva: score máximo 25.
- Si el sitio es inaccesible (accessible=false): score máximo 30.
- Solo hasContactForm=true (formulario de contacto genérico) NO equivale a sistema de reservas. Las reservas requieren disponibilidad, calendario o confirmación automática.

OUTPUT — solo JSON válido, sin texto adicional:
{
  "service": "BOOKING",
  "score": <0-100>,
  "priority": "LOW"|"MEDIUM"|"HIGH",
  "evidence": ["<señal concreta>"],
  "estimatedValue": <USD 1200-3500>,
  "businessImpact": "<reservas que pierde por depender del teléfono o WhatsApp>",
  "specificService": "Sistema de Reservas Online"
}`;
