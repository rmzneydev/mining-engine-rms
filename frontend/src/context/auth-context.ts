import { createContext } from 'react'
import type { User } from '../types'

export interface AuthContextValue {
  user: User | null
  token: string | null
  loading: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
