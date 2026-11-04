import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// The click count behind the store badges, through the real route. Boundaries
// faked: Supabase (the limiter) and the Amplitude SDK.

const limits = new Map<string, number>()
let limiterDown = false
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: (_fn: string, args: { p_key: string; p_max: number }) => {
      if (limiterDown) return Promise.resolve({ data: null, error: { message: 'down' } })
      const n = (limits.get(args.p_key) ?? 0) + 1
      limits.set(args.p_key, n)
      return Promise.resolve({ data: n > args.p_max, error: null })
    },
  }),
}))

const amplitudeTrack = vi.fn()
vi.mock('@amplitude/analytics-node', () => ({
  init: vi.fn(),
  track: vi.fn(),
  flush: vi.fn(),
  identify: vi.fn(),
  Identify: class {},
  createInstance: () => ({
    init: () => ({ promise: Promise.resolve() }),
    track: (...args: unknown[]) => {
      amplitudeTrack(...args)
      return { promise: Promise.resolve({ code: 200, message: 'ok' }) }
    },
    flush: vi.fn(),
  }),
}))

function click(body: string, type = 'application/json') {
  return new NextRequest('https://altidmad.dk/api/store-click', {
    method: 'POST',
    headers: { 'content-type': type, 'x-forwarded-for': '10.1.1.1' },
    body,
  })
}

const VALID = JSON.stringify({ store: 'play', position: 'hero' })

beforeEach(() => {
  limits.clear()
  limiterDown = false
  amplitudeTrack.mockClear()
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-test-key')
  vi.stubEnv('NEXT_PUBLIC_AMPLITUDE_API_KEY', 'amp-test')
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('POST /api/store-click', () => {
  it('counts one anonymous event with the store and position', async () => {
    const { POST } = await import('@/app/api/store-click/route')
    expect((await POST(click(VALID))).status).toBe(204)
    expect(amplitudeTrack).toHaveBeenCalledWith(
      'Store Badge Clicked',
      { store: 'play', position: 'hero' },
      { device_id: expect.any(String) },
    )
  })

  it.each([
    ['an unknown store', JSON.stringify({ store: 'windows', position: 'hero' }), 400],
    ['an unknown position', JSON.stringify({ store: 'play', position: 'nav' }), 400],
    ['a JSON null', 'null', 400],
    ['a body over the cap', JSON.stringify({ store: 'play', position: 'hero', pad: 'x'.repeat(600) }), 413],
  ])('refuses %s without counting', async (_name, body, status) => {
    const { POST } = await import('@/app/api/store-click/route')
    expect((await POST(click(body))).status).toBe(status)
    expect(amplitudeTrack).not.toHaveBeenCalled()
  })

  it('refuses anything but JSON, so a cross-site form cannot count', async () => {
    const { POST } = await import('@/app/api/store-click/route')
    expect((await POST(click(VALID, 'text/plain'))).status).toBe(415)
    expect(amplitudeTrack).not.toHaveBeenCalled()
  })

  it('stops counting one IP at 60 an hour', async () => {
    const { POST } = await import('@/app/api/store-click/route')
    limits.set('store-click:10.1.1.1', 60)
    expect((await POST(click(VALID))).status).toBe(429)
    expect(amplitudeTrack).not.toHaveBeenCalled()
  })

  it('does not count, and says so, when the limiter is down', async () => {
    const { POST } = await import('@/app/api/store-click/route')
    limiterDown = true
    expect((await POST(click(VALID))).status).toBe(502)
    expect(amplitudeTrack).not.toHaveBeenCalled()
    expect(console.error).toHaveBeenCalled()
  })
})
