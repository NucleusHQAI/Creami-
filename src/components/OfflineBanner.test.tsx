import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OfflineBanner } from '@/components/OfflineBanner'

describe('OfflineBanner', () => {
  it('stays hidden while online', () => {
    render(<OfflineBanner isOnline pendingCount={0} />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('explains saved data and queued changes while offline', () => {
    render(<OfflineBanner isOnline={false} pendingCount={3} />)

    expect(screen.getByRole('status')).toHaveTextContent('Offline — showing saved recipes')
    expect(screen.getByRole('status')).toHaveTextContent(
      "3 changes will sync when you're back online",
    )
  })
})
