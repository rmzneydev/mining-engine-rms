import type { ReactNode } from 'react'

export type AlertVariant = 'error' | 'success' | 'info' | 'warning'

const STYLES: Record<AlertVariant, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  info: 'border-sky-200 bg-sky-50 text-sky-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
}

interface AlertProps {
  variant?: AlertVariant
  children: ReactNode
  onClose?: () => void
}

export function Alert({ variant = 'error', children, onClose }: AlertProps) {
  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-lg border px-4 py-3 text-sm ${STYLES[variant]}`}
      role="alert"
    >
      <div className="space-y-1">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="opacity-60 transition hover:opacity-100"
          aria-label="Cerrar"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      )}
    </div>
  )
}
