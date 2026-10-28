import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../lib/http'
import { LoginPage } from './LoginPage'

const authState = vi.hoisted(() => ({
  login: vi.fn(),
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    token: null,
    loading: false,
    isAdmin: false,
    login: authState.login,
    logout: vi.fn(),
  }),
}))

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    authState.login.mockReset()
  })

  it('validates that credentials are present before calling the API', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByText('Ingresa tu correo y contraseña.')).toBeInTheDocument()
    expect(authState.login).not.toHaveBeenCalled()
  })

  it('submits the trimmed email and password', async () => {
    authState.login.mockResolvedValue({
      id: '1',
      name: 'Admin',
      email: 'admin@test.com',
      role: 'admin',
      isActive: true,
    })
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Correo electrónico'), '  admin@test.com  ')
    await user.type(screen.getByLabelText('Contraseña'), '123456')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => {
      expect(authState.login).toHaveBeenCalledWith('admin@test.com', '123456')
    })
  })

  it('shows the API error when authentication fails', async () => {
    authState.login.mockRejectedValue(new ApiError('Credenciales inválidas', 401))
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Correo electrónico'), 'admin@test.com')
    await user.type(screen.getByLabelText('Contraseña'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument()
  })
})
