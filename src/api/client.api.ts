import { waitForMock } from './client'
import { clientsMock } from '../mocks/clients.mock'
import type { Client } from '../types/domain'

export const clientApi = {
  list(): Promise<Client[]> {
    return waitForMock(clientsMock)
  },

  getById(id: string): Promise<Client | undefined> {
    return waitForMock(clientsMock.find((client) => client.id === id))
  },
}
