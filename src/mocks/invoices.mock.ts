import type { Invoice } from '../types/domain'

export const invoicesMock: Invoice[] = [
  {
    id: 'invoice-001',
    clientId: 'client-001',
    number: 'INV-2026-014',
    amountUsd: 1850,
    status: 'sent',
    dueDate: '2026-06-10',
  },
  {
    id: 'invoice-002',
    clientId: 'client-002',
    number: 'INV-2026-015',
    amountUsd: 960,
    status: 'paid',
    dueDate: '2026-06-01',
  },
]
