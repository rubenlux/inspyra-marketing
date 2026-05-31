import { waitForMock } from './client'
import { prospectsMock } from '../mocks/prospects.mock'
import type { Prospect } from '../types/domain'

export const prospectApi = {
  list(): Promise<Prospect[]> {
    return waitForMock(prospectsMock)
  },

  getById(id: string): Promise<Prospect | undefined> {
    return waitForMock(prospectsMock.find((prospect) => prospect.id === id))
  },
}
