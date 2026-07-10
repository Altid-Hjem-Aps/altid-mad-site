import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, afterEach } from 'vitest'

vi.mock('@amplitude/analytics-browser', () => ({ track: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
// The real player is a web component loaded via next/dynamic; a probe div
// exposing the props is enough to pin which asset each breakpoint serves.
vi.mock('@mux/mux-player-react', () => ({
  default: (props: Record<string, unknown>) => (
    <div
      data-testid="mux-player"
      data-playback-id={props.playbackId as string}
      data-poster={props.poster as string}
      data-video-id={(props.metadata as { video_id: string }).video_id}
    />
  ),
}))

import FounderVideo from '@/components/sections/FounderVideo'

const SQUARE = 'p9VDiEQ01T9kj1X1JA00K3IWZ7TX91tG3sgAghtD3xiro'
const WIDE = 'A01Fuk2X9sobmFQEwkkYgCtrm8xoaN4LZoGP4MdimSa00'

// jsdom has no matchMedia; the stub answers every query (wide-frame, touch,
// reduced-motion) with the same `matches`, which is exactly the combination
// each breakpoint case needs: wide viewports are the non-touch default and
// narrow ones the touch default.
function renderAt(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() })
  )
  return render(<FounderVideo />)
}

afterEach(() => vi.unstubAllGlobals())

describe('FounderVideo ratio-matched assets', () => {
  it('serves the 1:1 asset below the sm breakpoint', async () => {
    renderAt(false)
    const player = await waitFor(() => screen.getByTestId('mux-player'))
    expect(player.dataset.playbackId).toBe(SQUARE)
    expect(player.dataset.poster).toContain(SQUARE)
    expect(player.dataset.videoId).toBe('founder-mad-1x1')
  })

  it('serves the 16:9 asset at sm and above', async () => {
    renderAt(true)
    const player = await waitFor(() => screen.getByTestId('mux-player'))
    expect(player.dataset.playbackId).toBe(WIDE)
    expect(player.dataset.poster).toContain(WIDE)
    expect(player.dataset.videoId).toBe('founder-mad-16x9')
  })

  it('falls back to the 16:9 master when matchMedia is unavailable', async () => {
    vi.stubGlobal('matchMedia', undefined)
    render(<FounderVideo />)
    const player = await waitFor(() => screen.getByTestId('mux-player'))
    expect(player.dataset.playbackId).toBe(WIDE)
  })
})
