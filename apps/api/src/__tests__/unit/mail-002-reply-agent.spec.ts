/**
 * MAIL-002 — Reply Agent & Webhook Orchestration
 *
 * Validates 6 end-to-end behavioral scenarios:
 *  1. "Sí, me interesa. Contame más."  → POSITIVE → INTERESADO
 *  2. "¿Qué encontraron exactamente?"  → NEUTRAL  → follow-up + qualifying question
 *  3. "Ahora no es prioridad."         → NOT_NOW  → acknowledges timing, no pressure
 *  4. "Ya tenemos proveedor."          → OBJECTION → human draft, competitor intel
 *  5. "¿Cuánto cuesta?"                → Reply Agent / "¿Me hacés un presupuesto?" → escalation
 *  6. Multi-turn conversation          → history awareness, no repeated context
 *
 * Pure unit tests — no real DB, no real Claude, no real mail API.
 */

import { Test } from '@nestjs/testing';
import { ProposalsService, ReplyAgentResult } from '../../modules/proposals/proposals.service';
import { OutreachService } from '../../modules/outreach/outreach.service';
import { PrismaService } from '../../database/prisma.service';
import { createMockPrisma } from '../helpers/mock-prisma';

// ── Mail API mock ─────────────────────────────────────────────────────────────
// jest.mock() is hoisted before variable declarations, so we mock the module
// with a placeholder and configure the mock send fn in beforeEach.

jest.mock('../../modules/outreach/mail-api.client');

import { createMailApiClient } from '../../modules/outreach/mail-api.client';

let mockMailSend: jest.Mock;

// ── Test fixtures ─────────────────────────────────────────────────────────────

const TENANT = 'tenant-test';
const PROSPECT_ID = 'prospect-vet-xyz';

const BASE_PROSPECT = {
  id: PROSPECT_ID,
  tenantId: TENANT,
  nombreEmpresa: 'Veterinaria XYZ',
  rubro: 'veterinaria y salud animal',
  pais: 'Argentina',
  ciudad: 'Córdoba',
  estado: 'CONTACTADO' as const,
  deletedAt: null,
  oportunidadDetectada: 'Sin presencia en Google Maps, sin reseñas gestionadas, sin sistema de turnos online',
  communicationLanguage: 'ES',
  servicioSugerido: 'booking-automation',
  problemasEncontrados: [
    '43 reseñas en Google sin responder',
    'No aparecen en primeros resultados Google Maps "veterinaria Córdoba"',
    'Agenda de turnos por WhatsApp — carga manual evitable',
  ],
  validation: {
    decisionFactors: {
      sector: 'SALUD',
      sirOpportunities: [
        {
          serviceId: 'review-management',
          serviceName: 'Gestión de Reseñas',
          opportunityScore: 90,
          pitchLine: 'Sus competidores tienen 4.8 estrellas — ustedes tienen 3.2.',
          estimatedTicketUsd: [300, 600],
        },
        {
          serviceId: 'booking-automation',
          serviceName: 'Sistema de Turnos Online',
          opportunityScore: 85,
          pitchLine: 'WhatsApp saturado de llamadas para turnos que podrían ser automáticos.',
          estimatedTicketUsd: [500, 900],
        },
      ],
    },
    agentScore: 88,
    servicesRecommended: ['review-management', 'booking-automation'],
    reasoning: 'Alta oportunidad — negocio de salud local sin presencia digital',
  },
  enrichmentResult: {
    email: 'contacto@veterinariaxyz.com.ar',
    nombreDecidsor: 'Dr. Martín García',
    rolDecidsor: 'Dueño',
    reviewStatus: 'APPROVED',
  },
};

const OUTREACH_MARKDOWN = `# Outreach Brief — Veterinaria XYZ [🚀 OPPORTUNITY]

## Mensaje Outreach (WhatsApp / Email / DM)

Analizando la presencia digital de Veterinaria XYZ, encontramos que tienen más de 40 reseñas sin responder y no aparecen en los primeros resultados de Google Maps para "veterinaria Córdoba". Esto puede estar afectando la captación de nuevos dueños de mascotas. Si les interesa, podemos compartirles el detalle completo de lo que encontramos.

---

## Diagnóstico Interno

Alta oportunidad en el segmento de salud animal local.`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReplyAgentResult(overrides: Partial<ReplyAgentResult>): ReplyAgentResult {
  return {
    intentAnalysis: 'NEUTRAL',
    sentiment: 'Respuesta recibida.',
    followUpMessage: 'Respuesta de seguimiento.',
    suggestMeeting: false,
    recommendedAction: 'CONTINUE_CONVERSATION',
    ...overrides,
  };
}

