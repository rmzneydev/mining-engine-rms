import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Alert } from '../components/Alert'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { Pagination } from '../components/Pagination'
import { StatusBadge } from '../components/StatusBadge'
import { useFlash } from '../hooks/useFlash'
import { fetchClients } from '../lib/clients'
import { fetchEngines } from '../lib/engines'
import { errorMessage } from '../lib/http'
import { fetchOrders } from '../lib/orders'
import { formatDateTime } from '../lib/format'
import { inputClass, selectClass } from '../lib/styles'
import { STATUSES, STATUS_LABELS } from '../lib/status'
import type { Client, Engine, RepairOrder } from '../types'

const PAGE_SIZE = 10

export function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const flash = useFlash()

  const statusFilter = searchParams.get('status') ?? ''
  const clientFilter = searchParams.get('client_id') ?? ''
  const engineFilter = searchParams.get('engine_id') ?? ''
  const search = searchParams.get('search') ?? ''
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)

  const [orders, setOrders] = useState<RepairOrder[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [engines, setEngines] = useState<Engine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState(search)

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      setLoading(true)
      setError(null)
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === '') {
              next.delete(key)
            } else {
              next.set(key, value)
            }
          })
          if (!('page' in updates)) {
            next.delete('page')
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        updateParams({ search: searchInput.trim() || null })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput, search, updateParams])

  useEffect(() => {
    let cancelled = false

    fetchOrders({
      status: statusFilter || undefined,
      client_id: clientFilter || undefined,
      engine_id: engineFilter || undefined,
      search: search || undefined,
      skip: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    })
      .then((data) => {
        if (!cancelled) setOrders(data)
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
  }, [statusFilter, clientFilter, engineFilter, search, page])

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchClients(), fetchEngines()])
      .then(([clientList, engineList]) => {
        if (cancelled) return
        setClients(clientList)
        setEngines(engineList)
      })
      .catch(() => {
        if (!cancelled) {
          setClients([])
          setEngines([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const engineOptions = useMemo(
    () => (clientFilter ? engines.filter((engine) => engine.client_id === clientFilter) : engines),
    [engines, clientFilter],
  )

  const hasFilters = Boolean(statusFilter || clientFilter || engineFilter || search)

  function clearFilters() {
    setSearchInput('')
    updateParams({ status: null, client_id: null, engine_id: null, search: null })
  }

  return (
    <div>
      <PageHeader
        title="Órdenes de reparación"
        description="Seguimiento de todas las órdenes registradas en el taller."
        actions={
          <Link
            to="/orders/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Nueva orden
          </Link>
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

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1">
            <label htmlFor="order-search" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Buscar
            </label>
            <input
              id="order-search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Orden, cliente o serial"
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="status-filter" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Estado
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) => updateParams({ status: event.target.value || null })}
              className={selectClass}
            >
              <option value="">Todos</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="client-filter" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Cliente
            </label>
            <select
              id="client-filter"
              value={clientFilter}
              onChange={(event) =>
                updateParams({ client_id: event.target.value || null, engine_id: null })
              }
              className={selectClass}
            >
              <option value="">Todos</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="engine-filter" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Motor
            </label>
            <select
              id="engine-filter"
              value={engineFilter}
              onChange={(event) => updateParams({ engine_id: event.target.value || null })}
              className={selectClass}
            >
              <option value="">Todos</option>
              {engineOptions.map((engine) => (
                <option key={engine.id} value={engine.id}>
                  {engine.serial_number} · {engine.manufacturer} {engine.model}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasFilters && (
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" onClick={clearFilters} className="px-3 py-1.5 text-xs">
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <Loader />
        ) : orders.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title={hasFilters ? 'Sin resultados' : 'Sin órdenes registradas'}
              description={
                hasFilters
                  ? 'Ajusta los filtros o la búsqueda para encontrar órdenes.'
                  : 'Crea la primera orden de reparación para iniciar el seguimiento.'
              }
              action={
                hasFilters ? (
                  <Button variant="secondary" onClick={clearFilters}>
                    Limpiar filtros
                  </Button>
                ) : (
                  <Link
                    to="/orders/new"
                    className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Crear orden
                  </Link>
                )
              }
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Orden</th>
                    <th className="px-5 py-3 font-semibold">Cliente</th>
                    <th className="px-5 py-3 font-semibold">Motor</th>
                    <th className="px-5 py-3 font-semibold">Estado</th>
                    <th className="px-5 py-3 font-semibold">Técnico</th>
                    <th className="px-5 py-3 font-semibold">Entrega estimada</th>
                    <th className="px-5 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <Link
                          to={`/orders/${order.id}`}
                          className="font-semibold text-slate-900 hover:text-slate-600"
                        >
                          {order.order_number}
                        </Link>
                        <p className="text-xs text-slate-500">{formatDateTime(order.received_at)}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{order.client?.name ?? '—'}</td>
                      <td className="px-5 py-3 text-slate-600">
                        <p className="font-medium text-slate-700">
                          {order.engine?.serial_number ?? '—'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {order.engine
                            ? `${order.engine.manufacturer} ${order.engine.model}`
                            : ''}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-3 text-slate-600">{order.technician_name ?? '—'}</td>
                      <td className="px-5 py-3 text-slate-600">
                        {formatDateTime(order.estimated_delivery)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          to={`/orders/${order.id}`}
                          className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        >
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              count={orders.length}
              onPageChange={(next) =>
                updateParams({ page: next <= 1 ? null : String(next) })
              }
            />
          </>
        )}
      </div>
    </div>
  )
}
