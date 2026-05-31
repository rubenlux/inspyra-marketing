const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}

export function waitForMock<T>(data: T, delayMs = 150): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(data), delayMs)
  })
}
