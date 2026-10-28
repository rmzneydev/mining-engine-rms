import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">Error 404</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Página no encontrada</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        La dirección que buscas no existe o fue movida.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Volver al dashboard
      </Link>
    </div>
  )
}
