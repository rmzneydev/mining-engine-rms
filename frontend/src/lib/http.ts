import type { ApiValidationError } from '../types'

const AUTH_API_URL = (import.meta.env.VITE_AUTH_API_URL ?? 'http://localhost:3001').replace(/\/$/, '')
const BUSINESS_API_URL = (import.meta.env.VITE_BUSINESS_API_URL ?? 'http://localhost:8002').replace(/\/$/, '')

export const TOKEN_KEY = 'mining-rms.token'
export const UNAUTHORIZED_EVENT = 'mining-rms:unauthorized'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions {
  method?: HttpMethod
  json?: unknown
  auth?: boolean
  signal?: AbortSignal
}

export class ApiError extends Error {
  readonly status: number
  readonly errors?: ApiValidationError[]

  constructor(message: string, status: number, errors?: ApiValidationError[]) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error && error.message) return error.message
  return 'Ocurrió un error inesperado'
}

async function parsePayload(response: Response): Promise<unknown> {
  if (response.status === 204) return null
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

function extractError(
  payload: unknown,
  status: number,
): { message: string; errors?: ApiValidationError[] } {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>

    const errors = Array.isArray(record.errors)
      ? (record.errors as ApiValidationError[]).filter(
          (item) => item && typeof item.field === 'string' && typeof item.message === 'string',
        )
      : undefined

    if (typeof record.message === 'string') {
      return { message: record.message, errors }
    }

    if (typeof record.detail === 'string') {
      return { message: record.detail, errors }
    }

    if (Array.isArray(record.detail)) {
      const messages = record.detail
        .map((item) => {
          if (item && typeof item === 'object' && 'msg' in item) {
            return String((item as { msg: unknown }).msg)
          }
          return null
        })
        .filter((value): value is string => Boolean(value))

      if (messages.length > 0) {
        return { message: messages.join('. '), errors }
      }
    }
  }

  return { message: `Error ${status}`, errors: undefined }
}

async function request<T>(baseUrl: string, path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', json, auth = true, signal } = options

  const headers = new Headers({ Accept: 'application/json' })
  if (json !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  if (auth) {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: json !== undefined ? JSON.stringify(json) : undefined,
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new ApiError(
      'No se pudo conectar con el servidor. Verifica que los servicios estén activos.',
      0,
    )
  }

  const payload = await parsePayload(response)

  if (!response.ok) {
    if (response.status === 401 && auth) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    const { message, errors } = extractError(payload, response.status)
    throw new ApiError(message, response.status, errors)
  }

  return payload as T
}

function createApiClient(baseUrl: string) {
  return {
    get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'json'>) =>
      request<T>(baseUrl, path, { ...options, method: 'GET' }),
    post: <T>(path: string, json?: unknown, options?: Omit<RequestOptions, 'method' | 'json'>) =>
      request<T>(baseUrl, path, { ...options, method: 'POST', json }),
    put: <T>(path: string, json?: unknown, options?: Omit<RequestOptions, 'method' | 'json'>) =>
      request<T>(baseUrl, path, { ...options, method: 'PUT', json }),
    patch: <T>(path: string, json?: unknown, options?: Omit<RequestOptions, 'method' | 'json'>) =>
      request<T>(baseUrl, path, { ...options, method: 'PATCH', json }),
    delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'json'>) =>
      request<T>(baseUrl, path, { ...options, method: 'DELETE' }),
  }
}

export const authApi = createApiClient(AUTH_API_URL)
export const businessApi = createApiClient(BUSINESS_API_URL)
