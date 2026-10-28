import { describe, expect, it } from 'vitest'
import {
  ALLOWED_TRANSITIONS,
  STATUSES,
  statusBadgeClass,
  statusLabel,
} from './status'

describe('repair order status', () => {
  it('keeps the seven business states in order', () => {
    expect(STATUSES).toEqual([
      'received',
      'diagnosing',
      'waiting_approval',
      'repairing',
      'testing',
      'finished',
      'delivered',
    ])
  })

  it('maps every state to a human readable label', () => {
    STATUSES.forEach((status) => {
      expect(statusLabel(status)).not.toBe(status)
    })
    expect(statusLabel('repairing')).toBe('En reparación')
  })

  it('does not allow transitions out of delivered', () => {
    expect(ALLOWED_TRANSITIONS.delivered).toEqual([])
  })

  it('allows repairing again when testing fails', () => {
    expect(ALLOWED_TRANSITIONS.testing).toContain('repairing')
  })

  it('falls back gracefully for unknown backend values', () => {
    expect(statusLabel('unexpected')).toBe('unexpected')
    expect(statusBadgeClass('unexpected')).toContain('bg-slate-100')
  })
})
