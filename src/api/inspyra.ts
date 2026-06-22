// Typed wrapper over the Inspyra REST API.
// Handles the { success, data, error } response envelope.

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api/v1'

export function getStoredToken(): string | null {
  return localStorage.getItem('inspyra_token')
}

export function setStoredToken(token: string, refreshToken: string): void {
  localStorage.setItem('inspyra_token', token)
  localStorage.setItem('inspyra_refresh_token', refreshToken)
}

export function clearStoredToken(): void {
  localStorage.removeItem('inspyra_token')
  localStorage.removeItem('inspyra_refresh_token')
}

// Deduplicates concurrent refresh attempts — only one in-flight at a time
let refreshPromise: Promise<boolean> | null = null

async function silentRefresh(): Promise<boolean> {
  const rt = localStorage.getItem('inspyra_refresh_token')
  if (!rt) return false
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    })
    const json = await res.json()
    if (!res.ok || !json.success) return false
    setStoredToken(json.data.accessToken, json.data.refreshToken)
    return true
  } catch {
    return false
  }
}

async function req<T>(
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, string | number | boolean>,
): Promise<T> {
  const url = new URL(`${BASE}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v != null) url.searchParams.set(k, String(v))
    })
  }

  const buildHeaders = (): Record<string, string> => {
    const h: Record<string, string> = {}
    const t = getStoredToken()
    if (t) h.Authorization = `Bearer ${t}`
    if (body) h['Content-Type'] = 'application/json'
    return h
  }

  const fetchBody = body ? JSON.stringify(body) : undefined

  const res = await fetch(url.toString(), {
    method,
    headers: buildHeaders(),
    body: fetchBody,
  })

  if (res.status === 401) {
    // Attempt silent refresh once — deduplicate concurrent 401s
    if (!refreshPromise) {
      refreshPromise = silentRefresh().finally(() => { refreshPromise = null })
    }
    const refreshed = await refreshPromise
    if (!refreshed) {
      clearStoredToken()
      window.location.reload()
      throw new Error('Sesión expirada')
    }
    // Retry original request with the new access token
    const retryRes = await fetch(url.toString(), {
      method,
      headers: buildHeaders(),
      body: fetchBody,
    })
    if (retryRes.status === 204) return undefined as T
    const retryJson = await retryRes.json()
    if (!retryRes.ok || !retryJson.success) {
      throw new Error(retryJson?.error?.message ?? `HTTP ${retryRes.status}`)
    }
    return retryJson.data as T
  }

  if (res.status === 204) return undefined as T

  const json = await res.json()

  if (!res.ok || !json.success) {
    throw new Error(json?.error?.message ?? `HTTP ${res.status}`)
  }

  return json.data as T
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    req<{ accessToken: string; refreshToken: string }>('POST', '/auth/login', { email, password }),

  me: () =>
    req<{ id: string; email: string; firstName: string; lastName: string; role: string; tenantId: string; tenant: { name: string; slug: string } }>('GET', '/auth/me'),
}

// ─── Prospects ────────────────────────────────────────────────────────────────

export interface Prospect {
  id: string
  tenantId: string
  nombreEmpresa: string
  nombreContacto?: string
  email?: string
  telefono?: string
  rubro?: string
  ciudad?: string
  pais?: string
  website?: string
  instagram?: string
  linkedin?: string
  facebook?: string
  whatsapp?: string
  oportunidadDetectada?: string
  problemasEncontrados: string[]
  servicioSugerido?: string
  communicationLanguage?: 'EN' | 'ES' | 'PT' | 'FR' | 'DE' | null
  nivelOportunidad?: string
  score: number
  commercialScore?: number | null
  estado: string
  prioridad?: string
  detectadoPor?: string
  ultimoContacto?: string | null
  proximoSeguimiento?: string | null
  owner?: { id: string; firstName: string; lastName: string; email: string }
  creadoPorId?: string | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  validation?: {
    id: string
    agentScore: number
    humanScore: number | null
    status: 'PENDING' | 'VALIDATED' | 'REJECTED'
    prioridad: string
    estimatedTicketUsd: string | null
    servicesRecommended: string[]
    decisionFactors: DecisionFactors | null
    validationVersion: string
    reasoning: string | null
    validatedAt: string | null
    notes: string | null
    feedback?: { rejectionReason: string; notes: string | null } | null
  } | null
}

export interface ProspectKpis {
  total: number
  nuevosEstaSemana: number
  sinWeb: number
  oportunidadAlta: number
  listosOutreach: number
  enPipeline: number
  scorePromedio: number
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export const prospectsApi = {
  list: (params?: Record<string, unknown>) =>
    req<{ data: Prospect[]; meta: PaginationMeta }>('GET', '/prospects', undefined, params as never),

  kpis: () => req<ProspectKpis>('GET', '/prospects/kpis'),

  get: (id: string) => req<Prospect>('GET', `/prospects/${id}`),

  create: (data: Record<string, unknown>) => req<Prospect>('POST', '/prospects', data),

  update: (id: string, data: Record<string, unknown>) => req<Prospect>('PATCH', `/prospects/${id}`, data),

  remove: (id: string) => req<void>('DELETE', `/prospects/${id}`),

  bulk: (prospects: Record<string, unknown>[]) =>
    req<{ created: number; duplicates: number; errors: { row: number; error: string }[] }>('POST', '/prospects/bulk', { prospects }),

  fromUrl: (url: string) =>
    req<{
      sourceType: string; url: string;
      empresa: string | null; website: string | null; instagram: string | null;
      linkedin: string | null; facebook: string | null; googleBusiness: string | null;
      ciudad: string | null; rubro: string | null; descripcion: string | null;
      oportunidades: Array<{ servicio: string; score: number; razon: string }>;
      ticketEstimado: number; prioridad: string; oportunidadDetectada: string | null;
    }>('POST', '/prospects/from-url', { url }),
}

// ─── Prospect Validations ─────────────────────────────────────────────────────

export interface DecisionFactors {
  problemScore: number
  priorityScore: number
  fitScore: number
  ticketScore: number
}

export interface ValidationFeedback {
  rejectionReason: string
  notes: string | null
}

export interface ProspectValidation {
  id: string
  tenantId: string
  prospectId: string
  agentScore: number
  humanScore: number | null
  status: 'PENDING' | 'VALIDATED' | 'REJECTED'
  servicesRecommended: string[]
  estimatedTicketUsd: string | null
  prioridad: string
  reasoning: string | null
  decisionFactors: DecisionFactors | null
  validationVersion: string
  notes: string | null
  validatedBy: string | null
  validatedAt: string | null
  feedback?: ValidationFeedback | null
}

export interface ValidationKpis {
  total: number
  pending: number
  validated: number
  rejected: number
  approvalRate: number
  avgAgentScore: number
  avgHumanScore: number
  avgDrift: number
  medianDrift: number
  agentAccuracy: { accurate: number; overestimated: number; underestimated: number }
  avgEstimatedTicketUsd: number
  topRecommendedService: string | null
  topRejectionReason: string | null
}

export interface ReviewDto {
  humanScore: number
  status: 'VALIDATED' | 'REJECTED'
  notes?: string
  rejectionReason?: string
  feedbackNotes?: string
}

export const validationsApi = {
  list: (params?: Record<string, unknown>) =>
    req<ProspectValidation[]>('GET', '/prospect-validations', undefined, params as never),

  kpis: () => req<ValidationKpis>('GET', '/prospect-validations/kpis'),

  review: (id: string, data: ReviewDto) =>
    req<ProspectValidation>('PATCH', `/prospect-validations/${id}/review`, data),

  runAgent: (prospectId: string) =>
    req<ProspectValidation>('POST', `/prospect-validations/run/${prospectId}`),

  recalculate: (prospectId: string) =>
    req<ProspectValidation>('POST', `/prospect-validations/recalculate/${prospectId}`),
}

// ─── Research Jobs ────────────────────────────────────────────────────────────

export interface ResearchJob {
  id: string
  tenantId: string
  query: string
  limit: number
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  prospectsFound: number
  errorMessage?: string | null
  agentOutput?: string | null
  createdBy?: string | null
  createdAt: string
  startedAt?: string | null
  completedAt?: string | null
}

export interface ContactData {
  emails:    string[]
  phones:    string[]
  whatsapp:  string[]
  instagram: string[]
  facebook:  string[]
  linkedin:  string[]
}

export interface ResearchCandidate {
  id: string
  jobId: string
  tenantId: string
  candidateIndex: number
  nombreEmpresa: string
  ciudad?: string
  pais?: string
  rubro?: string
  website?: string
  instagram?: string
  linkedin?: string
  descripcion?: string
  empleadosEstimado?: number
  anosFundacion?: string
  presenciaDigital?: {
    tieneWeb?: boolean | null
    tieneSeo?: boolean | null
    tieneRedes?: boolean | null
    tieneEcommerce?: boolean | null
    tieneAgendaOnline?: boolean | null
  }
  facturacionEstimada?: string
  // Contact Acquisition (HTTP scraping)
  contactData?: ContactData | null
  // On-demand analysis result
  status: 'DISCOVERED' | 'DISCARDED' | 'PROMOTED'
  score?: number | null
  scoreBreakdown?: Record<string, number>
  reasoning?: string | null
  discardReason?: string | null
  problemasDetectados?: string[]
  oportunidadDetectada?: string | null
  servicioSugerido?: string | null
  estimatedTicketUsd?: number | null
  prospectId?: string | null
  createdAt: string
}

export interface WebsiteAuditResult {
  empresa: string
  dominio: string
  rubroEstimado: string
  auditScore: number
  commercialOpportunityScore: number
  erroresVisibles: string[]
  hallazgos: {
    seo:          { score: number; issues: string[] }
    frontend:     { score: number; issues: string[] }
    performance:  { score: number; issues: string[] }
    seguridad:    { score: number; issues: string[] }
    arquitectura: { stack: string[]; cms: string | null; issues: string[] }
  }
  severidad: {
    critico: string[]
    alto:    string[]
    medio:   string[]
    bajo:    string[]
  }
  serviciosSugeridos: string[]
  outreachBrief: string
}

export const researchApi = {
  createJob: (query: string, limit = 50) =>
    req<ResearchJob>('POST', '/research/jobs', { query, limit }),

  getJob: (id: string) =>
    req<ResearchJob>('GET', `/research/jobs/${id}`),

  listJobs: () =>
    req<ResearchJob[]>('GET', '/research/jobs'),

  getCandidates: (jobId: string) =>
    req<ResearchCandidate[]>('GET', `/research/jobs/${jobId}/candidates`),

  analyzeCandidate: (id: string) =>
    req<{ index: number; nombreEmpresa: string; action: string; score: number; scoreBreakdown?: Record<string, number>; reasoning?: string; discardReason?: string; problemasDetectados?: string[]; oportunidadDetectada?: string; servicioSugerido?: string; estimatedTicketUsd?: number }>('POST', `/research/candidates/${id}/analyze`),

  websiteAudit: (url: string) =>
    req<WebsiteAuditResult>('POST', '/research/website-audit', { url }),
}

// ─── Enrichment ──────────────────────────────────────────────────────────────

export interface EnrichmentJob {
  id: string
  prospectId: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  agentOutput?: string
  errorMessage?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
  result?: EnrichmentResult | null
}

export interface CommercialOpportunity {
  service: string
  impact: 'HIGH' | 'MEDIUM' | 'LOW'
  confidence: number
  evidence: string[]
}

export interface EnrichmentResult {
  id: string
  prospectId: string
  // Opportunity Analysis (Commercial Intelligence Agent)
  opportunities?: CommercialOpportunity[]
  estimatedTicket?: number
  priority?: 'HIGH' | 'MEDIUM' | 'LOW'
  opportunityScore: number
  confianza?: 'ALTA' | 'MEDIA' | 'BAJA'
  summary?: string
  // Legacy (kept for backward compat)
  contactabilityScore: number
  contactable: boolean
  // Human review workflow
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
  recommendedStatus?: 'SUGGEST_APPROVE' | 'SUGGEST_REJECT'
  recommendNotes?: string
  recommendedBy?: string
  createdAt: string
  updatedAt: string
}

export interface OutreachProspect {
  id: string
  nombreEmpresa: string
  rubro?: string
  ciudad?: string
  score: number
  commercialScore?: number
  enrichmentResult?: {
    contactabilityScore: number
    confianza?: string
    email?: string
    telefono?: string
    whatsapp?: string
    recommendedStatus?: string
  } | null
}

export interface OutreachQueue {
  total: number
  prospects: OutreachProspect[]
}

export interface EnrichmentQueue {
  pending: number
  running: number
  completed: number
  failed: number
  contactable: number
  pendingReview: number
  approved: number
}

export const enrichmentApi = {
  createJob: (prospectId: string) =>
    req<EnrichmentJob>('POST', '/enrichment/jobs', { prospectId }),

  getJob: (id: string) =>
    req<EnrichmentJob>('GET', `/enrichment/jobs/${id}`),

  listJobs: (prospectId?: string) =>
    req<EnrichmentJob[]>('GET', '/enrichment/jobs', undefined, prospectId ? { prospectId } : undefined),

  getQueue: () =>
    req<EnrichmentQueue>('GET', '/enrichment/queue'),

  getResult: (prospectId: string) =>
    req<EnrichmentResult | null>('GET', `/enrichment/prospects/${prospectId}/result`),

  reviewResult: (id: string, status: 'APPROVED' | 'REJECTED', notes?: string) =>
    req<EnrichmentResult>('PATCH', `/enrichment/results/${id}/review`, { status, notes }),

  suggestReview: (id: string, recommendedStatus: 'SUGGEST_APPROVE' | 'SUGGEST_REJECT', notes?: string) =>
    req<EnrichmentResult>('PATCH', `/enrichment/results/${id}/suggest`, { recommendedStatus, notes }),

  getOutreachQueue: () =>
    req<OutreachQueue>('GET', '/enrichment/outreach-queue'),
}

// ─── Proposals ───────────────────────────────────────────────────────────────

// ── Outreach Brief (Stage 1 — conseguir respuesta) ───────────────────────────

export interface OutreachBriefData {
  proposalType: 'OUTREACH'
  analysisType: 'OPPORTUNITY' | 'RISK' | 'MIXED'
  industryProfile: string
  communicationLanguage: string
  diagnosticoResumen: string
  problemasDetectados: Array<{ problema: string; impacto: string }>
  oportunidades: Array<{ oportunidad: string; beneficio: string }>
  riesgos: string[]
  recomendacionesGenerales: string[]
  cta: string
  outreachMessage: string
}

// ── Commercial Proposal (Stage 2 — tras interacción positiva) ────────────────

export interface ProposalPackage {
  nombre: 'Esencial' | 'Crecimiento' | 'Completo'
  descripcion: string
  incluye: string[]
  ticketRange?: string
  pricing?: { setup: number; mensual: number }
  destacado?: boolean
}

export interface CommercialProposalData {
  proposalType: 'COMMERCIAL'
  resumenEjecutivo: string
  diagnostico: string
  problemasDetectados: Array<{ problema: string; impacto: string }>
  objetivos: string[]
  paquetes: ProposalPackage[]
  paqueteRecomendado: 'Esencial' | 'Crecimiento' | 'Completo'
  preguntasCalificacion?: string[]
  justificacion: string
  cta: string
}

export type ProposalData = OutreachBriefData | CommercialProposalData

export interface Proposal {
  id: string
  tenantId: string
  prospectId: string
  version: number
  parentProposalId: string | null
  proposalType: 'OUTREACH' | 'COMMERCIAL'
  status: 'DRAFT' | 'APPROVED' | 'REJECTED'
  jobStatus: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  generatedBy: string
  proposalData: ProposalData | null
  proposalMarkdown: string | null
  proposalHtml: string | null
  approvedBy: string | null
  approvedAt: string | null
  rejectionReason: string | null
  errorMessage: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export const proposalsApi = {
  generate: (prospectId: string, proposalType: 'OUTREACH' | 'COMMERCIAL' = 'OUTREACH') =>
    req<Proposal>('POST', `/proposals/generate/${prospectId}`, { proposalType }),

  findByProspect: (prospectId: string) =>
    req<Proposal[]>('GET', `/proposals/prospect/${prospectId}`),

  findLatest: (prospectId: string) =>
    req<Proposal | null>('GET', `/proposals/prospect/${prospectId}/latest`),

  approve: (id: string) =>
    req<Proposal>('POST', `/proposals/${id}/approve`),

  reject: (id: string, rejectionReason: string) =>
    req<Proposal>('POST', `/proposals/${id}/reject`, { rejectionReason }),

  regenerate: (id: string) =>
    req<Proposal>('POST', `/proposals/${id}/regenerate`),

  translate: (text: string, sourceLang: string) =>
    req<{ translation: string }>('POST', '/proposals/translate', { text, sourceLang }),
}

// ─── Agent ROI ────────────────────────────────────────────────────────────────

export interface AgentRoiRow {
  id: string
  agentName: string
  period: string
  prospectsCreated: number
  prospectsValidated: number
  meetingsGenerated: number
  dealsCreated: number
  revenueGeneratedUsd: string
  costTokensUsd: string
}

export interface AgentRoiDashboard {
  period: string
  agents: AgentRoiRow[]
  totals: {
    prospectsCreated: number
    prospectsValidated: number
    meetingsGenerated: number
    dealsCreated: number
    revenueGeneratedUsd: number
    costTokensUsd: number
  }
}

// ─── Outreach Execution (ERP-032 / ERP-035 / ERP-036) ───────────────────────

export type ContactChannel = 'EMAIL' | 'WHATSAPP' | 'INSTAGRAM' | 'FACEBOOK' | 'LINKEDIN' | 'OTRO'
export type OutreachActivityType = 'CONTACTADO' | 'SEGUIMIENTO' | 'SIN_RESPUESTA' | 'RESPONDIO' | 'INTERESADO' | 'PERDIDO' | 'REUNION_AGENDADA' | 'NOTA'
export type ResponseType = 'INTERESADO' | 'QUIERE_MAS_INFO' | 'SIN_PRESUPUESTO' | 'YA_TIENE_PROVEEDOR' | 'NO_ES_PRIORIDAD' | 'NO_RESPONDE' | 'OTRO'

export interface OutreachActivity {
  id: string
  prospectId: string
  type: OutreachActivityType
  channel?: ContactChannel | null
  note?: string | null
  responseType?: ResponseType | null
  proposalId?: string | null
  mensajeUtilizado?: string | null
  provider?: string | null
  messageId?: string | null
  providerMessageId?: string | null
  fechaEnvio?: string | null
  createdById?: string | null
  createdAt: string
}

export interface OutreachFunnel {
  listoOutreach: number
  contactado: number
  respondio: number
  interesado: number
  reunionAgendada: number
  convertido: number
}

export const outreachApi = {
  contact: (prospectId: string, channel: ContactChannel, note?: string) =>
    req<{ id: string; estado: string }>('POST', `/outreach/${prospectId}/contact`, { channel, note }),

  respond: (prospectId: string, body: { note?: string; responseType?: ResponseType; mensajeUtilizado?: string; proposalId?: string }) =>
    req<{ id: string; estado: string }>('POST', `/outreach/${prospectId}/respond`, body),

  markInterested: (prospectId: string, body: { note?: string; mensajeUtilizado?: string; proposalId?: string }) =>
    req<{ id: string; estado: string }>('POST', `/outreach/${prospectId}/interested`, body),

  markLost: (prospectId: string, responseType: ResponseType, note?: string) =>
    req<{ id: string; estado: string }>('POST', `/outreach/${prospectId}/lost`, { responseType, note }),

  noResponse: (prospectId: string, note?: string) =>
    req<{ ok: boolean }>('POST', `/outreach/${prospectId}/no-response`, { note }),

  scheduleMeeting: (prospectId: string, note?: string, proposalId?: string) =>
    req<{ id: string; estado: string }>('POST', `/outreach/${prospectId}/schedule-meeting`, { note, proposalId }),

  sendEmail: (prospectId: string, body: { subject: string; proposalId?: string; note?: string }) =>
    req<{ id: string; estado: string }>('POST', `/outreach/${prospectId}/send-email`, body),

  addNote: (prospectId: string, note: string) =>
    req<OutreachActivity>('POST', `/outreach/${prospectId}/note`, { note }),

  getActivities: (prospectId: string) =>
    req<OutreachActivity[]>('GET', `/outreach/${prospectId}/activities`),

  getFunnel: () =>
    req<OutreachFunnel>('GET', '/outreach/funnel'),
}

export interface MailboxItem {
  id: string
  email: string
  quotaMB: number
  password?: string
}

export interface MailDraft {
  id: string
  to: string
  subject: string
  externalRef: string | null
  status: 'draft' | 'sent'
  sesMessageId: string | null
  createdAt: string
  updatedAt: string
}

export const mailApi = {
  sendFree: (body: { from?: string; to: string; subject: string; body?: string; bodyHtml?: string }) =>
    req<{ messageId: string }>('POST', '/outreach/mail/send', body),
  getMessages: (email: string, folder: string, limit = 50, offset = 0) =>
    req<{ items: any[]; meta: any }>('GET', '/outreach/mail/messages', undefined, { email, folder, limit, offset }),
  getMessage: (uid: number, email: string, folder: string) =>
    req<any>('GET', `/outreach/mail/messages/${uid}`, undefined, { email, folder }),
  getSentEmails: () =>
    req<{ items: any[] }>('GET', '/outreach/mail/sent'),
  getDrafts: () =>
    req<{ items: MailDraft[] }>('GET', '/outreach/mail/drafts'),
  createDraft: (body: { to: string; subject: string; html: string; externalRef?: string }) =>
    req<MailDraft>('POST', '/outreach/mail/drafts', body),
  sendDraft: (draftId: string, prospectId?: string) =>
    req<{ status: string; sesMessageId: string | null }>('POST', `/outreach/mail/drafts/${draftId}/send`, { prospectId }),
  deleteDraft: (draftId: string) =>
    req<void>('DELETE', `/outreach/mail/drafts/${draftId}`),
}

export const mailboxApi = {
  list: () =>
    req<{ items: MailboxItem[] }>('GET', '/outreach/mail/mailboxes'),
  create: (body: { localPart: string; quotaMB?: number }) =>
    req<MailboxItem>('POST', '/outreach/mail/mailboxes', body),
  delete: (email: string) =>
    req<void>('DELETE', `/outreach/mail/mailboxes/${encodeURIComponent(email)}`),
  resetPassword: (email: string) =>
    req<{ password: string }>('POST', `/outreach/mail/mailboxes/${encodeURIComponent(email)}/reset-password`),
}

export const agentRoiApi = {
  dashboard: (period?: string) =>
    req<AgentRoiDashboard>('GET', '/agent-roi', undefined, period ? { period } : undefined),
}
