import type { Task } from '../types/domain'

export const tasksMock: Task[] = [
  {
    id: 'task-001',
    projectId: 'project-001',
    title: 'Revisar flujo de login',
    assigneeId: 'user-001',
    status: 'doing',
    priority: 'high',
  },
  {
    id: 'task-002',
    projectId: 'project-002',
    title: 'Validar catalogo mobile',
    assigneeId: 'user-002',
    status: 'review',
    priority: 'medium',
  },
]
