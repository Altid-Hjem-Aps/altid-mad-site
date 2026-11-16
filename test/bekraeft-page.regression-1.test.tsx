import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Regression: ISSUE-001 — on the retired site the confirmation page's button said
// "Gå til altidmad.dk" but its href "/" redirects to altidhjem.dk.
// Found by /qa on 2026-11-16
// Report: .gstack/qa-reports/qa-report-localhost-2026-11-16.md

process.env.CONSENT_TOKEN_SECRET = 'test-secret-for-bekraeft-regression'
process.env.SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key'

vi.mock('next/headers', () => ({ cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }) }))
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error(`NEXT_REDIRECT:${url}`) } }))
vi.mock('@/lib/db', () => ({ redeemConsentToken: vi.fn(), isConfirmTokenRedeemed: vi.fn() }))
vi.mock('@/lib/amplitude.server', () => ({ trackServer: vi.fn(), flushAmplitude: vi.fn(() => ({ promise: Promise.resolve() })) }))
vi.mock('next/server', () => ({ after: vi.fn() }))

import BekraeftPage from '@/app/bekraeft/page'
import { CONFIRM_EXPIRED_BODY, CONFIRM_HOME_CTA } from '@/lib/copy'
import { RETIRED_EXPIRED_BODY } from '@/lib/retire'

const ORIGINAL = process.env.SITE_RETIRED
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.SITE_RETIRED
  else process.env.SITE_RETIRED = ORIGINAL
})

async function renderDone() {
  render(await BekraeftPage({ searchParams: Promise.resolve({ state: 'done' }) }))
}

describe('/bekraeft home button', () => {
  it('names and links altidhjem.dk while the site is retired', async () => {
    process.env.SITE_RETIRED = '1'
    await renderDone()
    expect(screen.getByRole('link', { name: 'Gå til altidhjem.dk' })).toHaveAttribute('href', 'https://www.altidhjem.dk/')
    expect(screen.queryByRole('link', { name: CONFIRM_HOME_CTA })).toBeNull()
  })

  it('is unchanged while the site is live', async () => {
    delete process.env.SITE_RETIRED
    await renderDone()
    expect(screen.getByRole('link', { name: CONFIRM_HOME_CTA })).toHaveAttribute('href', '/')
  })
})

// Regression: ISSUE-004 — the expired-link screen told people to sign up again (the waitlist is
// closed while retired), and the tab said "Skriv dig på ventelisten".
describe('/bekraeft expired link', () => {
  it('says the waitlist is closed and points to the app while retired', async () => {
    process.env.SITE_RETIRED = '1'
    render(await BekraeftPage({ searchParams: Promise.resolve({}) }))
    expect(screen.getByText(RETIRED_EXPIRED_BODY)).toBeInTheDocument()
    expect(screen.queryByText(CONFIRM_EXPIRED_BODY)).toBeNull()
  })

  it('keeps the old text while live', async () => {
    delete process.env.SITE_RETIRED
    render(await BekraeftPage({ searchParams: Promise.resolve({}) }))
    expect(screen.getByText(CONFIRM_EXPIRED_BODY)).toBeInTheDocument()
  })

  it('titles the tab "Altid Mad" while retired', async () => {
    process.env.SITE_RETIRED = '1'
    vi.resetModules()
    const mod = await import('@/app/bekraeft/page')
    expect((mod as unknown as { metadata: { title?: string } }).metadata.title).toBe('Altid Mad')
  })
})
