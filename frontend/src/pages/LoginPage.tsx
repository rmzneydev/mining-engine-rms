import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Alert } from '../components/Alert'
import { errorMessage } from '../lib/http'
import { useAuth } from '../hooks/useAuth'

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200'

export function LoginPage() {
  const { user, login } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const from = (
    location.state as { from?: { pathname?: string; search?: string } } | null
  )?.from
  const target =
    from?.pathname && from.pathname !== '/login'
      ? `${from.pathname}${from.search ?? ''}`
      : '/'

  if (user) {
    return <Navigate to={target} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contraseña.')
      return
    }

    setSubmitting(true)
    try {
      await login(email.trim(), password)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-12 lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 text-sm font-black text-slate-900">
            ME
          </span>
          <div>
            <p className="text-sm font-bold text-white">Mining Engine RMS</p>
            <p className="text-xs text-slate-400">Repair Management System</p>
          </div>
        </div>

        <div className="relative max-w-lg">
          <h1 className="text-4xl font-bold leading-tight text-white">
            Control total del mantenimiento de motores de minería.
          </h1>
          <p className="mt-4 text-base text-slate-400">
            Centraliza clientes, motores y órdenes de reparación con trazabilidad completa del
            estado de cada trabajo.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-300">
            {[
              'Órdenes con historial de estados y responsable',
              'Catálogo de clientes y motores asociados',
              'Roles de administrador y operador',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden>
                    <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 0 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">
          Prueba técnica Full-Stack · React · Express · FastAPI · PostgreSQL
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-amber-400">
              ME
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">Mining Engine RMS</p>
              <p className="text-xs text-slate-500">Repair Management System</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-slate-500">
              Accede con las credenciales asignadas por el administrador.
            </p>

            {error && (
              <div className="mt-5">
                <Alert variant="error">{error}</Alert>
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@test.com"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
                )}
                {submitting ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>

            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-700">Credenciales de demostración</p>
              <p className="mt-1">
                Administrador: <code className="font-mono">admin@test.com</code> /{' '}
                <code className="font-mono">123456</code>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
