import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

type IconName = 'dashboard' | 'clients' | 'engines' | 'orders' | 'users'

function NavIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, string> = {
    dashboard: 'M3 3h8v8H3V3Zm10 0h8v5h-8V3ZM3 13h8v8H3v-8Zm10-3h8v11h-8V10Z',
    clients:
      'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4Z',
    engines:
      'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm9.4 5.2.1-1.2-.1-1.2-2.1-.5a7.6 7.6 0 0 0-.7-1.6l1.2-1.8-1.7-1.7-1.8 1.2c-.5-.3-1-.5-1.6-.7L14.2 3h-2.4l-.5 2.1c-.6.2-1.1.4-1.6.7L7.9 4.6 6.2 6.3l1.2 1.8c-.3.5-.5 1-.7 1.6l-2.1.5L4.5 12l.1 1.2 2.1.5c.2.6.4 1.1.7 1.6l-1.2 1.8 1.7 1.7 1.8-1.2c.5.3 1 .5 1.6.7l.5 2.1h2.4l.5-2.1c.6-.2 1.1-.4 1.6-.7l1.8 1.2 1.7-1.7-1.2-1.8c.3-.5.5-1 .7-1.6l2.1-.5Z',
    orders:
      'M7 3h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 0 1 2-2Zm2 5h6v2H9V8Zm0 4h6v2H9v-2Z',
    users:
      'M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20v-1c0-2.76 3.13-5 7-5s7 2.24 7 5v1H2Zm15.5 0v-1c0-1.9-.8-3.6-2.1-4.8.5-.1 1-.2 1.6-.2 3.87 0 7 2.24 7 5v1h-6.5Z',
  }

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path d={paths[name]} />
    </svg>
  )
}

const NAV_ITEMS: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/clients', label: 'Clientes', icon: 'clients' },
  { to: '/engines', label: 'Motores', icon: 'engines' },
  { to: '/orders', label: 'Órdenes', icon: 'orders' },
]

function sectionTitle(pathname: string): string {
  if (pathname === '/') return 'Dashboard'
  if (pathname.startsWith('/clients')) return 'Clientes'
  if (pathname.startsWith('/engines')) return 'Motores'
  if (pathname.startsWith('/orders')) return 'Órdenes de reparación'
  if (pathname.startsWith('/users')) return 'Usuarios'
  return 'Mining Engine RMS'
}

function initials(name?: string): string {
  if (!name) return 'ME'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function Layout() {
  const { user, isAdmin, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
      isActive
        ? 'bg-white/10 text-white'
        : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-slate-900 transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-sm font-black text-slate-900">
            ME
          </span>
          <div>
            <p className="text-sm font-bold text-white">Mining Engine RMS</p>
            <p className="text-xs text-slate-400">Repair Management System</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Operación
          </p>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={linkClasses}
              onClick={() => setSidebarOpen(false)}
            >
              <NavIcon name={item.icon} />
              {item.label}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <p className="px-3 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Administración
              </p>
              <NavLink
                to="/users"
                className={linkClasses}
                onClick={() => setSidebarOpen(false)}
              >
                <NavIcon name="users" />
                Usuarios
              </NavLink>
            </>
          )}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
              {initials(user?.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user?.name}</p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(false)
              logout()
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H4m0 0 3-3m-3 3 3 3m6-9h5a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-5" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-30 bg-slate-900/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
              aria-label="Abrir menú"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden>
                <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Mining Engine RMS
              </p>
              <h1 className="text-base font-semibold text-slate-900">
                {sectionTitle(location.pathname)}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">
                {isAdmin ? 'Administrador' : 'Operador'}
              </p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              {initials(user?.name)}
            </span>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
