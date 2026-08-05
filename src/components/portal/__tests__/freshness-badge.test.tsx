// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FreshnessBadge } from '../freshness-badge'

const agora = new Date('2026-08-05T12:00:00Z')

describe('FreshnessBadge', () => {
  it('mostra "precisa revisão" quando venceu', () => {
    render(
      <FreshnessBadge
        verifiedAt={new Date('2026-01-01')}
        reviewDueAt={new Date('2026-01-02')}
        now={agora}
      />
    )
    expect(screen.getByText(/precisa revisão/i)).toBeInTheDocument()
  })

  it('mostra "nunca verificado" quando verifiedAt é null', () => {
    render(<FreshnessBadge verifiedAt={null} reviewDueAt={null} now={agora} />)
    expect(screen.getByText(/nunca verificado/i)).toBeInTheDocument()
  })

  it('mostra "verificado" quando está em dia', () => {
    render(
      <FreshnessBadge
        verifiedAt={agora}
        reviewDueAt={new Date('2026-12-01')}
        now={agora}
      />
    )
    expect(screen.getByText(/^verificado$/i)).toBeInTheDocument()
  })
})
