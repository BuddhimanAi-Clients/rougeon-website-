export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
).replace(/\/$/, '')

type ApiErrorBody = { error?: { code?: string; message?: string; fields?: Record<string, string> }; code?: string; message?: string; errors?: unknown; fields?: Record<string, string> }

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly details?: unknown

  constructor(status: number, body: ApiErrorBody) {
    super(body.error?.message ?? body.message ?? (status === 0 ? 'The server could not be reached. Check your connection and try again.' : 'The request could not be completed'))
    this.name = 'ApiError'
    this.status = status
    this.code = body.error?.code ?? body.code
    this.details = body.errors
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers)

  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response
  try { response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, credentials: 'include' }) } catch { throw new ApiError(0, {}) }

  const body = (await response.json().catch(() => ({}))) as T & ApiErrorBody

  if (!response.ok) {
    throw new ApiError(response.status, body)
  }

  return body
}
