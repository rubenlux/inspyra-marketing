import type { Ticket } from '../types/domain'

export const ticketsMock: Ticket[] = [
  {
    id: 'ticket-291',
    clientId: 'client-001',
    subject: 'Email transaccional no llega',
    priority: 'urgent',
    status: 'open',
  },
  {
    id: 'ticket-290',
    clientId: 'client-002',
    subject: 'Pedido perdido en checkout',
    priority: 'urgent',
    status: 'in_progress',
  },
]
