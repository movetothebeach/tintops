import { getCookie } from '@/core/lib/utils'

export class FetchError extends Error {
  info?: unknown
  status?: number

  constructor(message: string, info?: unknown, status?: number) {
    super(message)
    this.info = info
    this.status = status
  }
}

export async function fetcher<T = unknown>(url: string, options?: RequestInit): Promise<T> {
  const csrfToken = getCookie('csrf-token')

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': csrfToken || '',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    let info
    try {
      info = await res.json()
    } catch {
      info = { message: 'An error occurred while fetching the data.' }
    }

    const error = new FetchError(
      info?.error || info?.message || `Failed to fetch: ${res.status}`,
      info,
      res.status
    )
    throw error
  }

  try {
    return await res.json()
  } catch {
    return {} as T
  }
}