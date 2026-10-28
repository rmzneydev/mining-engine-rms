import type { Client, ClientInput } from '../types'
import { businessApi } from './http'

export function fetchClients(limit = 500): Promise<Client[]> {
  return businessApi.get<Client[]>(`/clients/?limit=${limit}`)
}

export function fetchClient(id: string): Promise<Client> {
  return businessApi.get<Client>(`/clients/${id}`)
}

export function createClient(payload: ClientInput): Promise<Client> {
  return businessApi.post<Client>('/clients/', payload)
}

export function updateClient(id: string, payload: Partial<ClientInput>): Promise<Client> {
  return businessApi.put<Client>(`/clients/${id}`, payload)
}
