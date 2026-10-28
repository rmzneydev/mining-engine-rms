import { useCallback, useEffect, useState } from 'react'
import { Alert } from '../components/Alert'
import { Button } from '../components/Button'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../hooks/useAuth'
import { fetchUsers, setUserActive, updateUser } from '../lib/auth'
import { errorMessage } from '../lib/http'
import { selectClass } from '../lib/styles'
import type { User, UserRole } from '../types'

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchUsers()
      .then((response) => setUsers(response.users))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let cancelled = false

    fetchUsers()
      .then((response) => {
        if (!cancelled) setUsers(response.users)
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  function replaceUser(updated: User) {
    setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)))
  }

  async function handleRoleChange(user: User, role: UserRole) {
    setBusyId(user.id)
    setError(null)
    setFeedback(null)
    try {
      const response = await updateUser(user.id, { role })
      replaceUser(response.user)
      setFeedback(`Rol de ${response.user.name} actualizado a ${role}.`)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  async function handleToggleActive(user: User) {
    setBusyId(user.id)
    setError(null)
    setFeedback(null)
    try {
      const response = await setUserActive(user.id, !user.isActive)
      replaceUser(response.user)
      setFeedback(
        `Usuario ${response.user.name} ${response.user.isActive ? 'activado' : 'desactivado'}.`,
      )
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Administra roles y el estado de acceso de los usuarios."
        actions={
          <Button variant="secondary" onClick={load} disabled={loading}>
            Actualizar
          </Button>
        }
      />

      {feedback && (
        <div className="mb-5">
          <Alert variant="success" onClose={() => setFeedback(null)}>
            {feedback}
          </Alert>
        </div>
      )}

      {error && (
        <div className="mb-5">
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </div>
      )}

      <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-xs text-sky-800">
        Los usuarios desactivados no pueden iniciar sesión. Un token ya emitido permanece válido
        hasta su expiración (1 hora) porque la API de negocio valida el JWT de forma stateless.
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <Loader />
        ) : users.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            No hay usuarios registrados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Usuario</th>
                  <th className="px-5 py-3 font-semibold">Rol</th>
                  <th className="px-5 py-3 font-semibold">Estado</th>
                  <th className="px-5 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => {
                  const isSelf = user.id === currentUser?.id
                  const busy = busyId === user.id

                  return (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">{user.name}</p>
                          {isSelf && (
                            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                              Tú
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <select
                          value={user.role}
                          disabled={busy || isSelf}
                          onChange={(event) =>
                            handleRoleChange(user, event.target.value as UserRole)
                          }
                          className={`${selectClass} max-w-[10rem]`}
                          aria-label={`Rol de ${user.name}`}
                        >
                          <option value="admin">Administrador</option>
                          <option value="operator">Operador</option>
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                            user.isActive
                              ? 'bg-emerald-100 text-emerald-700 ring-emerald-600/20'
                              : 'bg-red-100 text-red-700 ring-red-600/20'
                          }`}
                        >
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          variant={user.isActive ? 'danger' : 'primary'}
                          disabled={busy || isSelf}
                          onClick={() => handleToggleActive(user)}
                          className="px-3 py-1.5 text-xs"
                          title={
                            isSelf
                              ? 'No puedes desactivar tu propia cuenta'
                              : undefined
                          }
                        >
                          {user.isActive ? 'Desactivar' : 'Activar'}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-slate-500">
        No es posible desactivar tu propia cuenta ni quitarte el rol de administrador.
      </p>
    </div>
  )
}
