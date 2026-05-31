import type { Prospect } from '../types/domain'

export const prospectsMock: Prospect[] = [
  {
    id: 'prospect-001',
    companyName: 'Calma Inmobiliaria',
    contactName: 'Laura Perez',
    industry: 'Real estate',
    location: 'Buenos Aires',
    score: 86,
    suggestedService: 'Web + SEO local',
    status: 'qualified',
  },
  {
    id: 'prospect-002',
    companyName: 'Norte Salud',
    contactName: 'Martin Silva',
    industry: 'Healthcare',
    location: 'Cordoba',
    score: 74,
    suggestedService: 'Landing + Ads',
    status: 'assigned',
  },
]
