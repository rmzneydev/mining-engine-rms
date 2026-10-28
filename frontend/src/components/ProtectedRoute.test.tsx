import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProtectedRoute } from './ProtectedRoute'

type MockUser = {
  id: string
  name: string
  email: string
  role: 'admin' | 'operator'
  isActive: boolean
}

const authState = vi.hoisted(() => ({
  user: null as MockUser | null,
  loading: false,
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    ...authState,
    token: authState.user ? 'test-token' : null,
    isAdmin: authState.user?.role === 'admin',
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

function renderPrivateRoute() {
  return render(
    <MemoryRouter initialEntries={['/private']}>
      <Routes>
        <Route path="/login" element={<p>Pantalla de login</p>} />
        <Route
          path="/private"
          element={
            <ProtectedRoute>
              <p>Contenido privado</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    authState.user = null
    authState.loading = false
  })

  it('shows a loader while the session is being restored', () => {
    authState.loading = true
    renderPrivateRoute()
    expect(screen.getByText('Cargando sesión...')).toBeInTheDocument()
  })

  it('redirects anonymous users to the login screen', () => {
    renderPrivateRoute()
    expect(screen.getByText('Pantalla de login')).toBeInTheDocument()
  })

  it('renders the protected content for authenticated users', () => {
    authState.user = {
      id: '1',
      name: 'Admin',
      email: 'admin@test.com',
      role: 'admin',
      isActive: true,
    }
    renderPrivateRoute()
    expect(screen.getByText('Contenido privado')).toBeInTheDocument()
  })
})
