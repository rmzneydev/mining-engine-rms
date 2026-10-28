import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../components/Alert'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { fetchOrders } from '../lib/orders'
import { errorMessage } from '../lib/http'
import { formatDateTime } from '../lib/format'
import { STATUSES, STATUS_LABELS } from '../lib/status'
import type { RepairOrder, RepairOrderStatus } from '../types'

export function DashboardPage() {
  const [orders, setOrders] = useState<RepairOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchOrders({ limit: 500 })
      .then(setOrders)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let cancelled = false

    fetchOrders({ limit: 500 })
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
  }, [])

  const counts = useMemo(() => {
    const base = Object.fromEntries(STATUSES.map((status) => [status, 0])) as Record<
      RepairOrderStatus,
      number
    >
    orders.forEach((order) => {
      base[order.status] += 1
    })
    return base
  }, [orders])

  const activeOrders = orders.filter((order) => order.status !== 'delivered').length
  const recentOrders = orders.slice(0, 5)

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Resumen operativo de las órdenes de reparación."
        actions={
          <>
            <Button variant="secondary" onClick={load} disabled={loading}>
              Actualizar
            </Button>
            <Link
              to="/orders/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Nueva orden
            </Link>
          </>
        }
      />

      {error && (
        <div className="mb-6">
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-slate-900 p-5 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Órdenes totales
          </p>
          <p className="mt-2 text-3xl font-bold">{orders.length}</p>
          <p className="mt-1 text-xs text-slate-400">{activeOrders} activas sin entregar</p>
        </div>

        {STATUSES.map((status) => (
          <Link
            key={status}
            to={`/orders?status=${status}`}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {STATUS_LABELS[status]}
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{counts[status]}</p>
            <p className="mt-1 text-xs text-slate-400 group-hover:text-slate-600">
              Ver órdenes →
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Órdenes recientes</h3>
                <p className="text-xs text-slate-500">Últimos ingresos registrados</p>
              </div>
              <Link to="/orders" className="text-xs font-semibold text-slate-600 hover:text-slate-900">
                Ver todas
              </Link>
            </div>

            {loading ? (
              <Loader />
            ) : recentOrders.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="Aún no hay órdenes"
                  description="Crea la primera orden de reparación para comenzar el seguimiento."
                  action={
                    <Link
                      to="/orders/new"
                      className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Crear orden
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Orden</th>
                      <th className="px-5 py-3 font-semibold">Cliente</th>
                      <th className="px-5 py-3 font-semibold">Estado</th>
                      <th className="px-5 py-3 font-semibold">Recibida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <Link
                            to={`/orders/${order.id}`}
                            className="font-semibold text-slate-900 hover:text-slate-600"
                          >
                            {order.order_number}
                          </Link>
                          <p className="text-xs text-slate-500">
                            {order.engine?.serial_number ?? 'Motor sin datos'}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {order.client?.name ?? '—'}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {formatDateTime(order.received_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Accesos rápidos</h3>
          <p className="mt-1 text-xs text-slate-500">Crea o consulta registros del sistema.</p>
          <div className="mt-4 space-y-2">
            {[
              { to: '/clients/new', label: 'Registrar cliente' },
              { to: '/engines/new', label: 'Registrar motor' },
              { to: '/orders/new', label: 'Crear orden de reparación' },
              { to: '/clients', label: 'Consultar clientes' },
              { to: '/engines', label: 'Consultar motores' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                {item.label}
                <span className="text-slate-400">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
