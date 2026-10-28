import { describe, expect, it } from 'vitest'
import {
  formatDate,
  formatDateTime,
  localInputToIso,
  shortId,
  toDateTimeInput,
} from './format'

describe('date helpers', () => {
  it('returns a placeholder for empty or invalid dates', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDateTime(undefined)).toBe('—')
    expect(formatDateTime('not-a-date')).toBe('—')
    expect(toDateTimeInput('not-a-date')).toBe('')
  })

  it('round-trips a datetime-local value', () => {
    const localValue = '2026-03-15T10:30'
    const iso = localInputToIso(localValue)
    expect(iso).not.toBeNull()
    expect(toDateTimeInput(iso)).toBe(localValue)
  })

  it('returns null for an empty datetime input', () => {
    expect(localInputToIso('')).toBeNull()
  })
})

describe('shortId', () => {
  it('shortens user identifiers for the history timeline', () => {
    expect(shortId('12345678-1234-1234-1234-123456789012')).toBe('12345678')
  })

  it('labels missing authors as sistema', () => {
    expect(shortId(null)).toBe('Sistema')
  })
})
