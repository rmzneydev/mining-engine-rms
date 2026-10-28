import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../components/Alert'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { useFlash } from '../hooks/useFlash'
import { fetchClients } from '../lib/clients'
import { fetchEngines } from '../lib/engines'
import { errorMessage } from '../lib/http'
import { selectClass } from '../lib/styles'
import type { Client, Engine } from '../types'

export function EnginesPage() {
  const [engines, setEngines] = useState<Engine[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [clientFilter, setClientFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const flash = useFlash()

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([fetchEngines(), fetchClients()])
      .then(([engineList, clientList]) => {
        setEngines(engineList)
        setClients(clientList)
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let cancelled = false

    Promise.all([fetchEngines(), fetchClients()])
      .then(([engineList, clientList]) => {
        if (cancelled) return
        setEngines(engineList)
        setClients(clientList)
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

  const clientNames = useMemo(() => {
    const map = new Map<string, string>()
    clients.forEach((client) => map.set(client.id, client.name))
    return map
  }, [clients])

  const visibleEngines = clientFilter
    ? engines.filter((engine) => engine.client_id === clientFilter)
    : engines

  return (
    <div>
      <PageHeader
        title="Motores"
        description="Equipos registrados y su cliente asociado."
        actions={
          <>
            <Button variant="secondary" onClick={load} disabled={loading}>
              Actualizar
            </Button>
            <Link
              to="/engines/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Nuevo motor
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

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor="client-filter" className="text-sm font-medium text-slate-600">
            Cliente
          </label>
          <select
            id="client-filter"
            value={clientFilter}
            onChange={(event) => setClientFilter(event.target.value)}
            className={`${selectClass} max-w-xs`}
          >
            <option value="">Todos los clientes</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-slate-500">
          {visibleEngines.length} motor{visibleEngines.length === 1 ? '' : 'es'} en total
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <Loader />
        ) : visibleEngines.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Sin motores registrados"
              description="Registra un motor y asígnalo a un cliente para crear órdenes de reparación."
              action={
                <Link
                  to="/engines/new"
                  className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Registrar motor
                </Link>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Serial</th>
                  <th className="px-5 py-3 font-semibold">Marca / Modelo</th>
                  <th className="px-5 py-3 font-semibold">Tipo</th>
                  <th className="px-5 py-3 font-semibold">Potencia</th>
                  <th className="px-5 py-3 font-semibold">Cliente</th>
                  <th className="px-5 py-3 font-semibold">Estado</th>
                  <th className="px-5 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleEngines.map((engine) => (
                  <tr key={engine.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link
                        to={`/engines/${engine.id}`}
                        className="font-semibold text-slate-900 hover:text-slate-600"
                      >
                        {engine.serial_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {engine.manufacturer} · {engine.model}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{engine.engine_type}</td>
                    <td className="px-5 py-3 text-slate-600">{engine.power_capacity}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {clientNames.get(engine.client_id) ?? '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                          engine.is_active
                            ? 'bg-emerald-100 text-emerald-700 ring-emerald-600/20'
                            : 'bg-slate-100 text-slate-600 ring-slate-500/20'
                        }`}
                      >
                        {engine.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/engines/${engine.id}`}
                          className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        >
                          Ver
                        </Link>
                        <Link
                          to={`/engines/${engine.id}/edit`}
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
