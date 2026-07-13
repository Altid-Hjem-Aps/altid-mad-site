import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// mirrorSignup is the only consent-store on the signup path: the form sends a
// documented marketing consent, the route forwards it, and this is where it is
// written to Supabase. These tests pin (1) that the consent fields land in the
// upserted row and (2) that a not-yet-migrated column can never break a signup.

// Capture every row passed to .upsert() and script the {data,error} each
// upsert resolves to, so we can simulate a missing column.
const upsertedRows: Record<string, unknown>[] = []
let results: Array<{ data: unknown; error: unknown }> = []
// Capture .update() patches (mergeConsent) + the public_id they filter on.
const updatePatches: Array<{ patch: Record<string, unknown>; id: unknown }> = []
let updateResults: Array<{ error: unknown }> = []

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      upsert: (row: Record<string, unknown>) => {
        upsertedRows.push(row)
        return {
          select: () => ({
            maybeSingle: () => Promise.resolve(results.shift() ?? { data: null, error: null }),
          }),
        }
      },
      update: (patch: Record<string, unknown>) => ({
        eq: (_col: string, id: unknown) => {
          updatePatches.push({ patch, id })
          return Promise.resolve(updateResults.shift() ?? { error: null })
        },
      }),
    }),
  }),
}))

// getClient() throws without these — set before the module under test loads.
process.env.SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key'

import { mirrorSignup, mergeConsent } from '@/lib/db'

const CONSENT = { version: '2026-07-13', mad: true, group: false }

describe('mirrorSignup consent storage', () => {
  beforeEach(() => {
    upsertedRows.length = 0
    results = []
  })
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('writes the documented consent fields into the row', async () => {
    results = [{ data: { unsub_token: 'tok' }, error: null }]

    const token = await mirrorSignup('pub-1', {
      email: 'A@Example.com',
      firstName: 'Ann',
      source: 'altid-mad',
      consent: CONSENT,
    })

    expect(token).toBe('tok')
    expect(upsertedRows).toHaveLength(1)
    const row = upsertedRows[0]
    expect(row.marketing_consent_mad).toBe(true)
    expect(row.marketing_consent_group).toBe(false)
    expect(row.consent_version).toBe('2026-07-13')
    expect(row.consent_at).toBe(row.created_at)
  })

  it('coerces missing/odd consent choices to false, never null', async () => {
    results = [{ data: { unsub_token: 't' }, error: null }]

    await mirrorSignup('pub-2', { consent: { version: 'v', mad: undefined, group: 'yes' } as never })

    const row = upsertedRows[0]
    expect(row.marketing_consent_mad).toBe(false)
    expect(row.marketing_consent_group).toBe(false)
  })

  it('omits consent fields entirely when no consent is passed', async () => {
    results = [{ data: { unsub_token: 't' }, error: null }]

    await mirrorSignup('pub-3', { email: 'b@x.dk' })

    const row = upsertedRows[0]
    expect('marketing_consent_mad' in row).toBe(false)
    expect('consent_at' in row).toBe(false)
  })

  it('strips a not-yet-migrated consent column and retries so the signup survives', async () => {
    // First upsert fails naming the missing column (PGRST204 shape); the retry
    // without it succeeds. The signup must still return its token.
    results = [
      { data: null, error: { code: 'PGRST204', message: "Could not find the 'consent_version' column of 'signup' in the schema cache" } },
      { data: { unsub_token: 'tok-after-retry' }, error: null },
    ]

    const token = await mirrorSignup('pub-4', { consent: CONSENT })

    expect(token).toBe('tok-after-retry')
    expect(upsertedRows).toHaveLength(2)
    // Retry row no longer carries the offending column, but keeps the rest.
    expect('consent_version' in upsertedRows[1]).toBe(false)
    expect(upsertedRows[1].marketing_consent_mad).toBe(true)
  })

  it('strips several not-yet-migrated columns across successive retries', async () => {
    // A table missing multiple consent columns errors one at a time (PostgREST
    // names one per response). The loop must strip each in turn and still land
    // the signup — exercises the multi-iteration path, not just a single strip.
    results = [
      { data: null, error: { code: '42703', message: 'column "consent_version" of relation "signup" does not exist' } },
      { data: null, error: { code: '42703', message: 'column "marketing_consent_group" of relation "signup" does not exist' } },
      { data: { unsub_token: 'final' }, error: null },
    ]

    const token = await mirrorSignup('pub-6', { source: 'altid-mad', consent: CONSENT })

    expect(token).toBe('final')
    expect(upsertedRows).toHaveLength(3)
    const finalRow = upsertedRows[2]
    expect('consent_version' in finalRow).toBe(false)
    expect('marketing_consent_group' in finalRow).toBe(false)
    // Columns that were never flagged missing survive.
    expect(finalRow.marketing_consent_mad).toBe(true)
    expect(finalRow.signup_source).toBe('altid-mad')
  })

  it('rethrows a non-column error instead of silently dropping data', async () => {
    results = [{ data: null, error: { code: '57014', message: 'canceling statement due to statement timeout' } }]

    await expect(mirrorSignup('pub-5', { consent: CONSENT })).rejects.toThrow(/timeout/)
    expect(upsertedRows).toHaveLength(1) // no retry on a non-column error
  })
})

describe('mergeConsent (409 re-signup path)', () => {
  beforeEach(() => {
    updatePatches.length = 0
    updateResults = []
  })
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('flags newly-consented brands on the existing row (by email) without downgrading', async () => {
    updateResults = [{ error: null }]
    // Re-signup ticks both boxes; only the TRUE ones are written, plus version/at.
    await mergeConsent('A@Example.com', { version: '2026-07-13', mad: true, group: true })

    expect(updatePatches).toHaveLength(1)
    const { patch, id } = updatePatches[0]
    expect(id).toBe('a@example.com') // lower-cased, keyed on email
    expect(patch.marketing_consent_mad).toBe(true)
    expect(patch.marketing_consent_group).toBe(true)
    expect(patch.consent_version).toBe('2026-07-13')
    expect(typeof patch.consent_at).toBe('string')
  })

  it('only writes the true flags — never sets a flag to false', async () => {
    updateResults = [{ error: null }]
    await mergeConsent('b@x.dk', { version: 'v', mad: false, group: true })

    const { patch } = updatePatches[0]
    expect('marketing_consent_mad' in patch).toBe(false) // false is not written (no downgrade)
    expect(patch.marketing_consent_group).toBe(true)
  })

  it('is a no-op when nothing is affirmatively consented', async () => {
    await mergeConsent('c@x.dk', { version: 'v', mad: false, group: false })
    expect(updatePatches).toHaveLength(0)
  })

  it('is a no-op when no consent object is passed', async () => {
    await mergeConsent('d@x.dk', undefined)
    expect(updatePatches).toHaveLength(0)
  })

  it('strips a not-yet-migrated column and retries', async () => {
    updateResults = [
      { error: { code: 'PGRST204', message: "Could not find the 'consent_version' column of 'signup' in the schema cache" } },
      { error: null },
    ]
    await mergeConsent('e@x.dk', { version: '2026-07-13', mad: true, group: false })

    expect(updatePatches).toHaveLength(2)
    expect('consent_version' in updatePatches[1].patch).toBe(false)
    expect(updatePatches[1].patch.marketing_consent_mad).toBe(true)
  })

  it('rethrows a non-column error', async () => {
    updateResults = [{ error: { code: '57014', message: 'canceling statement due to statement timeout' } }]
    await expect(mergeConsent('f@x.dk', { mad: true })).rejects.toThrow(/timeout/)
  })
})
