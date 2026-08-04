import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/bekraeft/route'
import { signConfirmToken } from '@/lib/consent-token'

// Pins the REAL Set-Cookie headers, no mocks. Next's ResponseCookies is keyed
// by cookie NAME, so a second cookies.set for am_confirm (the legacy Path=/
// expiry) silently REPLACED the token cookie — every fresh confirmation link
// landed on the expired screen. Caught in live QA 4 Aug; the legacy expiry is
// now a raw header append, and these tests fail if anyone folds it back in.

process.env.CONSENT_TOKEN_SECRET = 'test-secret-for-bekraeft-route'

const PUBLIC_ID = '242eba51-9c3f-49ab-a8f6-373a299169e8'

function get(token?: string) {
  const url = new URL('https://altidmad.dk/api/bekraeft')
  if (token) url.searchParams.set('t', token)
  return GET(new NextRequest(url))
}

describe('/api/bekraeft cookie headers', () => {
  it('valid token: BOTH the scoped token cookie AND the legacy expiry survive', () => {
    const token = signConfirmToken(PUBLIC_ID, { mad: true, group: true }, Date.now() / 1000)
    const res = get(token)
    const cookies = res.headers.getSetCookie()

    expect(res.status).toBe(302)
    const tokenCookie = cookies.find((c) => c.includes('Path=/bekraeft'))
    const legacyExpiry = cookies.find((c) => c.includes('Path=/;') || c.endsWith('Path=/'))
    expect(tokenCookie).toBeTruthy()
    expect(tokenCookie).toContain(`am_confirm=${token}`)
    expect(tokenCookie).toContain('HttpOnly')
    expect(tokenCookie).toContain('Max-Age=1800')
    expect(legacyExpiry).toBeTruthy()
    expect(legacyExpiry).toContain('am_confirm=;')
    expect(legacyExpiry).toContain('Max-Age=0')
    // The regression: only one header surviving means the jar clobbered by name.
    expect(cookies).toHaveLength(2)
  })

  it('invalid token: scoped expiry AND legacy expiry both go out', () => {
    const res = get('mangled.token')
    const cookies = res.headers.getSetCookie()

    expect(res.status).toBe(302)
    expect(cookies).toHaveLength(2)
    expect(cookies.some((c) => c.startsWith('am_confirm=;') && c.includes('Path=/bekraeft') && c.includes('Max-Age=0'))).toBe(true)
    expect(cookies.some((c) => c.startsWith('am_confirm=;') && c.includes('Path=/;') && c.includes('Max-Age=0'))).toBe(true)
  })

  it('no token at all: no cookies planted, straight to the page', () => {
    const res = get()
    expect(res.status).toBe(302)
    // The !claim branch runs for a missing token too — both expiries, no plant.
    expect(res.headers.getSetCookie().every((c) => !c.includes('Max-Age=1800'))).toBe(true)
  })

  it('responses are never cacheable (a cached Set-Cookie hands identity to the next visitor)', () => {
    const token = signConfirmToken(PUBLIC_ID, { mad: true, group: false }, Date.now() / 1000)
    expect(get(token).headers.get('Cache-Control')).toBe('private, no-store')
  })
})
