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

  const headers: Record<string, string> = {}
  const t = getStoredToken()
  if (t) headers.Authorization = `Bearer ${t}`
  if (body) headers['Content-Type'] = 'application/json'

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const json = await res.json()

  if (res.status === 401) {
    clearStoredToken()
    window.location.reload()
    throw new Error('Sesión expirada')
  }

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
  oportunidadDetectada?: string
  problemasEncontrados: string[]
  servicioSugerido?: string
  nivelOportunidad?: string
  score: number
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

  update: (id: string, data: Record<string, unknown>) => req<Prospect>('PATCH', `/prospects/${id}`, data),
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

export const researchApi = {
  createJob: (query: string, limit = 10) =>
    req<ResearchJob>('POST', '/research/jobs', { query, limit }),

  getJob: (id: string) =>
    req<ResearchJob>('GET', `/research/jobs/${id}`),

  listJobs: () =>
    req<ResearchJob[]>('GET', '/research/jobs'),
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

export const agentRoiApi = {
  dashboard: (period?: string) =>
    req<AgentRoiDashboard>('GET', '/agent-roi', undefined, period ? { period } : undefined),
}
