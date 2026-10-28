import type { AuthResponse, UpdateUserPayload, User } from '../types'
import { authApi } from './http'

export function login(email: string, password: string): Promise<AuthResponse> {
  return authApi.post<AuthResponse>('/api/auth/login', { email, password }, { auth: false })
}

export function fetchCurrentUser(): Promise<{ user: User }> {
  return authApi.get<{ user: User }>('/api/auth/me')
}

export function fetchUsers(): Promise<{ users: User[] }> {
  return authApi.get<{ users: User[] }>('/api/users')
}

export function updateUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<{ message: string; user: User }> {
  return authApi.patch<{ message: string; user: User }>(`/api/users/${id}`, payload)
}

export function setUserActive(
  id: string,
  active: boolean,
): Promise<{ message: string; user: User }> {
  return authApi.patch<{ message: string; user: User }>(
    `/api/users/${id}/${active ? 'activate' : 'deactivate'}`,
  )
}
