import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '../components/Alert'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { useFlash } from '../hooks/useFlash'
import { fetchClient } from '../lib/clients'
import { fetchEngine } from '../lib/engines'
import { errorMessage } from '../lib/http'
import { formatDateTime } from '../lib/format'
import type { Client, Engine } from '../types'

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value}</dd>
    </div>
  )
}

export function EngineDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [engine, setEngine] = useState<Engine | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const flash = useFlash()

  useEffect(() => {
    if (!id) return
    let cancelled = false

    fetchEngine(id)
      .then(async (data) => {
        if (cancelled) return
        setEngine(data)
        try {
          const owner = await fetchClient(data.client_id)
          if (!cancelled) setClient(owner)
        } catch {
          if (!cancelled) setClient(null)
        }
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
        title={engine?.serial_number ?? 'Detalle del motor'}
        description="Especificaciones y cliente propietario."
        actions={
          <>
            <Link
              to="/engines"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Volver
            </Link>
            {engine && (
              <Link
                to={`/engines/${engine.id}/edit`}
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
        <Loader label="Cargando motor..." />
      ) : engine ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Ficha técnica</h3>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                  engine.is_active
                    ? 'bg-emerald-100 text-emerald-700 ring-emerald-600/20'
                    : 'bg-slate-100 text-slate-600 ring-slate-500/20'
                }`}
              >
                {engine.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <dl>
              <DetailRow label="Serial" value={engine.serial_number} />
              <DetailRow label="Marca" value={engine.manufacturer} />
              <DetailRow label="Modelo" value={engine.model} />
              <DetailRow label="Tipo" value={engine.engine_type} />
              <DetailRow label="Potencia" value={engine.power_capacity} />
              <DetailRow label="Registro" value={formatDateTime(engine.created_at)} />
              <DetailRow label="ID interno" value={engine.id} />
            </dl>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Cliente propietario</h3>
              {client ? (
                <>
                  <p className="mt-2 text-sm font-medium text-slate-900">{client.name}</p>
                  <p className="text-xs text-slate-500">
                    {client.identification_type} · {client.identification_number}
                  </p>
                  <Link
                    to={`/clients/${client.id}`}
                    className="mt-3 inline-flex text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Ver cliente →
                  </Link>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No fue posible cargar el cliente.</p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Acciones</h3>
              <div className="mt-3 space-y-2">
                <Link
                  to={`/orders/new?engine_id=${engine.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Crear orden de reparación
                  <span className="text-slate-400">→</span>
                </Link>
                <Link
                  to={`/orders?engine_id=${engine.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Ver órdenes del motor
                  <span className="text-slate-400">→</span>
                </Link>
                <Link
                  to={`/engines/${engine.id}/edit`}
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
        <Alert variant="warning">No se encontró el motor solicitado.</Alert>
      )}
    </div>
  )
}
