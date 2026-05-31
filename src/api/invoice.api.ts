import { waitForMock } from './client'
import { invoicesMock } from '../mocks/invoices.mock'
import type { Invoice } from '../types/domain'

export const invoiceApi = {
  list(): Promise<Invoice[]> {
    return waitForMock(invoicesMock)
  },

  getById(id: string): Promise<Invoice | undefined> {
    return waitForMock(invoicesMock.find((invoice) => invoice.id === id))
  },
}
