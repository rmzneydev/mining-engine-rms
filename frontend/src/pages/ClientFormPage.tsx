import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alert } from '../components/Alert'
import { FormField } from '../components/FormField'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { createClient, fetchClient, updateClient } from '../lib/clients'
import { ApiError, errorMessage } from '../lib/http'
import { inputClass, selectClass } from '../lib/styles'
import type { ClientInput } from '../types'

const IDENTIFICATION_TYPES = [
  'NIT',
  'Cédula de ciudadanía',
  'Cédula de extranjería',
  'Pasaporte',
]

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface FormState {
  name: string
  identification_type: string
  identification_number: string
  email: string
  is_active: boolean
}

const EMPTY_FORM: FormState = {
  name: '',
  identification_type: 'NIT',
  identification_number: '',
  email: '',
  is_active: true,
}

export function ClientFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!id) return
    let cancelled = false

    fetchClient(id)
      .then((client) => {
        if (cancelled) return
        setForm({
          name: client.name,
          identification_type: client.identification_type,
          identification_number: client.identification_number,
          email: client.email ?? '',
          is_active: client.is_active,
        })
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
    if (!form.name.trim()) errors.name = 'El nombre es obligatorio.'
    if (!form.identification_type.trim()) {
      errors.identification_type = 'Selecciona un tipo de identificación.'
    }
    if (!form.identification_number.trim()) {
      errors.identification_number = 'El número de identificación es obligatorio.'
    }
    if (form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())) {
      errors.email = 'Ingresa un correo válido.'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!validate()) return

    const payload: ClientInput = {
      name: form.name.trim(),
      identification_type: form.identification_type,
      identification_number: form.identification_number.trim(),
      email: form.email.trim() || null,
      is_active: form.is_active,
    }

    setSubmitting(true)
    try {
      if (isEdit && id) {
        const updated = await updateClient(id, payload)
        navigate(`/clients/${updated.id}`, { replace: true, state: { flash: 'Cliente actualizado.' } })
      } else {
        const created = await createClient(payload)
        navigate(`/clients/${created.id}`, { replace: true, state: { flash: 'Cliente creado.' } })
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
    return <Loader label="Cargando cliente..." />
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={isEdit ? 'Editar cliente' : 'Nuevo cliente'}
        description={
          isEdit
            ? 'Actualiza los datos de contacto e identificación del cliente.'
            : 'Registra una empresa o persona para asociarle motores.'
        }
        actions={
          <Link
            to={isEdit && id ? `/clients/${id}` : '/clients'}
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

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField label="Nombre o razón social" htmlFor="name" required error={fieldErrors.name}>
              <input
                id="name"
                value={form.name}
                onChange={(event) => update('name', event.target.value)}
                className={inputClass}
                placeholder="Minera Sur SAS"
              />
            </FormField>
          </div>

          <FormField
            label="Tipo de identificación"
            htmlFor="identification_type"
            required
            error={fieldErrors.identification_type}
          >
            <select
              id="identification_type"
              value={form.identification_type}
              onChange={(event) => update('identification_type', event.target.value)}
              className={selectClass}
            >
              {IDENTIFICATION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Número de identificación"
            htmlFor="identification_number"
            required
            error={fieldErrors.identification_number}
          >
            <input
              id="identification_number"
              value={form.identification_number}
              onChange={(event) => update('identification_number', event.target.value)}
              className={inputClass}
              placeholder="900123456-7"
            />
          </FormField>

          <div className="sm:col-span-2">
            <FormField
              label="Correo electrónico"
              htmlFor="email"
              error={fieldErrors.email}
              hint="Opcional. Se usa como contacto principal."
            >
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => update('email', event.target.value)}
                className={inputClass}
                placeholder="contacto@empresa.com"
              />
            </FormField>
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) => update('is_active', event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
          />
          <span className="text-sm text-slate-700">
            Cliente activo
            <span className="block text-xs text-slate-500">
              Los clientes inactivos no deberían recibir nuevas órdenes.
            </span>
          </span>
        </label>

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
          <Link
            to={isEdit && id ? `/clients/${id}` : '/clients'}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
            )}
            {isEdit ? 'Guardar cambios' : 'Crear cliente'}
          </button>
        </div>
      </form>
    </div>
  )
}
