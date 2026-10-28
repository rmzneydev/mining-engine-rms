import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '../components/Alert'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { useFlash } from '../hooks/useFlash'
import { fetchClient } from '../lib/clients'
import { errorMessage } from '../lib/http'
import { formatDateTime } from '../lib/format'
import type { Client } from '../types'

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value}</dd>
    </div>
  )
}

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const flash = useFlash()

  useEffect(() => {
    if (!id) return
    let cancelled = false

    fetchClient(id)
      .then((data) => {
        if (!cancelled) setClient(data)
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

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={client?.name ?? 'Detalle del cliente'}
        description="Información general del cliente."
        actions={
          <>
            <Link
              to="/clients"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Volver
            </Link>
            {client && (
              <Link
                to={`/clients/${client.id}/edit`}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Editar
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

      {error && (
        <div className="mb-5">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {loading ? (
        <Loader label="Cargando cliente..." />
      ) : client ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Datos del cliente</h3>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                  client.is_active
                    ? 'bg-emerald-100 text-emerald-700 ring-emerald-600/20'
                    : 'bg-slate-100 text-slate-600 ring-slate-500/20'
                }`}
              >
                {client.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <dl>
              <DetailRow label="Razón social" value={client.name} />
              <DetailRow
                label="Identificación"
                value={`${client.identification_type} · ${client.identification_number}`}
              />
              <DetailRow label="Correo" value={client.email ?? 'Sin correo registrado'} />
              <DetailRow label="Fecha de registro" value={formatDateTime(client.created_at)} />
              <DetailRow label="ID interno" value={client.id} />
            </dl>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Acciones</h3>
              <div className="mt-3 space-y-2">
                <Link
                  to={`/engines/new?client_id=${client.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Registrar motor
                  <span className="text-slate-400">→</span>
                </Link>
                <Link
                  to={`/orders?client_id=${client.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Ver órdenes del cliente
                  <span className="text-slate-400">→</span>
                </Link>
                <Link
                  to={`/clients/${client.id}/edit`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Editar datos
                  <span className="text-slate-400">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Alert variant="warning">No se encontró el cliente solicitado.</Alert>
      )}
    </div>
  )
}
