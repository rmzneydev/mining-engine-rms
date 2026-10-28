import type { Engine, EngineInput } from '../types'
import { businessApi } from './http'

export interface EngineQuery {
  clientId?: string
  limit?: number
}

export function fetchEngines(options: EngineQuery = {}): Promise<Engine[]> {
  const params = new URLSearchParams({ limit: String(options.limit ?? 500) })
  if (options.clientId) {
    params.set('client_id', options.clientId)
  }
  return businessApi.get<Engine[]>(`/engines/?${params.toString()}`)
}

export function fetchEngine(id: string): Promise<Engine> {
  return businessApi.get<Engine>(`/engines/${id}`)
}

export function createEngine(payload: EngineInput): Promise<Engine> {
  return businessApi.post<Engine>('/engines/', payload)
}

export function updateEngine(id: string, payload: Partial<EngineInput>): Promise<Engine> {
  return businessApi.put<Engine>(`/engines/${id}`, payload)
}
