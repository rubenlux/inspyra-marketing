export type ID = string

export interface User {
  id: ID
  name: string
  email: string
  role: 'owner' | 'admin' | 'member' | 'guest'
  status: 'active' | 'pending' | 'disabled'
}

export interface Prospect {
  id: ID
  companyName: string
  contactName?: string
  industry: string
  location: string
  score: number
  suggestedService: string
  status: 'new' | 'researching' | 'qualified' | 'assigned' | 'discarded'
}

export interface Client {
  id: ID
  name: string
  owner: string
  healthScore: number
  monthlyRevenueUsd: number
  status: 'active' | 'at_risk' | 'paused'
}

export interface Project {
  id: ID
  clientId: ID
  name: string
  status: 'planned' | 'active' | 'blocked' | 'done'
  progress: number
  dueDate: string
}

export interface Task {
  id: ID
  projectId: ID
  title: string
  assigneeId?: ID
  status: 'todo' | 'doing' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export interface Invoice {
  id: ID
  clientId: ID
  number: string
  amountUsd: number
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  dueDate: string
}

export interface Ticket {
  id: ID
  clientId: ID
  subject: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'waiting_client' | 'closed'
}

export interface Campaign {
  id: ID
  name: string
  channel: 'email' | 'linkedin' | 'whatsapp' | 'ads'
  status: 'draft' | 'active' | 'paused' | 'done'
  leads: number
}

export interface TeamMember extends User {
  area: 'growth' | 'delivery' | 'studio' | 'operations' | 'account'
}

export interface HostingDeployment {
  id: ID
  clientId: ID
  domain: string
  status: 'online' | 'deploying' | 'warning' | 'offline'
  lastDeployAt: string
}

export interface HostingAccount {
  id: ID
  clientId: ID
  plan: string
  domains: number
  status: 'active' | 'suspended'
}

export interface CloudProject {
  id: ID
  clientId: ID
  provider: 'aws'
  monthlyCostUsd: number
  status: 'healthy' | 'warning' | 'critical'
}

export interface EmailThread {
  id: ID
  from: string
  subject: string
  status: 'unread' | 'open' | 'closed'
}

export interface EmailCampaign {
  id: ID
  name: string
  audienceSize: number
  status: 'draft' | 'scheduled' | 'sent'
}

export interface SocialAccount {
  id: ID
  provider: 'instagram' | 'facebook' | 'linkedin'
  handle: string
  status: 'connected' | 'needs_auth'
}

export interface SocialPost {
  id: ID
  accountId: ID
  caption: string
  status: 'draft' | 'scheduled' | 'published'
  publishAt?: string
}

export interface AIAgent {
  id: ID
  name: string
  specialty: string
  status: 'available' | 'busy' | 'disabled'
  costUsdToday: number
}

export interface AutomationRun {
  id: ID
  workflowName: string
  status: 'queued' | 'running' | 'success' | 'failed'
  totalCostUsd?: number
  executedAt: string
}

export interface Integration {
  id: ID
  provider: string
  name: string
  status: 'connected' | 'disconnected' | 'error'
}
