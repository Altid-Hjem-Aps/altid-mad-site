import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import ResetScrollOnLoad from '@/components/ResetScrollOnLoad'

// "Hent appen" on a page without badges goes to /#hent-appen: resetting the
// scroll there would leave the person at the top, away from the badges.
afterEach(() => {
  window.location.hash = ''
  vi.unstubAllGlobals()
})

describe('ResetScrollOnLoad', () => {
  it('lands a plain load at the top', () => {
    const scrollTo = vi.fn()
    vi.stubGlobal('scrollTo', scrollTo)
    render(<ResetScrollOnLoad />)
    expect(scrollTo).toHaveBeenCalledWith(0, 0)
  })

  it('leaves the jump alone when the URL names a section', () => {
    const scrollTo = vi.fn()
    vi.stubGlobal('scrollTo', scrollTo)
    window.location.hash = '#hent-appen'
    render(<ResetScrollOnLoad />)
    expect(scrollTo).not.toHaveBeenCalled()
  })
})
