import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert } from '../components/Alert'
import { FormField } from '../components/FormField'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { fetchClients } from '../lib/clients'
import { fetchEngines } from '../lib/engines'
import { createOrder } from '../lib/orders'
import { ApiError, errorMessage } from '../lib/http'
import { localInputToIso } from '../lib/format'
import { inputClass, selectClass, textareaClass } from '../lib/styles'
import type { Client, Engine, RepairOrderInput } from '../types'

interface FormState {
  engine_id: string
  problem_description: string
  technical_diagnosis: string
  work_performed: string
  technician_name: string
  estimated_delivery: string
  observations: string
}

export function OrderCreatePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [form, setForm] = useState<FormState>({
    engine_id: searchParams.get('engine_id') ?? '',
    problem_description: '',
    technical_diagnosis: '',
    work_performed: '',
    technician_name: '',
    estimated_delivery: '',
    observations: '',
  })
  const [clients, setClients] = useState<Client[]>([])
  const [engines, setEngines] = useState<Engine[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false

    Promise.all([fetchClients(), fetchEngines()])
      .then(([clientList, engineList]) => {
        if (cancelled) return
        setClients(clientList)
        setEngines(engineList)
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

  const selectedEngine = engines.find((engine) => engine.id === form.engine_id) ?? null

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (!form.engine_id) errors.engine_id = 'Selecciona el motor a reparar.'
    if (!form.problem_description.trim()) {
      errors.problem_description = 'Describe el problema reportado.'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!validate()) return

    const payload: RepairOrderInput = {
      engine_id: form.engine_id,
      problem_description: form.problem_description.trim(),
      technical_diagnosis: form.technical_diagnosis.trim() || null,
      work_performed: form.work_performed.trim() || null,
      technician_name: form.technician_name.trim() || null,
      estimated_delivery: localInputToIso(form.estimated_delivery),
      observations: form.observations.trim() || null,
    }

    setSubmitting(true)
    try {
      const created = await createOrder(payload)
      navigate(`/orders/${created.id}`, {
        replace: true,
        state: { flash: `Orden ${created.order_number} creada.` },
      })
    } catch (err) {
      if (err instanceof ApiError && err.errors?.length) {
        const mapped: Record<string, string> = {}
        err.errors.forEach((item) => {
          mapped[item.field] = item.message
        })
        setFieldErrors(mapped)
      }
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <Loader label="Cargando datos..." />
  }

  const activeEngines = engines.filter((engine) => engine.is_active)

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Nueva orden de reparación"
        description="Registra el ingreso de un motor al taller."
        actions={
          <Link
            to="/orders"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </Link>
        }
      />

      {error && (
        <div className="mb-5">
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </div>
      )}

      {activeEngines.length === 0 && (
        <div className="mb-5">
          <Alert variant="warning">
            No hay motores activos disponibles. Primero{' '}
            <Link to="/clients/new" className="font-semibold underline">
              registra un cliente
            </Link>{' '}
            y luego{' '}
            <Link to="/engines/new" className="font-semibold underline">
              un motor
            </Link>
            .
          </Alert>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Equipo</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Motor" htmlFor="engine_id" required error={fieldErrors.engine_id}>
              <select
                id="engine_id"
                value={form.engine_id}
                onChange={(event) => update('engine_id', event.target.value)}
                className={selectClass}
              >
                <option value="">Selecciona un motor</option>
                {activeEngines.map((engine) => (
                  <option key={engine.id} value={engine.id}>
                    {engine.serial_number} · {engine.manufacturer} {engine.model}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Técnico responsable"
              htmlFor="technician_name"
              error={fieldErrors.technician_name}
              hint="Opcional"
            >
              <input
                id="technician_name"
                value={form.technician_name}
                onChange={(event) => update('technician_name', event.target.value)}
                className={inputClass}
                placeholder="Nombre del técnico"
              />
            </FormField>
          </div>

          {selectedEngine && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <p className="font-medium text-slate-900">
                Cliente: {clientNames.get(selectedEngine.client_id) ?? '—'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {selectedEngine.serial_number} · {selectedEngine.manufacturer}{' '}
                {selectedEngine.model} · {selectedEngine.power_capacity}
              </p>
            </div>
          )}
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-5">
          <h3 className="text-sm font-semibold text-slate-900">Diagnóstico y trabajo</h3>

          <FormField
            label="Problema reportado"
            htmlFor="problem_description"
            required
            error={fieldErrors.problem_description}
          >
            <textarea
              id="problem_description"
              value={form.problem_description}
              onChange={(event) => update('problem_description', event.target.value)}
              className={textareaClass}
              placeholder="Descripción del fallo reportado por el cliente"
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Diagnóstico técnico"
              htmlFor="technical_diagnosis"
              error={fieldErrors.technical_diagnosis}
              hint="Opcional"
            >
              <textarea
                id="technical_diagnosis"
                value={form.technical_diagnosis}
                onChange={(event) => update('technical_diagnosis', event.target.value)}
                className={textareaClass}
                placeholder="Hallazgos del diagnóstico"
              />
            </FormField>

            <FormField
              label="Trabajo realizado"
              htmlFor="work_performed"
              error={fieldErrors.work_performed}
              hint="Opcional"
            >
              <textarea
                id="work_performed"
                value={form.work_performed}
                onChange={(event) => update('work_performed', event.target.value)}
                className={textareaClass}
                placeholder="Actividades ejecutadas"
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Entrega estimada"
              htmlFor="estimated_delivery"
              error={fieldErrors.estimated_delivery}
              hint="Opcional"
            >
              <input
                id="estimated_delivery"
                type="datetime-local"
                value={form.estimated_delivery}
                onChange={(event) => update('estimated_delivery', event.target.value)}
                className={inputClass}
              />
            </FormField>

            <FormField
              label="Observaciones"
              htmlFor="observations"
              error={fieldErrors.observations}
              hint="Opcional"
            >
              <input
                id="observations"
                value={form.observations}
                onChange={(event) => update('observations', event.target.value)}
                className={inputClass}
                placeholder="Notas adicionales"
              />
            </FormField>
          </div>
        </section>

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
          <Link
            to="/orders"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={submitting || activeEngines.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
            )}
            Crear orden
          </button>
        </div>
      </form>
    </div>
  )
}
