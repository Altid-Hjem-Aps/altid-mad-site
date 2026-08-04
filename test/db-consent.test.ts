import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// mirrorSignup is the only consent-store on the signup path: the form sends a
// documented marketing consent, the route forwards it, and this is where it is
// written to Supabase. These tests pin (1) that the consent fields land in the
// upserted row and (2) that a not-yet-migrated column can never break a signup.

// Capture every row passed to .upsert() and script the {data,error} each
// upsert resolves to, so we can simulate a missing column.
const upsertedRows: Record<string, unknown>[] = []
let results: Array<{ data: unknown; error: unknown }> = []
// Capture .rpc() calls (redeemConsentToken) and script their results.
const rpcCalls: Array<{ fn: string; args: Record<string, unknown> }> = []
let rpcResults: Array<{ data: unknown; error: unknown }> = []
// Script the select chain (isConfirmTokenRedeemed). A null entry simulates a
// query that never resolves (the 2s timeout race must win).
const selectFilters: Array<{ col: string; value: unknown }> = []
let selectResults: Array<{ data: unknown; error: unknown } | null> = []

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: (fn: string, args: Record<string, unknown>) => {
      rpcCalls.push({ fn, args })
      return Promise.resolve(rpcResults.shift() ?? { data: null, error: null })
    },
    from: () => ({
      upsert: (row: Record<string, unknown>) => {
        upsertedRows.push(row)
        return {
          select: () => ({
            maybeSingle: () => Promise.resolve(results.shift() ?? { data: null, error: null }),
          }),
        }
      },
      select: () => ({
        eq: (col: string, value: unknown) => ({
          limit: () => ({
            // boundedRead attaches .abortSignal() to the builder, then awaits
            // the builder itself — the mock must be a thenable WITH abortSignal.
            maybeSingle: () => {
              selectFilters.push({ col, value })
              const next = selectResults.shift()
              // null = hang forever, so the caller's timeout race decides.
              const p: Promise<unknown> =
                next === null ? new Promise(() => {}) : Promise.resolve(next ?? { data: null, error: null })
              return {
                abortSignal: () => {},
                then: (...args: Parameters<Promise<unknown>['then']>) => p.then(...args),
              }
            },
          }),
        }),
      }),
    }),
  }),
}))

// getClient() throws without these — set before the module under test loads.
process.env.SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key'

import { mirrorSignup, redeemConsentToken, isConfirmTokenRedeemed } from '@/lib/db'

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

  it('retries a transient error, then rethrows if it never recovers', async () => {
    // A statement timeout (57014) is transient, so mirrorSignup retries it rather
    // than dropping the consent record on the first blip. If every attempt fails,
    // it still surfaces the error.
    results = Array(4).fill({ data: null, error: { code: '57014', message: 'canceling statement due to statement timeout' } })

    await expect(mirrorSignup('pub-5', { consent: CONSENT })).rejects.toThrow(/timeout/)
    expect(upsertedRows).toHaveLength(4) // initial + 3 retries
  })

  it('recovers when a transient error clears on retry (consent not lost)', async () => {
    results = [
      { data: null, error: { code: '57014', message: 'statement timeout' } },
      { data: { unsub_token: 'tok' }, error: null },
    ]
    const token = await mirrorSignup('pub-6', { consent: CONSENT })
    expect(token).toBe('tok')
    expect(upsertedRows).toHaveLength(2) // failed once, then succeeded on retry
  })
})

describe('redeemConsentToken (atomic double opt-in redemption)', () => {
  beforeEach(() => {
    rpcCalls.length = 0
    rpcResults = []
  })
  afterEach(() => {
    vi.clearAllMocks()
  })

  const REDEEM = {
    publicId: '08a3b8b6-9482-4ff1-9703-220331a068dd',
    tokenId: 'sha256-of-token',
    mad: true,
    group: false,
    version: '2026-07-14.2-mad',
  }

  it('calls the RPC with the exact parameter mapping and returns applied', async () => {
    rpcResults = [{ data: 'applied', error: null }]

    await expect(redeemConsentToken(REDEEM)).resolves.toBe('applied')

    expect(rpcCalls).toHaveLength(1)
    expect(rpcCalls[0].fn).toBe('redeem_consent_token')
    expect(rpcCalls[0].args).toEqual({
      p_public_id: REDEEM.publicId,
      p_token_id: REDEEM.tokenId,
      p_mad: true,
      p_group: false,
      p_version: '2026-07-14.2-mad',
    })
  })

  it('passes the already_used outcome through (replayed link)', async () => {
    rpcResults = [{ data: 'already_used', error: null }]
    await expect(redeemConsentToken(REDEEM)).resolves.toBe('already_used')
  })

  it('passes the ineligible outcome through (row gone or unsubscribed)', async () => {
    rpcResults = [{ data: 'ineligible', error: null }]
    await expect(redeemConsentToken(REDEEM)).resolves.toBe('ineligible')
  })

  it('throws on an RPC error — a transport failure must never read as a state', async () => {
    rpcResults = [{ data: null, error: { message: 'connection reset' } }]
    await expect(redeemConsentToken(REDEEM)).rejects.toThrow(/connection reset/)
  })

  it('throws on an unexpected outcome value instead of guessing', async () => {
    rpcResults = [{ data: 'partial', error: null }]
    await expect(redeemConsentToken(REDEEM)).rejects.toThrow(/unexpected outcome/)
  })
})

describe('isConfirmTokenRedeemed (render-time replay check, UX only)', () => {
  beforeEach(() => {
    selectFilters.length = 0
    selectResults = []
  })
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('true when a consent_event row carries the token id', async () => {
    selectResults = [{ data: { id: 1 }, error: null }]
    await expect(isConfirmTokenRedeemed('tok-1')).resolves.toBe(true)
    expect(selectFilters[0]).toEqual({ col: 'token_id', value: 'tok-1' })
  })

  it('false when no row matches (token not yet redeemed)', async () => {
    selectResults = [{ data: null, error: null }]
    await expect(isConfirmTokenRedeemed('tok-2')).resolves.toBe(false)
  })

  it('false without querying for an empty token id', async () => {
    await expect(isConfirmTokenRedeemed('')).resolves.toBe(false)
    expect(selectFilters).toHaveLength(0)
  })

  it('fails OPEN (false) when the query hangs past the 2s race', async () => {
    vi.useFakeTimers()
    try {
      selectResults = [null] // never resolves — only the timeout can win
      const pending = isConfirmTokenRedeemed('tok-3')
      await vi.advanceTimersByTimeAsync(2001)
      await expect(pending).resolves.toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('throws on a real query error so the caller can log the fall-open', async () => {
    selectResults = [{ data: null, error: { message: 'permission denied' } }]
    await expect(isConfirmTokenRedeemed('tok-4')).rejects.toThrow(/permission denied/)
  })
})
