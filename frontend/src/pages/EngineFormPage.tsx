import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Alert } from '../components/Alert'
import { FormField } from '../components/FormField'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { fetchClients } from '../lib/clients'
import { createEngine, fetchEngine, updateEngine } from '../lib/engines'
import { ApiError, errorMessage } from '../lib/http'
import { inputClass, selectClass } from '../lib/styles'
import type { Client, EngineInput } from '../types'

const ENGINE_TYPES = ['Diésel', 'Gasolina', 'Gas natural', 'Eléctrico', 'Híbrido']

interface FormState {
  serial_number: string
  manufacturer: string
  model: string
  engine_type: string
  power_capacity: string
  client_id: string
  is_active: boolean
}

const EMPTY_FORM: FormState = {
  serial_number: '',
  manufacturer: '',
  model: '',
  engine_type: 'Diésel',
  power_capacity: '',
  client_id: '',
  is_active: true,
}

export function EngineFormPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState<FormState>(() => ({
    ...EMPTY_FORM,
    client_id: searchParams.get('client_id') ?? '',
  }))
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false

    Promise.all([fetchClients(), id ? fetchEngine(id) : Promise.resolve(null)])
      .then(([clientList, engine]) => {
        if (cancelled) return
        setClients(clientList)
        if (engine) {
          setForm({
            serial_number: engine.serial_number,
            manufacturer: engine.manufacturer,
            model: engine.model,
            engine_type: engine.engine_type,
            power_capacity: engine.power_capacity,
            client_id: engine.client_id,
            is_active: engine.is_active,
          })
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
    if (!form.serial_number.trim()) errors.serial_number = 'El serial es obligatorio.'
    if (!form.manufacturer.trim()) errors.manufacturer = 'La marca es obligatoria.'
    if (!form.model.trim()) errors.model = 'El modelo es obligatorio.'
    if (!form.engine_type.trim()) errors.engine_type = 'Selecciona un tipo de motor.'
    if (!form.power_capacity.trim()) errors.power_capacity = 'La potencia es obligatoria.'
    if (!form.client_id) errors.client_id = 'Selecciona el cliente propietario.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!validate()) return

    const payload: EngineInput = {
      serial_number: form.serial_number.trim(),
      manufacturer: form.manufacturer.trim(),
      model: form.model.trim(),
      engine_type: form.engine_type,
      power_capacity: form.power_capacity.trim(),
      client_id: form.client_id,
      is_active: form.is_active,
    }

    setSubmitting(true)
    try {
      if (isEdit && id) {
        const updated = await updateEngine(id, payload)
        navigate(`/engines/${updated.id}`, { replace: true, state: { flash: 'Motor actualizado.' } })
      } else {
        const created = await createEngine(payload)
        navigate(`/engines/${created.id}`, { replace: true, state: { flash: 'Motor creado.' } })
      }
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
    return <Loader label="Cargando motor..." />
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={isEdit ? 'Editar motor' : 'Nuevo motor'}
        description={
          isEdit
            ? 'Actualiza las especificaciones del equipo.'
            : 'Registra un motor y asígnalo a un cliente.'
        }
        actions={
          <Link
            to={isEdit && id ? `/engines/${id}` : '/engines'}
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

      {clients.length === 0 && (
        <div className="mb-5">
          <Alert variant="warning">
            No hay clientes registrados. Primero debes{' '}
            <Link to="/clients/new" className="font-semibold underline">
              crear un cliente
            </Link>
            .
          </Alert>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Serial" htmlFor="serial_number" required error={fieldErrors.serial_number}>
            <input
              id="serial_number"
              value={form.serial_number}
              onChange={(event) => update('serial_number', event.target.value)}
              className={inputClass}
              placeholder="SN-157804"
            />
          </FormField>

          <FormField label="Cliente propietario" htmlFor="client_id" required error={fieldErrors.client_id}>
            <select
              id="client_id"
              value={form.client_id}
              onChange={(event) => update('client_id', event.target.value)}
              className={selectClass}
            >
              <option value="">Selecciona un cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Marca" htmlFor="manufacturer" required error={fieldErrors.manufacturer}>
            <input
              id="manufacturer"
              value={form.manufacturer}
              onChange={(event) => update('manufacturer', event.target.value)}
              className={inputClass}
              placeholder="Caterpillar"
            />
          </FormField>

          <FormField label="Modelo" htmlFor="model" required error={fieldErrors.model}>
            <input
              id="model"
              value={form.model}
              onChange={(event) => update('model', event.target.value)}
              className={inputClass}
              placeholder="C15"
            />
          </FormField>

          <FormField label="Tipo de motor" htmlFor="engine_type" required error={fieldErrors.engine_type}>
            <select
              id="engine_type"
              value={form.engine_type}
              onChange={(event) => update('engine_type', event.target.value)}
              className={selectClass}
            >
              {ENGINE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Potencia"
            htmlFor="power_capacity"
            required
            error={fieldErrors.power_capacity}
            hint="Ej. 500 HP o 373 kW"
          >
            <input
              id="power_capacity"
              value={form.power_capacity}
              onChange={(event) => update('power_capacity', event.target.value)}
              className={inputClass}
              placeholder="500 HP"
            />
          </FormField>
        </div>

        <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) => update('is_active', event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
          />
          <span className="text-sm text-slate-700">Motor activo</span>
        </label>

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
          <Link
            to={isEdit && id ? `/engines/${id}` : '/engines'}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={submitting || clients.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
            )}
            {isEdit ? 'Guardar cambios' : 'Crear motor'}
          </button>
        </div>
      </form>
    </div>
  )
}
