import { format } from 'date-fns'

export function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(value: string): string {
  return format(new Date(value), 'dd MMM yyyy')
}