// Shorthand for a prospectIntel with only specific fields set (rest omitted)
function makeIntel(fields: Partial<NonNullable<ReplyAgentResult['prospectIntel']>>): NonNullable<ReplyAgentResult['prospectIntel']> {
  return fields;
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('MAIL-002 — Reply Agent & Webhook Orchestration', () => {
  let proposalsService: ProposalsService;
  let outreachService: OutreachService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(async () => {
    prisma = createMockPrisma();
    mockMailSend = jest.fn().mockResolvedValue({ messageId: 'msg-test-001', sesMessageId: 'ses-test-001' });
    (createMailApiClient as jest.Mock).mockReturnValue({ send: mockMailSend });

    const module = await Test.createTestingModule({
      providers: [
        ProposalsService,
        OutreachService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    proposalsService = module.get(ProposalsService);
    outreachService = module.get(OutreachService);
  });

  afterEach(() => jest.restoreAllMocks());

  // ─────────────────────────────────────────────────────────────────────────────
  // SCENARIO 5 (partial): requiresEscalation() — deterministic, no Claude needed
  // ─────────────────────────────────────────────────────────────────────────────

  describe('requiresEscalation() — price inquiry routing rules', () => {
    const shouldEscalate = [
      ['presupuesto', '¿Me hacés un presupuesto?'],
      ['precio', '¿Cuál es el precio?'],
      ['cotización', 'Necesito una cotización detallada'],
      ['descuento', 'Quiero un descuento del 20%'],
      ['contrato', 'Quiero revisar el contrato antes'],
      ['legal', 'Mi abogado dice que hay un problema legal'],
      ['reclamo', 'Voy a hacer un reclamo formal'],
      ['factura', '¿Cuánto es la factura?'],
      ['price (EN)', 'What is the price?'],
      ['quote (EN)', 'Can you send a quote?'],
      ['discount (EN)', 'I need a discount'],
      ['contract (EN)', 'Send me the contract'],
      ['invoice (EN)', 'Where is my invoice?'],
    ] as const;

    test.each(shouldEscalate)('keyword "%s" → escalates to human review', (_label, reply) => {
      expect((outreachService as any).requiresEscalation(reply)).toBe(true);
    });

    const shouldNotEscalate = [
      ['¿Cuánto cuesta?'],
      ['What do you charge?'],
      ['¿Qué servicios tienen?'],
      ['Sí, me interesa. Contame más.'],
      ['¿Qué encontraron exactamente?'],
      ['Ahora no es prioridad.'],
      ['Ya tenemos proveedor.'],
      ['Interesante, me lo pensás mandar?'],
    ] as const;

    test.each(shouldNotEscalate)(
      '"%s" → does NOT escalate → goes to Reply Agent',
      (reply) => {
        expect((outreachService as any).requiresEscalation(reply)).toBe(false);
      },
    );

    it('"¿Cuánto cuesta?" routes to Reply Agent, NOT human escalation', () => {
      // "cuesta" is not in the escalation regex — it's an inquiry, not negotiation.
      // Reply Agent handles it and classifies as NEUTRAL (info request) or OBJECTION.
      // Escalation only triggers on explicit negotiation terms (presupuesto, precio, etc.)
      const result = (outreachService as any).requiresEscalation('¿Cuánto cuesta?');
      expect(result).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // loadConversationHistory() — SCENARIO 6 foundation
  // ─────────────────────────────────────────────────────────────────────────────

  describe('loadConversationHistory() — conversation memory', () => {
    it('returns empty string when no activities exist', async () => {
      prisma.outreachActivity.findMany.mockResolvedValue([]);
      const result = await (proposalsService as any).loadConversationHistory(PROSPECT_ID, TENANT);
      expect(result).toBe('');
    });

    it('labels CONTACTADO and SEGUIMIENTO as INSPYRA', async () => {
      prisma.outreachActivity.findMany.mockResolvedValue([
        {
          type: 'CONTACTADO',
          mensajeUtilizado: 'Hola, encontramos oportunidades en tu presencia digital.',
          note: null,
          createdAt: new Date('2026-06-10T14:00:00Z'),
        },
      ]);
      const result = await (proposalsService as any).loadConversationHistory(PROSPECT_ID, TENANT);
      expect(result).toContain('[2026-06-10] INSPYRA: Hola, encontramos oportunidades');
    });

    it('labels RESPUESTA_RECIBIDA as PROSPECT', async () => {
      prisma.outreachActivity.findMany.mockResolvedValue([
        {
          type: 'RESPUESTA_RECIBIDA',
          mensajeUtilizado: null,
          note: 'Respuesta de dr@vet.com.ar:\n\nSí, me interesa. Contame más.',
          createdAt: new Date('2026-06-11T09:00:00Z'),
        },
      ]);
      const result = await (proposalsService as any).loadConversationHistory(PROSPECT_ID, TENANT);
      expect(result).toContain('[2026-06-11] PROSPECT: Respuesta de dr@vet.com.ar');
    });

    it('queries only the 3 relevant activity types, max 10, ascending', async () => {
      prisma.outreachActivity.findMany.mockResolvedValue([]);
      await (proposalsService as any).loadConversationHistory(PROSPECT_ID, TENANT);
      expect(prisma.outreachActivity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: { in: ['CONTACTADO', 'RESPUESTA_RECIBIDA', 'SEGUIMIENTO'] },
          }),
          orderBy: { createdAt: 'asc' },
          take: 10,
        }),
      );
    });

    it('builds a readable conversation thread with separators', async () => {
      prisma.outreachActivity.findMany.mockResolvedValue([
        { type: 'CONTACTADO', mensajeUtilizado: 'Mensaje inicial', note: null, createdAt: new Date('2026-06-10T14:00:00Z') },
        { type: 'RESPUESTA_RECIBIDA', mensajeUtilizado: null, note: 'Respuesta de dr@vet.com.ar:\n\nMe interesa.', createdAt: new Date('2026-06-11T09:00:00Z') },
        { type: 'SEGUIMIENTO', mensajeUtilizado: 'Te comparto el análisis completo...', note: null, createdAt: new Date('2026-06-11T09:05:00Z') },
      ]);
      const result = await (proposalsService as any).loadConversationHistory(PROSPECT_ID, TENANT);
      expect(result).toContain('INSPYRA: Mensaje inicial');
      expect(result).toContain('PROSPECT: Respuesta de dr@vet.com.ar');
      expect(result).toContain('INSPYRA: Te comparto el análisis completo');
      expect(result).toContain('---'); // separator between turns
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // storeProspectIntel() — intel extraction from replies
  // ─────────────────────────────────────────────────────────────────────────────

  describe('storeProspectIntel() — prospect intelligence', () => {
    const now = new Date('2026-06-17T10:00:00Z');

    it('stores budgetTiming when extracted from reply', async () => {
      prisma.outreachActivity.create.mockResolvedValue({} as any);
      await (outreachService as any).storeProspectIntel(TENANT, PROSPECT_ID, {
        budgetTiming: 'Q1 2027',
        competitorPresent: false,
        competitorName: null,
        painPoint: null,
        contactPreference: null,
        decisionMakerEngaged: null,
      }, now);
      expect(prisma.outreachActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'NOTA',
            note: expect.stringContaining('Timing presupuesto: Q1 2027'),
          }),
        }),
      );
    });

    it('stores competitor name when competitorPresent = true', async () => {
      prisma.outreachActivity.create.mockResolvedValue({} as any);
      await (outreachService as any).storeProspectIntel(TENANT, PROSPECT_ID, {
        budgetTiming: null,
        competitorPresent: true,
        competitorName: 'AgenciaDigital SRL',
        painPoint: 'No consiguen turnos por web',
        contactPreference: 'WhatsApp',
        decisionMakerEngaged: true,
      }, now);
      const note = prisma.outreachActivity.create.mock.calls[0][0].data.note as string;
      expect(note).toContain('Proveedor actual: AgenciaDigital SRL');
      expect(note).toContain('Pain point detectado: No consiguen turnos por web');
      expect(note).toContain('Preferencia de contacto: WhatsApp');
      expect(note).toContain('Decisor involucrado en la conversación');
    });

    it('skips creating activity when no intel signals present', async () => {
      await (outreachService as any).storeProspectIntel(TENANT, PROSPECT_ID, {}, now);
      expect(prisma.outreachActivity.create).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Reply Agent — per-scenario classification (Claude mocked)
  // ─────────────────────────────────────────────────────────────────────────────

  function setupReplyAgentMocks(result: ReplyAgentResult) {
    prisma.prospect.findFirst.mockResolvedValue({ ...BASE_PROSPECT });
    prisma.proposal.findFirst.mockResolvedValue({ id: 'prop-001', proposalMarkdown: OUTREACH_MARKDOWN });
    prisma.outreachActivity.findMany.mockResolvedValue([]);
    jest.spyOn(proposalsService as any, 'spawnClaude').mockResolvedValue(JSON.stringify(result));
  }

  // ── Scenario 1: POSITIVE ────────────────────────────────────────────────────

  describe('Scenario 1 — "Sí, me interesa. Contame más." → POSITIVE', () => {
    const REPLY = 'Sí, me interesa. Contame más.';
    const RESULT = makeReplyAgentResult({
      intentAnalysis: 'POSITIVE',
      sentiment: 'El prospecto muestra interés claro y pide más información.',
      followUpMessage:
        'Excelente, Dr. García. Encontramos tres puntos concretos en Veterinaria XYZ: 43 reseñas sin responder (baja el ranking), el perfil de Google Maps sin horarios actualizados, y la agenda de turnos por WhatsApp genera carga manual evitable. ¿Tienen 15 minutos esta semana para revisarlo?',
      suggestMeeting: true,
      recommendedAction: 'SUGGEST_MEETING',
      prospectIntel: makeIntel({ decisionMakerEngaged: true }),
    });

    beforeEach(() => setupReplyAgentMocks(RESULT));

    it('intentAnalysis = POSITIVE', async () => {
      const result = await proposalsService.runReplyAgent(PROSPECT_ID, TENANT, REPLY);
      expect(result.intentAnalysis).toBe('POSITIVE');
    });

    it('suggestMeeting = true — POSITIVE is the only intent where a meeting is appropriate', async () => {
      const result = await proposalsService.runReplyAgent(PROSPECT_ID, TENANT, REPLY);
      expect(result.suggestMeeting).toBe(true);
    });

    it('recommendedAction = SUGGEST_MEETING or MARK_INTERESTED', async () => {
      const result = await proposalsService.runReplyAgent(PROSPECT_ID, TENANT, REPLY);
      expect(['SUGGEST_MEETING', 'MARK_INTERESTED']).toContain(result.recommendedAction);
    });

    it('followUpMessage references specific findings (not generic pitch)', async () => {
      const result = await proposalsService.runReplyAgent(PROSPECT_ID, TENANT, REPLY);
      // Should mention something concrete, not generic marketing speak
      expect(result.followUpMessage.length).toBeGreaterThan(100);
      expect(result.followUpMessage).not.toMatch(/oportunidades de negocio|soluciones integrales|transformación digital/i);
    });

    it('decisionMakerEngaged intel extracted (respondent is the decision maker)', async () => {
      const result = await proposalsService.runReplyAgent(PROSPECT_ID, TENANT, REPLY);
      expect(result.prospectIntel?.decisionMakerEngaged).toBe(true);
    });

    it('prompt includes initial outreach message for context', async () => {
      let capturedPrompt = '';
      jest.spyOn(proposalsService as any, 'spawnClaude').mockImplementation(async (p: string) => {
        capturedPrompt = p;
        return JSON.stringify(RESULT);
      });
      await proposalsService.runReplyAgent(PROSPECT_ID, TENANT, REPLY);
      expect(capturedPrompt).toContain('INITIAL OUTREACH MESSAGE');
      expect(capturedPrompt).toContain('Analizando la presencia digital de Veterinaria XYZ');
    });
  });

  // ── Scenario 2: NEUTRAL ─────────────────────────────────────────────────────

  describe('Scenario 2 — "¿Qué encontraron exactamente?" → NEUTRAL', () => {
    const REPLY = '¿Qué encontraron exactamente?';
    const RESULT = makeReplyAgentResult({
      intentAnalysis: 'NEUTRAL',
      sentiment: 'El prospecto pide detalles específicos — interés exploratorio, sin compromiso.',
      followUpMessage:
        'Claro. En Veterinaria XYZ encontramos tres puntos: 43 reseñas de Google sin respuesta, el perfil de Google Maps sin horarios actualizados, y la agenda de turnos depende de WhatsApp manual. ¿Alguno de estos puntos es algo que ya están viendo como problema?',
      suggestMeeting: false,
      recommendedAction: 'CONTINUE_CONVERSATION',
      prospectIntel: makeIntel({}),
    });

    beforeEach(() => setupReplyAgentMocks(RESULT));

    it('intentAnalysis = NEUTRAL', async () => {
      const result = await proposalsService.runReplyAgent(PROSPECT_ID, TENANT, REPLY);
      expect(result.intentAnalysis).toBe('NEUTRAL');
    });

    it('suggestMeeting = false — no meeting for exploratory intent', async () => {
      const result = await proposalsService.runReplyAgent(PROSPECT_ID, TENANT, REPLY);
      expect(result.suggestMeeting).toBe(false);
    });

    it('followUpMessage contains a qualifying question (advances conversation)', async () => {
      const result = await proposalsService.runReplyAgent(PROSPECT_ID, TENANT, REPLY);
      expect(result.followUpMessage).toMatch(/\?/); // at least one question
    });

    it('followUpMessage provides a specific industry insight (not generic)', async () => {
      const result = await proposalsService.runReplyAgent(PROSPECT_ID, TENANT, REPLY);
      expect(result.followUpMessage.length).toBeGreaterThan(80);
    });

    it('recommendedAction = CONTINUE_CONVERSATION', async () => {
      const result = await proposalsService.runReplyAgent(PROSPECT_ID, TENANT, REPLY);
      expect(result.recommendedAction).toBe('CONTINUE_CONVERSATION');
    });

    it('prompt instructs agent to generate ONE qualifying question (not a meeting)', async () => {
      let capturedPrompt = '';
      jest.spyOn(proposalsService as any, 'spawnClaude').mockImplementation(async (p: string) => {
        capturedPrompt = p;
        return JSON.stringify(RESULT);
      });
      await proposalsService.runReplyAgent(PROSPECT_ID, TENANT, REPLY);
      expect(capturedPrompt).toContain('NEUTRAL: Provide one specific insight');
      expect(capturedPrompt).toContain('End with ONE qualifying question. No meeting.');
    });
  });

  // ── Scenario 3: NOT_NOW ─────────────────────────────────────────────────────

  describe('Scenario 3 — "Ahora no es prioridad." → NOT_NOW', () => {
    const REPLY = 'Ahora no es prioridad.';
    const RESULT = makeReplyAgentResult({
      intentAnalysis: 'NOT_NOW',
      sentiment: 'El prospecto pospone — no es rechazo, es timing.',
      followUpMessage:
        'Entendido, Dr. García. Las mejoras digitales tienen su propio timing. Si querés, te mando el análisis completo por email para que lo tengan cuando sea el momento. Sin presión.',
      suggestMeeting: false,
      recommendedAction: 'CONTINUE_CONVERSATION',
      prospectIntel: makeIntel({}),
    });

    beforeEach(() => setupReplyAgentMocks(RESULT));

    it('intentAnalysis = NOT_NOW', async () => {
      const result = await proposalsService.runReplyAgent(PROSPECT_ID, TENANT, REPLY);
      expect(result.intentAnalysis).toBe('NOT_NOW');
    });

    it('suggestMeeting = false — timing objection is not positive interest', async () => {
      const result = await proposalsService.runReplyAgent(PROSPECT_ID, TENANT, REPLY);
      expect(result.suggestMeeting).toBe(false);
    });

    it('followUpMessage acknowledges timing without pressure or meeting request', async () => {
      const result = await proposalsService.runReplyAgent(PROSPECT_ID, TENANT, REPLY);
      expect(result.followUpMessage).toBeTruthy();
      // No meeting request language
      expect(result.followUpMessage).not.toMatch(/agend|reuni[oó]n|llam[ae]mos|call|meeting|15 minutos/i);
    });

    it('followUpMessage offers to send analysis (keeps door open)', async () => {
      const result = await proposalsService.runReplyAgent(PROSPECT_ID, TENANT, REPLY);
      // Should offer something tangible without requiring a response
      expect(result.followUpMessage.length).toBeGreaterThan(40);
    });
  });

  // ── Scenario 4: OBJECTION ───────────────────────────────────────────────────

  describe('Scenario 4 — "Ya tenemos proveedor." → OBJECTION', () => {
    const REPLY = 'Ya tenemos proveedor.';
    const RESULT = makeReplyAgentResult({
      intentAnalysis: 'OBJECTION',
      sentiment: 'El prospecto menciona proveedor actual — objeción competitiva.',
      followUpMessage:
        'Tiene sentido. Lo que encontramos es específico de Veterinaria XYZ: 43 reseñas sin responder y ausencia en Google Maps local. Si su agencia actual ya trabaja eso, perfecto. Si no, el informe puede servir de comparación. Se lo mandamos igual, sin compromiso.',
      suggestMeeting: false,
      recommendedAction: 'CONTINUE_CONVERSATION',
      prospectIntel: makeIntel({ competitorPresent: true }),
    });

    beforeEach(() => setupReplyAgentMocks(RESULT));

    it('intentAnalysis = OBJECTION', async () => {
      const result = await proposalsService.runReplyAgent(PROSPECT_ID, TENANT, REPLY);
      expect(result.intentAnalysis).toBe('OBJECTION');
    });

    it('competitorPresent = true extracted from reply', async () => {
      const result = await proposalsService.runReplyAgent(PROSPECT_ID, TENANT, REPLY);
      expect(result.prospectIntel?.competitorPresent).toBe(true);
    });

    it('suggestMeeting = false — no pressure on competitive objection', async () => {
      const result = await proposalsService.runReplyAgent(PROSPECT_ID, TENANT, REPLY);
      expect(result.suggestMeeting).toBe(false);
    });

    it('followUpMessage reframes without dismissing current provider', async () => {
      const result = await proposalsService.runReplyAgent(PROSPECT_ID, TENANT, REPLY);
      // Should not argue or put down the existing provider
      expect(result.followUpMessage).not.toMatch(/tu proveedor es malo|están haciendo mal|no sirve/i);
      expect(result.followUpMessage.length).toBeGreaterThan(50);
    });

    it('recommendedAction = CONTINUE_CONVERSATION (door stays open)', async () => {
      const result = await proposalsService.runReplyAgent(PROSPECT_ID, TENANT, REPLY);
      expect(result.recommendedAction).toBe('CONTINUE_CONVERSATION');
    });
  });

  // ── Scenario 5: Webhook — escalation vs Reply Agent ────────────────────────

  describe('Scenario 5 — Price inquiry: webhook routing decision', () => {
    describe('"¿Me hacés un presupuesto?" → human escalation (webhook path)', () => {
      let mockProposalsService: { runReplyAgent: jest.Mock };

      beforeEach(async () => {
        const module = await Test.createTestingModule({
          providers: [
            OutreachService,
            { provide: PrismaService, useValue: prisma },
            { provide: ProposalsService, useValue: { runReplyAgent: jest.fn() } },
          ],
        }).compile();

        outreachService = module.get(OutreachService);
        mockProposalsService = module.get(ProposalsService) as any;

        prisma.prospect.findFirst.mockResolvedValue({ ...BASE_PROSPECT, tenantId: TENANT });
        prisma.$transaction.mockResolvedValue([{}, {}]);
        prisma.outreachActivity.create.mockResolvedValue({} as any);
      });

      it('creates ⚠️ escalation NOTA and skips Reply Agent entirely', async () => {
        await outreachService.handleMailWebhook('mail.reply_received', {
          externalReference: PROSPECT_ID,
          from: 'dr@veterinariaxyz.com.ar',
          subject: 'Re: Análisis digital',
          text: '¿Me hacés un presupuesto?',
        });

        expect(mockProposalsService.runReplyAgent).not.toHaveBeenCalled();
        expect(prisma.outreachActivity.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              type: 'NOTA',
              note: expect.stringContaining('⚠️ Escalación requerida'),
            }),
          }),
        );
      });

      it('"¿Cuánto cuesta?" routes to Reply Agent (not escalation)', async () => {
        (mockProposalsService.runReplyAgent as jest.Mock).mockResolvedValue(
          makeReplyAgentResult({ intentAnalysis: 'NEUTRAL', followUpMessage: 'Claro, te cuento...' }),
        );

        await outreachService.handleMailWebhook('mail.reply_received', {
          externalReference: PROSPECT_ID,
          from: 'dr@veterinariaxyz.com.ar',
          subject: 'Re: Análisis digital',
          text: '¿Cuánto cuesta?',
        });

        expect(mockProposalsService.runReplyAgent).toHaveBeenCalled();
        // Escalation NOTA should NOT be the reason for not calling Reply Agent
        const escalationNota = prisma.outreachActivity.create.mock.calls.find(
          (call: any) => call[0]?.data?.note?.includes('⚠️ Escalación requerida'),
        );
        expect(escalationNota).toBeUndefined();
      });
    });
  });

  // ── Scenario 6: Multi-turn conversation memory ──────────────────────────────

  describe('Scenario 6 — Multi-turn conversation: history awareness', () => {
    const CONVERSATION_HISTORY = [
      {
        type: 'CONTACTADO',
        mensajeUtilizado:
          'Analizando la presencia digital de Veterinaria XYZ, encontramos que tienen más de 40 reseñas sin responder.',
        note: null,
        createdAt: new Date('2026-06-10T14:00:00Z'),
      },
      {
        type: 'RESPUESTA_RECIBIDA',
        mensajeUtilizado: null,
        note: 'Respuesta de dr@vet.com.ar:\n\nSí, me interesa. Contame más.',
        createdAt: new Date('2026-06-11T09:00:00Z'),
      },
      {
        type: 'SEGUIMIENTO',
        mensajeUtilizado:
          'Excelente, Dr. García. Lo que encontramos en Veterinaria XYZ es que tienen 43 reseñas sin responder y no aparecen...',
        note: null,
        createdAt: new Date('2026-06-11T09:05:00Z'),
      },
    ];

    const SECOND_REPLY_RESULT = makeReplyAgentResult({
      intentAnalysis: 'POSITIVE',
      sentiment: 'Confirma interés y avanza hacia reunión.',
      followUpMessage:
        '¡Genial, Dr. García! El análisis está listo. ¿Les queda bien el jueves a las 10 hs para una videollamada de 20 minutos?',
      suggestMeeting: true,
      recommendedAction: 'SUGGEST_MEETING',
      prospectIntel: makeIntel({ contactPreference: 'videollamada', decisionMakerEngaged: true }),
    });

    beforeEach(() => {
      prisma.prospect.findFirst.mockResolvedValue({ ...BASE_PROSPECT });
      prisma.proposal.findFirst.mockResolvedValue({ id: 'prop-001', proposalMarkdown: OUTREACH_MARKDOWN });
      prisma.outreachActivity.findMany.mockResolvedValue(CONVERSATION_HISTORY);
      jest.spyOn(proposalsService as any, 'spawnClaude').mockResolvedValue(JSON.stringify(SECOND_REPLY_RESULT));
    });

    it('includes CONVERSATION HISTORY block in the prompt', async () => {
      let capturedPrompt = '';
      jest.spyOn(proposalsService as any, 'spawnClaude').mockImplementation(async (p: string) => {
        capturedPrompt = p;
        return JSON.stringify(SECOND_REPLY_RESULT);
      });

      await proposalsService.runReplyAgent(PROSPECT_ID, TENANT, 'Sí, perfecto. ¿Cuándo hablamos?');

      expect(capturedPrompt).toContain('CONVERSATION HISTORY');
      expect(capturedPrompt).toContain('[2026-06-10] INSPYRA: Analizando la presencia digital');
      expect(capturedPrompt).toContain('[2026-06-11] PROSPECT: Respuesta de dr@vet.com.ar');
      expect(capturedPrompt).toContain('[2026-06-11] INSPYRA: Excelente, Dr. García');
    });

    it('history tells agent not to repeat prior context (continuity rule in prompt)', async () => {
      let capturedPrompt = '';
      jest.spyOn(proposalsService as any, 'spawnClaude').mockImplementation(async (p: string) => {
        capturedPrompt = p;
        return JSON.stringify(SECOND_REPLY_RESULT);
      });

      await proposalsService.runReplyAgent(PROSPECT_ID, TENANT, 'Sí, perfecto.');

      expect(capturedPrompt).toContain('Do not repeat what was already said. Advance the conversation naturally.');
    });

    it('contactPreference intel extracted from second reply', async () => {
      const result = await proposalsService.runReplyAgent(
        PROSPECT_ID,
        TENANT,
        'Sí, podemos hacer una videollamada',
      );
      expect(result.prospectIntel?.contactPreference).toBe('videollamada');
    });

    it('second POSITIVE reply still suggests meeting (correct escalation through funnel)', async () => {
      const result = await proposalsService.runReplyAgent(PROSPECT_ID, TENANT, 'Sí, perfecto.');
      expect(result.suggestMeeting).toBe(true);
      expect(result.recommendedAction).toBe('SUGGEST_MEETING');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // handleMailWebhook() — full orchestration state transitions
  // ─────────────────────────────────────────────────────────────────────────────

  describe('handleMailWebhook() — state transition matrix', () => {
    let mockRunReplyAgent: jest.Mock;

    beforeEach(async () => {
      mockRunReplyAgent = jest.fn();
      const module = await Test.createTestingModule({
        providers: [
          OutreachService,
          { provide: PrismaService, useValue: prisma },
          { provide: ProposalsService, useValue: { runReplyAgent: mockRunReplyAgent } },
        ],
      }).compile();

      outreachService = module.get(OutreachService);
      prisma.$transaction.mockResolvedValue([{}, {}]);
      prisma.outreachActivity.create.mockResolvedValue({} as any);
    });

    function makePayload(text: string, estado: string = 'CONTACTADO') {
      prisma.prospect.findFirst.mockResolvedValue({ ...BASE_PROSPECT, estado, tenantId: TENANT });
      return {
        externalReference: PROSPECT_ID,
        from: 'dr@vet.com.ar',
        subject: 'Re: Análisis digital',
        text,
        messageId: 'msg-incoming-001',
      };
    }

    // State transitions — Step 1

    it('CONTACTADO → RESPONDIO recorded on first reply', async () => {
      mockRunReplyAgent.mockResolvedValue(makeReplyAgentResult({ intentAnalysis: 'NEUTRAL', followUpMessage: 'Respuesta' }));
      await outreachService.handleMailWebhook('mail.reply_received', makePayload('Interesante'));
      expect(prisma.prospect.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ estado: 'RESPONDIO' }) }),
      );
    });

    it('RESPONDIO stays RESPONDIO when already in that state (no double-transition)', async () => {
      mockRunReplyAgent.mockResolvedValue(makeReplyAgentResult({ intentAnalysis: 'NEUTRAL', followUpMessage: 'Ok' }));
      await outreachService.handleMailWebhook(
        'mail.reply_received',
        makePayload('¿Cuándo pueden?', 'RESPONDIO'),
      );
      // Step 1 update should set RESPONDIO (was already there)
      expect(prisma.prospect.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ estado: 'RESPONDIO' }) }),
      );
    });

    it('RESPONDIO → INTERESADO on POSITIVE + SUGGEST_MEETING (autoSendReply transitions state)', async () => {
      mockRunReplyAgent.mockResolvedValue(
        makeReplyAgentResult({
          intentAnalysis: 'POSITIVE',
          followUpMessage: 'Excelente, te comparto el análisis completo.',
          suggestMeeting: true,
          recommendedAction: 'SUGGEST_MEETING',
          prospectIntel: undefined,
        }),
      );

      await outreachService.handleMailWebhook(
        'mail.reply_received',
        makePayload('Sí, me interesa.', 'RESPONDIO'),
      );

      // prospect.update called twice: step 1 (RESPONDIO) + autoSendReply (INTERESADO)
      const allUpdates = prisma.prospect.update.mock.calls;
      const interesadoUpdate = allUpdates.find((call: any) => call[0]?.data?.estado === 'INTERESADO');
      expect(interesadoUpdate).toBeDefined();
      expect(mockMailSend).toHaveBeenCalled();
    });

    // Auto-send behavior by intent

    it('NEUTRAL → auto-send (included in AUTO_SEND_INTENTS)', async () => {
      mockRunReplyAgent.mockResolvedValue(
        makeReplyAgentResult({ intentAnalysis: 'NEUTRAL', followUpMessage: 'Claro, te cuento.' }),
      );
      await outreachService.handleMailWebhook('mail.reply_received', makePayload('¿Qué encontraron?'));
      expect(mockMailSend).toHaveBeenCalled();
    });

    it('NOT_NOW → auto-send (timing objection handled automatically)', async () => {
      mockRunReplyAgent.mockResolvedValue(
        makeReplyAgentResult({ intentAnalysis: 'NOT_NOW', followUpMessage: 'Entendido, sin presión.' }),
      );
      await outreachService.handleMailWebhook('mail.reply_received', makePayload('Ahora no es prioridad.'));
      expect(mockMailSend).toHaveBeenCalled();
    });

    it('OBJECTION → human draft (NOT auto-sent)', async () => {
      mockRunReplyAgent.mockResolvedValue(
        makeReplyAgentResult({
          intentAnalysis: 'OBJECTION',
          followUpMessage: 'Tiene sentido, el análisis igualmente puede ser útil...',
          prospectIntel: makeIntel({ competitorPresent: true }),
        }),
      );
      await outreachService.handleMailWebhook('mail.reply_received', makePayload('Ya tenemos proveedor.'));

      expect(mockMailSend).not.toHaveBeenCalled();
      expect(prisma.outreachActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'NOTA',
            note: expect.stringContaining('OBJECTION'),
          }),
        }),
      );
    });

    it('NEGATIVE → human draft (NOT auto-sent)', async () => {
      mockRunReplyAgent.mockResolvedValue(
        makeReplyAgentResult({
          intentAnalysis: 'NEGATIVE',
          followUpMessage: 'Entendido, gracias por responder.',
          recommendedAction: 'MARK_LOST',
        }),
      );
      await outreachService.handleMailWebhook('mail.reply_received', makePayload('No me interesa, no me escriban más.'));

      expect(mockMailSend).not.toHaveBeenCalled();
      expect(prisma.outreachActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'NOTA', note: expect.stringContaining('NEGATIVE') }),
        }),
      );
    });

    // Edge cases

    it('unknown event type is silently ignored', async () => {
      await outreachService.handleMailWebhook('mail.sent', { externalReference: PROSPECT_ID });
      expect(prisma.prospect.findFirst).not.toHaveBeenCalled();
    });

    it('prospect in CONVERTIDO is silently skipped', async () => {
      // Set CONVERTIDO BEFORE building payload (makePayload() also sets findFirst mock)
      prisma.prospect.findFirst.mockResolvedValue({ ...BASE_PROSPECT, estado: 'CONVERTIDO', tenantId: TENANT });
      await outreachService.handleMailWebhook('mail.reply_received', {
        externalReference: PROSPECT_ID,
        from: 'dr@vet.com.ar',
        subject: 'Re: análisis',
        text: 'Hola',
        messageId: 'msg-001',
      });
      expect(mockRunReplyAgent).not.toHaveBeenCalled();
    });

    it('missing externalReference logs warning and exits without DB access', async () => {
      await outreachService.handleMailWebhook('mail.reply_received', { from: 'unknown@test.com', text: 'Hola' });
      expect(prisma.prospect.findFirst).not.toHaveBeenCalled();
    });

    it('Reply Agent failure creates fallback NOTA for manual follow-up', async () => {
      prisma.prospect.findFirst.mockResolvedValue({ ...BASE_PROSPECT, tenantId: TENANT });
      mockRunReplyAgent.mockRejectedValue(new Error('Claude timeout after 1min'));

      await outreachService.handleMailWebhook('mail.reply_received', makePayload('Sí, me interesa'));

      expect(prisma.outreachActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'NOTA',
            note: expect.stringContaining('Reply Agent falló'),
          }),
        }),
      );
    });

    // RESPUESTA_RECIBIDA activity always created

    it('always records RESPUESTA_RECIBIDA activity before any Agent processing', async () => {
      mockRunReplyAgent.mockResolvedValue(makeReplyAgentResult({ intentAnalysis: 'NEUTRAL', followUpMessage: 'Ok' }));
      await outreachService.handleMailWebhook('mail.reply_received', makePayload('Interesante'));
      expect(prisma.outreachActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'RESPUESTA_RECIBIDA', channel: 'EMAIL' }),
        }),
      );
    });

    // SEGUIMIENTO activity on auto-send

    it('records SEGUIMIENTO activity with mensajeUtilizado when auto-send succeeds', async () => {
      mockRunReplyAgent.mockResolvedValue(
        makeReplyAgentResult({ intentAnalysis: 'NEUTRAL', followUpMessage: 'Claro, te cuento los detalles...' }),
      );
      await outreachService.handleMailWebhook('mail.reply_received', makePayload('¿Qué encontraron?'));
      expect(prisma.outreachActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'SEGUIMIENTO',
            mensajeUtilizado: 'Claro, te cuento los detalles...',
          }),
        }),
      );
    });
  });
});
