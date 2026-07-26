import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  assertConsentTokenConfigured,
  grantedConsent,
  signConfirmToken,
  verifyConfirmToken,
} from '@/lib/consent-token'

const NOW = 1_784_000_000 // fixed clock; the token embeds an absolute expiry
const DAY = 24 * 60 * 60

beforeAll(() => {
  vi.stubEnv('CONSENT_TOKEN_SECRET', 'test-secret')
})

afterAll(() => {
  vi.unstubAllEnvs()
})

describe('confirm token', () => {
  it('round-trips the person and the exact consent set', () => {
    const t = signConfirmToken('abc123', { mad: true, group: false }, NOW)
    expect(verifyConfirmToken(t, NOW)).toEqual({
      publicId: 'abc123',
      consent: { mad: true, group: false },
    })
  })

  it('carries both consents when both were ticked', () => {
    const t = signConfirmToken('abc123', { mad: true, group: true }, NOW)
    expect(verifyConfirmToken(t, NOW)?.consent).toEqual({ mad: true, group: true })
  })

  it('refuses to escalate a Mad-only tick into Mad + group', () => {
    // THE attack this token exists to stop. If the consent set were taken from a
    // form field or query param instead of the signature, anyone holding the
    // link could confirm more than the person actually ticked, and the stored
    // record would be a signed claim about a set nothing vouches for.
    const real = signConfirmToken('abc123', { mad: true, group: false }, NOW)
    const mac = real.slice(real.lastIndexOf('.'))
    const escalated = Buffer.from('abc123:11:' + (NOW + 7 * DAY)).toString('base64url') + mac
    expect(verifyConfirmToken(escalated, NOW)).toBeNull()
  })

  it('refuses a token repointed at someone else', () => {
    const mine = signConfirmToken('my-id', { mad: true, group: false }, NOW)
    const mac = mine.slice(mine.lastIndexOf('.'))
    const swapped = Buffer.from('victim-id:10:' + (NOW + 7 * DAY)).toString('base64url') + mac
    expect(verifyConfirmToken(swapped, NOW)).toBeNull()
  })

  it('expires after 7 days', () => {
    const t = signConfirmToken('abc123', { mad: true, group: false }, NOW)
    expect(verifyConfirmToken(t, NOW + 7 * DAY - 60)).not.toBeNull()
    expect(verifyConfirmToken(t, NOW + 7 * DAY + 1)).toBeNull()
  })

  it('refuses a token that grants nothing', () => {
    const t = signConfirmToken('abc123', { mad: false, group: false }, NOW)
    expect(verifyConfirmToken(t, NOW)).toBeNull()
  })

  it('refuses a tampered signature', () => {
    const t = signConfirmToken('abc123', { mad: true, group: false }, NOW)
    expect(verifyConfirmToken(t.slice(0, -2) + 'xx', NOW)).toBeNull()
  })

  it('refuses a token signed with a different key', () => {
    const t = signConfirmToken('abc123', { mad: true, group: false }, NOW)
    vi.stubEnv('CONSENT_TOKEN_SECRET', 'other-secret')
    expect(verifyConfirmToken(t, NOW)).toBeNull()
    vi.stubEnv('CONSENT_TOKEN_SECRET', 'test-secret')
  })

  it('refuses malformed input without throwing', () => {
    expect(verifyConfirmToken('', NOW)).toBeNull()
    expect(verifyConfirmToken(undefined, NOW)).toBeNull()
    expect(verifyConfirmToken('no-dot', NOW)).toBeNull()
    expect(verifyConfirmToken('.leading', NOW)).toBeNull()
    expect(verifyConfirmToken('trailing.', NOW)).toBeNull()
    expect(verifyConfirmToken('bm90LWJhc2U2NA.zzz', NOW)).toBeNull()
  })

  it('refuses to sign with no secret (no empty-key HMAC)', () => {
    vi.stubEnv('CONSENT_TOKEN_SECRET', '')
    expect(() => signConfirmToken('abc', { mad: true, group: false }, NOW)).toThrow('consent-token')
    expect(() => assertConsentTokenConfigured()).toThrow('consent-token')
    vi.stubEnv('CONSENT_TOKEN_SECRET', 'test-secret')
  })

  it('does NOT fall back to the Supabase service-role key', () => {
    // Signing consent with the database god-credential would let anyone who can
    // read that key forge a consent record, and would make the key un-rotatable:
    // rotating it after a leak would silently kill every live confirm link.
    vi.stubEnv('CONSENT_TOKEN_SECRET', '')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'db-god-key')
    expect(() => assertConsentTokenConfigured()).toThrow('CONSENT_TOKEN_SECRET')
    vi.stubEnv('CONSENT_TOKEN_SECRET', 'test-secret')
  })
})

// The confirm page shows checkboxes, so the consent set now arrives from a FORM —
// and a form can be tampered with. This is the gate that keeps the form from
// widening what the token vouches for.
describe('grantedConsent (the checkbox gate)', () => {
  const claim = (mad: boolean, group: boolean) => ({ publicId: 'p1', consent: { mad, group } })

  it('grants exactly what was ticked, when the token allows it', () => {
    expect(grantedConsent(claim(true, true), ['mad'])).toEqual({ mad: true, group: false })
    expect(grantedConsent(claim(true, true), ['mad', 'group'])).toEqual({ mad: true, group: true })
  })

  it('lets someone untick and take less than they asked for', () => {
    // A downgrade is the person changing their mind. Allowed.
    expect(grantedConsent(claim(true, true), ['group'])).toEqual({ mad: false, group: true })
    expect(grantedConsent(claim(true, true), [])).toEqual({ mad: false, group: false })
  })

  it('refuses to grant a consent the token does not carry', () => {
    // THE attack: the token says Mad only, but the submitted form claims both.
    // A forwarded link must not become a way to sign someone up for more.
    expect(grantedConsent(claim(true, false), ['mad', 'group'])).toEqual({ mad: true, group: false })
    expect(grantedConsent(claim(false, true), ['mad', 'group'])).toEqual({ mad: false, group: true })
  })

  it('ignores junk field values', () => {
    expect(grantedConsent(claim(true, true), ['mad', 'admin', 'true', ''])).toEqual({ mad: true, group: false })
  })
})
