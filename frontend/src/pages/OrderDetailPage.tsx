import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '../components/Alert'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useFlash } from '../hooks/useFlash'
import { errorMessage } from '../lib/http'
import { fetchOrder, fetchOrderHistory, updateOrderStatus } from '../lib/orders'
import { formatDateTime, shortId } from '../lib/format'
import { selectClass, textareaClass } from '../lib/styles'
import { ALLOWED_TRANSITIONS, statusLabel, STATUS_LABELS } from '../lib/status'
import type { RepairOrder, RepairOrderStatus, StatusHistoryEntry } from '../types'

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{children}</dd>
    </div>
  )
}

function ContentBlock({ title, content }: { title: string; content?: string | null }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
      <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
        {content?.trim() ? content : 'Sin información registrada.'}
      </p>
    </div>
  )
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const flash = useFlash()

  const [order, setOrder] = useState<RepairOrder | null>(null)
  const [history, setHistory] = useState<StatusHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [nextStatus, setNextStatus] = useState<RepairOrderStatus | ''>('')
  const [notes, setNotes] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    Promise.all([fetchOrder(id), fetchOrderHistory(id)])
      .then(([orderData, historyData]) => {
        if (cancelled) return
        setOrder(orderData)
        setHistory(historyData)
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
  }, [id])

  const allowedTransitions = order ? ALLOWED_TRANSITIONS[order.status] : []
  const effectiveNextStatus: RepairOrderStatus | '' =
    nextStatus && allowedTransitions.includes(nextStatus)
      ? nextStatus
      : allowedTransitions[0] ?? ''

  async function handleStatusChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!id || !effectiveNextStatus) return

    setUpdating(true)
    setUpdateError(null)
    setUpdateSuccess(null)

    try {
      const updated = await updateOrderStatus(id, effectiveNextStatus, notes)
      setOrder(updated)
      setNotes('')
      setUpdateSuccess(`Estado actualizado a ${statusLabel(updated.status)}.`)
      const historyData = await fetchOrderHistory(id)
      setHistory(historyData)
    } catch (err) {
      setUpdateError(errorMessage(err))
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return <Loader label="Cargando orden..." />
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="Orden no encontrada"
          actions={
            <Link
              to="/orders"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Volver
            </Link>
          }
        />
        {error && <Alert variant="error">{error}</Alert>}
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={order.order_number}
        description={`Orden de reparación · ${statusLabel(order.status)}`}
        actions={
          <>
            <Link
              to="/orders"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Volver
            </Link>
            {order.engine && (
              <Link
                to={`/engines/${order.engine.id}`}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Ver motor
              </Link>
            )}
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

      {updateSuccess && (
        <div className="mb-5">
          <Alert variant="success" onClose={() => setUpdateSuccess(null)}>
            {updateSuccess}
          </Alert>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">Resumen de la orden</h3>
              <StatusBadge status={order.status} />
            </div>
            <dl>
              <InfoRow label="Cliente">
                {order.client ? (
                  <Link
                    to={`/clients/${order.client.id}`}
                    className="font-medium text-slate-900 hover:text-slate-600"
                  >
                    {order.client.name}
                  </Link>
                ) : (
                  '—'
                )}
              </InfoRow>
              <InfoRow label="Motor">
                {order.engine ? (
                  <span>
                    {order.engine.serial_number} · {order.engine.manufacturer} {order.engine.model}
                  </span>
                ) : (
                  '—'
                )}
              </InfoRow>
              <InfoRow label="Técnico responsable">{order.technician_name ?? 'Sin asignar'}</InfoRow>
              <InfoRow label="Ingreso">{formatDateTime(order.received_at)}</InfoRow>
              <InfoRow label="Entrega estimada">{formatDateTime(order.estimated_delivery)}</InfoRow>
              <InfoRow label="Entrega real">{formatDateTime(order.actual_delivery)}</InfoRow>
              <InfoRow label="Última actualización">{formatDateTime(order.updated_at)}</InfoRow>
            </dl>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Detalle técnico</h3>
            <ContentBlock title="Problema reportado" content={order.problem_description} />
            <ContentBlock title="Diagnóstico técnico" content={order.technical_diagnosis} />
            <ContentBlock title="Trabajo realizado" content={order.work_performed} />
            <ContentBlock title="Observaciones" content={order.observations} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Cambiar estado</h3>
            <p className="mt-1 text-xs text-slate-500">
              Solo se permiten transiciones válidas del flujo de reparación.
            </p>

            {updateError && (
              <div className="mt-3">
                <Alert variant="error" onClose={() => setUpdateError(null)}>
                  {updateError}
                </Alert>
              </div>
            )}

            {allowedTransitions.length === 0 ? (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                La orden fue entregada. No admite más cambios de estado.
              </div>
            ) : (
              <form className="mt-4 space-y-3" onSubmit={handleStatusChange}>
                <div className="space-y-1.5">
                  <label htmlFor="next-status" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Nuevo estado
                  </label>
                  <select
                    id="next-status"
                    value={effectiveNextStatus}
                    onChange={(event) => setNextStatus(event.target.value as RepairOrderStatus)}
                    className={selectClass}
                  >
                    {allowedTransitions.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Nota del cambio
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    maxLength={500}
                    className={textareaClass}
                    placeholder="Observación opcional (máx. 500 caracteres)"
                  />
                  <p className="text-right text-[11px] text-slate-400">{notes.length}/500</p>
                </div>

                <button
                  type="submit"
                  disabled={updating || !effectiveNextStatus}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updating && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
                  )}
                  Actualizar estado
                </button>
              </form>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Datos de control</h3>
            <dl className="mt-2">
              <InfoRow label="ID de orden">
                <span className="break-all font-mono text-xs">{order.id}</span>
              </InfoRow>
              <InfoRow label="Creada">{formatDateTime(order.created_at)}</InfoRow>
            </dl>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Historial de estados</h3>
            <p className="text-xs text-slate-500">Trazabilidad completa de los cambios.</p>
          </div>
          <span className="text-xs text-slate-500">
            {history.length} evento{history.length === 1 ? '' : 's'}
          </span>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-slate-500">Sin eventos registrados.</p>
        ) : (
          <ol className="space-y-4 border-l border-slate-200 pl-5">
            {history.map((entry) => (
              <li key={entry.id} className="relative">
                <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-400 ring-4 ring-white" />
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={entry.new_status} />
                  <span className="text-xs text-slate-500">{formatDateTime(entry.changed_at)}</span>
                </div>
                {entry.previous_status && (
                  <p className="mt-1 text-xs text-slate-500">
                    Estado anterior: {statusLabel(entry.previous_status)}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  Responsable: <span className="font-mono">{shortId(entry.changed_by)}</span>
                </p>
                {entry.notes && <p className="mt-1 text-sm text-slate-700">{entry.notes}</p>}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
