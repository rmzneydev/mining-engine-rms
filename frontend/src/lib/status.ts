import type { RepairOrderStatus } from '../types'

export const STATUSES: RepairOrderStatus[] = [
  'received',
  'diagnosing',
  'waiting_approval',
  'repairing',
  'testing',
  'finished',
  'delivered',
]

export const STATUS_LABELS: Record<RepairOrderStatus, string> = {
  received: 'Recibido',
  diagnosing: 'En diagnóstico',
  waiting_approval: 'Esperando aprobación',
  repairing: 'En reparación',
  testing: 'En pruebas',
  finished: 'Finalizado',
  delivered: 'Entregado',
}

export const STATUS_BADGE_CLASSES: Record<RepairOrderStatus, string> = {
  received: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  diagnosing: 'bg-sky-100 text-sky-700 ring-sky-600/20',
  waiting_approval: 'bg-amber-100 text-amber-800 ring-amber-600/20',
  repairing: 'bg-orange-100 text-orange-800 ring-orange-600/20',
  testing: 'bg-violet-100 text-violet-700 ring-violet-600/20',
  finished: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
  delivered: 'bg-teal-100 text-teal-800 ring-teal-600/20',
}

export const ALLOWED_TRANSITIONS: Record<RepairOrderStatus, RepairOrderStatus[]> = {
  received: ['diagnosing'],
  diagnosing: ['waiting_approval', 'repairing'],
  waiting_approval: ['repairing'],
  repairing: ['testing'],
  testing: ['finished', 'repairing'],
  finished: ['delivered'],
  delivered: [],
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status as RepairOrderStatus] ?? status
}

export function statusBadgeClass(status: string): string {
  return STATUS_BADGE_CLASSES[status as RepairOrderStatus] ?? 'bg-slate-100 text-slate-700'
}
