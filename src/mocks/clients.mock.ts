import type { Client } from '../types/domain'

export const clientsMock: Client[] = [
  {
    id: 'client-001',
    name: 'Helia Energy',
    owner: 'Camila Vega',
    healthScore: 92,
    monthlyRevenueUsd: 1850,
    status: 'active',
  },
  {
    id: 'client-002',
    name: 'Tessera Joyas',
    owner: 'Mateo Lopez',
    healthScore: 71,
    monthlyRevenueUsd: 960,
    status: 'active',
  },
]
