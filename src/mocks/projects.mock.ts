import type { Project } from '../types/domain'

export const projectsMock: Project[] = [
  {
    id: 'project-001',
    clientId: 'client-001',
    name: 'Portal de clientes',
    status: 'active',
    progress: 68,
    dueDate: '2026-06-18',
  },
  {
    id: 'project-002',
    clientId: 'client-002',
    name: 'E-commerce refresh',
    status: 'blocked',
    progress: 41,
    dueDate: '2026-06-25',
  },
]
