// @vitest-environment node
// The Android counts against the REAL Supabase client, with only fetch
// stubbed: the other tests script the client and compare strings, so this is
// the one place that pins the HTTP side. What PostgREST is asked (method,
// table, filters, the exact-count preference) and how the answer is read (the
// count in the Content-Range header, a response without one refused).
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { countMadTestAndroid, getMadTestAndroidPlace } from '@/lib/db'

type Sent = { url: string; method: string; prefer: string | null }
const sent: Sent[] = []
// The Content-Range to answer a request with, chosen from its URL (null: no
// header), and the status of every answer.
let contentRange: (url: URL) => string | null = () => '*/0'
let status = 200

function headerOf(init: RequestInit | undefined, name: string): string | null {
  return new Headers(init?.headers).get(name)
}

beforeAll(() => {
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-test-key')
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input)
    sent.push({ url, method: init?.method ?? 'GET', prefer: headerOf(init, 'Prefer') })
    const range = contentRange(new URL(url))
    return new Response(null, { status, headers: range === null ? {} : { 'Content-Range': range } })
  })
})
afterAll(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})
beforeEach(() => {
  sent.length = 0
  contentRange = () => '*/0'
  status = 200
})

describe('countMadTestAndroid over HTTP', () => {
  it('one HEAD request for an exact count of the Android rows, read from Content-Range', async () => {
    contentRange = () => '*/42'
    expect(await countMadTestAndroid()).toBe(42)

    expect(sent).toHaveLength(1)
    const url = new URL(sent[0].url)
    expect(sent[0].method).toBe('HEAD')
    expect(url.origin + url.pathname).toBe('https://example.supabase.co/rest/v1/mad_test_optin')
    expect(url.searchParams.get('select')).toBe('public_id')
    expect(url.searchParams.get('device')).toBe('eq.android')
    expect(sent[0].prefer).toContain('count=exact')
  })

  it('a response without a count: the error path, never 0', async () => {
    contentRange = () => null
    await expect(countMadTestAndroid()).rejects.toThrow('mad_test_optin Android count: not a count: null')
  })

  it('a count that is not a number (NaN after parsing): the error path', async () => {
    contentRange = () => '*/abc'
    await expect(countMadTestAndroid()).rejects.toThrow('mad_test_optin Android count: not a count: NaN')
  })

  it('a server error: the error path', async () => {
    status = 500
    contentRange = () => null
    await expect(countMadTestAndroid()).rejects.toThrow('mad_test_optin count failed')
  })
})

describe('getMadTestAndroidPlace over HTTP', () => {
  // As PostgREST returns created_at: microseconds and a +00:00 offset.
  const CREATED_AT = '2026-10-02T10:00:00.123456+00:00'
  const ID = '242eba51-9c3f-49ab-a8f6-373a299169e8'

  it('two exact counts, the timestamp passed back unchanged and + sent as %2B; the place is 1 + both', async () => {
    contentRange = (url) => (url.searchParams.get('created_at')?.startsWith('lt.') ? '*/7' : '*/1')
    expect(await getMadTestAndroidPlace(ID, CREATED_AT)).toBe(9)

    expect(sent).toHaveLength(2)
    const urls = sent.map((s) => new URL(s.url))
    const before = urls.find((u) => u.searchParams.get('created_at')?.startsWith('lt.'))!
    const tied = urls.find((u) => u.searchParams.get('created_at')?.startsWith('eq.'))!
    expect(before.searchParams.get('device')).toBe('eq.android')
    expect(before.searchParams.get('created_at')).toBe(`lt.${CREATED_AT}`)
    expect(before.searchParams.has('public_id')).toBe(false)
    expect(tied.searchParams.get('device')).toBe('eq.android')
    expect(tied.searchParams.get('created_at')).toBe(`eq.${CREATED_AT}`)
    expect(tied.searchParams.get('public_id')).toBe(`lt.${ID}`)
    // A raw + in a query string reads as a space on the server: it must go as %2B.
    for (const s of sent) {
      expect(s.url).toContain('%2B00%3A00')
      expect(s.url).not.toMatch(/\+00/)
      expect(s.method).toBe('HEAD')
      expect(s.prefer).toContain('count=exact')
    }
  })

  it.each([
    ['the count before this answer', (url: URL) => (url.searchParams.get('created_at')?.startsWith('lt.') ? null : '*/0'), 'count before this answer'],
    ['the count at the same time', (url: URL) => (url.searchParams.get('created_at')?.startsWith('eq.') ? null : '*/0'), 'count at the same time'],
  ])('a response without %s: the error path, naming that count', async (_, range, which) => {
    contentRange = range
    await expect(getMadTestAndroidPlace(ID, CREATED_AT)).rejects.toThrow(`mad_test_optin ${which}: not a count: null`)
  })
})
