import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../components/Alert'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { useFlash } from '../hooks/useFlash'
import { fetchClients } from '../lib/clients'
import { errorMessage } from '../lib/http'
import { formatDate } from '../lib/format'
import type { Client } from '../types'

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const flash = useFlash()

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchClients()
      .then(setClients)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let cancelled = false

    fetchClients()
      .then((data) => {
        if (!cancelled) setClients(data)
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

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Empresas y personas asociadas a los motores en mantenimiento."
        actions={
          <>
            <Button variant="secondary" onClick={load} disabled={loading}>
              Actualizar
            </Button>
            <Link
              to="/clients/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Nuevo cliente
            </Link>
          </>
        }
      />

      {flash.message && (
        <div className="mb-5">
          <Alert variant="success" onClose={flash.clear}>
            {flash.message}
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

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <Loader />
        ) : clients.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Sin clientes registrados"
              description="Registra el primer cliente para poder asociarle motores y órdenes."
              action={
                <Link
                  to="/clients/new"
                  className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Registrar cliente
                </Link>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Cliente</th>
                  <th className="px-5 py-3 font-semibold">Identificación</th>
                  <th className="px-5 py-3 font-semibold">Estado</th>
                  <th className="px-5 py-3 font-semibold">Registro</th>
                  <th className="px-5 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link
                        to={`/clients/${client.id}`}
                        className="font-semibold text-slate-900 hover:text-slate-600"
                      >
                        {client.name}
                      </Link>
                      <p className="text-xs text-slate-500">{client.email ?? 'Sin correo'}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      <p className="font-medium text-slate-700">{client.identification_number}</p>
                      <p className="text-xs text-slate-500">{client.identification_type}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                          client.is_active
                            ? 'bg-emerald-100 text-emerald-700 ring-emerald-600/20'
                            : 'bg-slate-100 text-slate-600 ring-slate-500/20'
                        }`}
                      >
                        {client.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{formatDate(client.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/clients/${client.id}`}
                          className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        >
                          Ver
                        </Link>
                        <Link
                          to={`/clients/${client.id}/edit`}
                          className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        >
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
