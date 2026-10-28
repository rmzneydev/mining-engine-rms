import { Button } from './Button'

interface PaginationProps {
  page: number
  pageSize: number
  count: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, pageSize, count, onPageChange }: PaginationProps) {
  const hasPrevious = page > 1
  const hasNext = count === pageSize

  if (!hasPrevious && !hasNext) return null

  return (
    <div className="flex items-center justify-between gap-4 border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
      <span>
        Página {page} · {count} resultado{count === 1 ? '' : 's'}
      </span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          disabled={!hasPrevious}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1.5"
        >
          Anterior
        </Button>
        <Button
          variant="secondary"
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5"
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}
