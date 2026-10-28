import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('renders the localized label for a known status', () => {
    render(<StatusBadge status="waiting_approval" />)
    expect(screen.getByText('Esperando aprobación')).toBeInTheDocument()
  })

  it('renders the raw value for an unknown status', () => {
    render(<StatusBadge status="unknown_status" />)
    expect(screen.getByText('unknown_status')).toBeInTheDocument()
  })
})
