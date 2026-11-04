import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// POST /api/waitlist with source 'newsletter', run through the real route and
// lib/db against an in-memory Supabase. Boundaries faked: Supabase, Resend,
// Amplitude, fetch and next's after(), whose callbacks the tests run by hand.

type Row = Record<string, unknown>

const fake = {
  signups: [] as Row[],
  events: [] as Row[],
  limits: new Map<string, number>(),
  lookup: 'ok' as 'ok' | 'error' | 'hang',
  signupWriteError: null as { message: string } | null,
  eventWriteError: null as { message: string } | null,
  limiterError: null as { message: string } | null,
}

function selectSignup(cols: string) {
  const filter: { email?: unknown } = {}
  const builder = {
    eq: (_col: string, value: unknown) => {
      filter.email = value
      return builder
    },
    order: () => builder,
    limit: () => builder,
    abortSignal: () => builder,
    maybeSingle: () => builder,
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => {
      if (fake.lookup === 'hang') return new Promise(() => {}).then(resolve, reject)
      if (fake.lookup === 'error') return Promise.resolve({ data: null, error: { message: 'boom' } }).then(resolve, reject)
      const row = fake.signups.find((r) => r.email === filter.email)
      const picked = row ? Object.fromEntries(cols.split(',').map((c) => [c.trim(), row[c.trim()]])) : null
      return Promise.resolve({ data: picked, error: null }).then(resolve, reject)
    },
    // getSignupCounts: applies the filter the way PostgREST would, only for the
    // exact NULL-safe string, so a wrong filter counts every row and fails.
    or: (expr: string) => ({
      order: () => ({
        range: () => {
          const rows =
            expr === 'signup_source.is.null,signup_source.neq.newsletter'
              ? fake.signups.filter((r) => r.signup_source === null || r.signup_source !== 'newsletter')
              : fake.signups
          return Promise.resolve({ data: rows, error: null })
        },
      }),
    }),
  }
  return builder
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: (fn: string, args: { p_key: string; p_max: number }) => {
      if (fn !== 'check_rate_limit') throw new Error(`unexpected rpc ${fn}`)
      if (fake.limiterError) return Promise.resolve({ data: null, error: fake.limiterError })
      const n = (fake.limits.get(args.p_key) ?? 0) + 1
      fake.limits.set(args.p_key, n)
      return Promise.resolve({ data: n > args.p_max, error: null })
    },
    from: (table: string) => {
      if (table === 'consent_event') {
        return {
          insert: (row: Row) => {
            if (fake.eventWriteError) return Promise.resolve({ error: fake.eventWriteError })
            fake.events.push(row)
            return Promise.resolve({ error: null })
          },
        }
      }
      return {
        select: selectSignup,
        upsert: (row: Row, opts: { onConflict: string; ignoreDuplicates: boolean }) => {
          if (fake.signupWriteError) return Promise.resolve({ error: fake.signupWriteError })
          expect(opts).toEqual({ onConflict: 'public_id', ignoreDuplicates: true })
          if (!fake.signups.some((r) => r.public_id === row.public_id)) {
            fake.signups.push({ unsub_token: 'unsub-new', unsubscribed: false, first_name: null, ...row })
          }
          return Promise.resolve({ error: null })
        },
      }
    },
  }),
}))

const resendSend = vi.fn().mockResolvedValue({ data: { id: 'mail' }, error: null })
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: resendSend }
  },
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

const afterCallbacks: Array<() => unknown> = []
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  after: (fn: () => unknown) => {
    afterCallbacks.push(fn)
  },
}))

async function runAfter() {
  for (const fn of afterCallbacks.splice(0)) await fn()
}

let ipCounter = 0
function post(body: unknown, ip = `10.0.0.${++ipCounter}`) {
  return new NextRequest('https://altidmad.dk/api/waitlist', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  })
}

const VALID = { source: 'newsletter', scope: 'mad', email: 'Ny@Example.dk ', consent: true }

const fetchStub = vi.fn()

async function call(body: unknown, ip?: string) {
  const { POST } = await import('@/app/api/waitlist/route')
  return POST(post(body, ip))
}

beforeEach(() => {
  fake.signups = []
  fake.events = []
  fake.limits = new Map()
  fake.lookup = 'ok'
  fake.signupWriteError = null
  fake.eventWriteError = null
  fake.limiterError = null
  afterCallbacks.length = 0
  resendSend.mockClear()
  resendSend.mockResolvedValue({ data: { id: 'mail' }, error: null })
  amplitudeTrack.mockReset()
  fetchStub.mockReset()
  vi.stubGlobal('fetch', fetchStub)
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-test-key')
  vi.stubEnv('CONSENT_TOKEN_SECRET', 'consent-test-secret')
  vi.stubEnv('RESEND_API_KEY', 're_test')
  vi.stubEnv('NEXT_PUBLIC_AMPLITUDE_API_KEY', 'amp-test')
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('a new address', () => {
  it('stores the row and its evidence with this site’s consent, and contacts nobody', async () => {
    const res = await call(VALID)
    await runAfter()

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(fake.signups).toHaveLength(1)
    const row = fake.signups[0]
    expect(row).toMatchObject({
      email: 'ny@example.dk',
      signup_source: 'newsletter',
      marketing_consent_mad: true,
      marketing_consent_group: false,
      consent_version: 'newsletter-2026-11-04-mad',
    })
    // A uuid: consent_event.public_id is uuid and redeem_consent_token casts to it.
    expect(row.public_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(row.consent_at).toEqual(expect.any(String))
    // signup.created_at has no default on the table shared with altidhjem.dk.
    expect(row.created_at).toEqual(expect.any(String))
    expect(fake.events).toEqual([
      {
        public_id: row.public_id,
        method: 'newsletter-form',
        consent_version: 'newsletter-2026-11-04-mad',
        marketing_consent_mad: true,
        marketing_consent_group: false,
      },
    ])
    expect(resendSend).not.toHaveBeenCalled()
    // No upstream API, no SMS gateway.
    expect(fetchStub).not.toHaveBeenCalled()
  })

  it('takes the version from the server, whatever the client sends', async () => {
    await call({ ...VALID, consent_version: 'forged', version: 'forged', group: true })
    expect(fake.signups[0]).toMatchObject({ consent_version: 'newsletter-2026-11-04-mad', marketing_consent_group: false })
  })

  it('sends one anonymous event with the scope and no address', async () => {
    await call(VALID)
    await runAfter()
    expect(amplitudeTrack).toHaveBeenCalledTimes(1)
    const [name, props, opts] = amplitudeTrack.mock.calls[0]
    expect(name).toBe('Newsletter Signup')
    expect(props).toEqual({ scope: 'mad' })
    expect(JSON.stringify(amplitudeTrack.mock.calls)).not.toContain('example.dk')
    expect(opts.user_id).toBeUndefined()
  })

  it('still answers success when Amplitude fails', async () => {
    vi.stubEnv('NEXT_PUBLIC_AMPLITUDE_API_KEY', '')
    const res = await call(VALID)
    await expect(runAfter()).resolves.toBeUndefined()
    expect(res.status).toBe(200)
    expect(console.error).toHaveBeenCalledWith('newsletter event not recorded', expect.stringContaining('AMPLITUDE'))
  })

  it('makes one row of two submits, whatever the case of the address', async () => {
    await call(VALID)
    const res = await call({ ...VALID, email: 'NY@example.dk' })
    expect(res.status).toBe(200)
    expect(fake.signups).toHaveLength(1)
  })

  it('makes one row of two racing submits: the id is the same, so the upsert ignores the second', async () => {
    const { newsletterPublicId } = await import('@/lib/consent-token')
    expect(newsletterPublicId('ny@example.dk')).toBe(newsletterPublicId('ny@example.dk'))
    expect(newsletterPublicId('ny@example.dk')).not.toBe(newsletterPublicId('anden@example.dk'))
    await Promise.all([call(VALID), call(VALID)])
    expect(fake.signups).toHaveLength(1)
  })
})

describe('refused input stores nothing', () => {
  it.each([
    ['no tick', { ...VALID, consent: false }],
    ['absent tick', { source: 'newsletter', scope: 'mad', email: 'ny@example.dk' }],
    ['a tick that is not true', { ...VALID, consent: 'true' }],
    ['a bad address', { ...VALID, email: 'ikke-en-adresse' }],
    ['an address that is not a string', { ...VALID, email: { $ne: null } }],
    ['an address over 254 characters', { ...VALID, email: `${'a'.repeat(250)}@example.dk` }],
    ['another site’s scope', { ...VALID, scope: 'hjem' }],
    ['no scope', { source: 'newsletter', email: 'ny@example.dk', consent: true }],
  ])('%s: 400', async (_name, body) => {
    const res = await call(body)
    expect(res.status).toBe(400)
    expect(fake.signups).toEqual([])
    expect(fake.events).toEqual([])
    expect(fake.limits.size).toBe(0)
  })

  it('a cross-site form post, sent as text/plain, is refused', async () => {
    const { POST } = await import('@/app/api/waitlist/route')
    const res = await POST(
      new NextRequest('https://altidmad.dk/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'text/plain', 'x-forwarded-for': '10.2.2.2' },
        body: JSON.stringify(VALID),
      }),
    )
    expect(res.status).toBe(415)
    expect(fake.signups).toEqual([])
  })

  it('a JSON null body is a 400, not a crash', async () => {
    expect((await call(null)).status).toBe(400)
  })

  it('refuses to work without the consent secret, before anything is written', async () => {
    vi.stubEnv('CONSENT_TOKEN_SECRET', '')
    await expect(call(VALID)).rejects.toThrow('CONSENT_TOKEN_SECRET')
    expect(fake.signups).toEqual([])
    expect(fake.limits.size).toBe(0)
  })
})

describe('failures say retry, write nothing and let the retry through', () => {
  it('a lookup error is a 503 with no write, and the retry stores the row', async () => {
    fake.lookup = 'error'
    const res = await call(VALID)
    expect(res.status).toBe(503)
    expect(fake.signups).toEqual([])
    expect(fake.events).toEqual([])

    fake.lookup = 'ok'
    expect((await call(VALID)).status).toBe(200)
    expect(fake.signups).toHaveLength(1)
  })

  it('a lookup timeout is a 503, never a new person', async () => {
    vi.useFakeTimers()
    fake.lookup = 'hang'
    const pending = call(VALID)
    await vi.advanceTimersByTimeAsync(5000)
    expect((await pending).status).toBe(503)
    expect(fake.signups).toEqual([])
  })

  it('a failed signup insert is a 503, and the retry stores the row', async () => {
    fake.signupWriteError = { message: 'db down' }
    expect((await call(VALID)).status).toBe(503)
    expect(fake.signups).toEqual([])

    fake.signupWriteError = null
    expect((await call(VALID)).status).toBe(200)
    expect(fake.signups).toHaveLength(1)
  })

  it('a failed evidence insert is a 503 and leaves no consenting row without proof', async () => {
    fake.eventWriteError = { message: 'db down' }
    expect((await call(VALID)).status).toBe(503)
    expect(fake.signups).toEqual([])
  })

  it('stops at 500 submits an hour for the whole site, and says retry, storing nothing', async () => {
    fake.limits.set('newsletter-submits:global', 500)
    expect((await call(VALID)).status).toBe(503)
    expect(fake.signups).toEqual([])
    expect(fake.events).toEqual([])
  })

  it('over the ceiling a known and an unknown address get the same answer, so it reveals nobody', async () => {
    fake.limits.set('newsletter-submits:global', 500)
    const unknown = await call({ ...VALID, email: 'ukendt@example.dk' })
    fake.signups = [{ public_id: 'b1946ac9-2c1d-4f3e-8a11-000000000003', email: 'kendt@example.dk', unsubscribed: false, marketing_consent_mad: true }]
    const known = await call({ ...VALID, email: 'kendt@example.dk' })
    expect(known.status).toBe(unknown.status)
    expect(await known.json()).toEqual(await unknown.json())
  })

  it('counts every accepted submit, known addresses too, and never a refused one', async () => {
    fake.signups = [{ public_id: 'b1946ac9-2c1d-4f3e-8a11-000000000003', email: 'kendt@example.dk', unsubscribed: false, marketing_consent_mad: true }]
    await call({ ...VALID, email: 'kendt@example.dk' })
    await call({ ...VALID, email: 'ny2@example.dk' })
    await call({ ...VALID, consent: false })
    expect(fake.limits.get('newsletter-submits:global')).toBe(2)
  })

  it('a limiter that cannot run stores nothing and says retry', async () => {
    fake.limiterError = { message: 'limiter down' }
    expect((await call(VALID)).status).toBe(503)
    expect(fake.signups).toEqual([])
  })

  it('limits one IP to 5 an hour', async () => {
    for (let i = 0; i < 5; i++) expect((await call({ ...VALID, email: `n${i}@example.dk` }, '10.9.9.9')).status).toBe(200)
    const res = await call({ ...VALID, email: 'n6@example.dk' }, '10.9.9.9')
    expect(res.status).toBe(429)
    expect(fake.signups).toHaveLength(5)
  })
})

describe('an address already on the table', () => {
  const onFile = (over: Row = {}): Row => ({
    public_id: 'b1946ac9-2c1d-4f3e-8a11-000000000001',
    email: 'ny@example.dk',
    first_name: 'Karen',
    signup_source: 'altid-mad',
    unsub_token: 'unsub-1',
    unsubscribed: false,
    marketing_consent_mad: false,
    marketing_consent_group: false,
    ...over,
  })

  it('without the consent: one confirm mail, sent after the response, and nothing written', async () => {
    const before = onFile()
    fake.signups = [before]
    const res = await call(VALID)
    expect(await res.json()).toEqual({ success: true })
    expect(resendSend).not.toHaveBeenCalled()

    await runAfter()
    expect(resendSend).toHaveBeenCalledTimes(1)
    const mail = resendSend.mock.calls[0][0]
    expect(mail.to).toBe('ny@example.dk')
    expect(mail.html).toContain('Hej Karen')
    expect(mail.html).not.toMatch(/venteliste/i)
    expect(fake.signups).toEqual([onFile()])
    expect(fake.events).toEqual([])

    // The link is the one sent mails use, and its token vouches for Altid Mad
    // only, on the row on file.
    const { verifyConfirmToken } = await import('@/lib/consent-token')
    const href = /href="(https:\/\/altidmad\.dk\/api\/bekraeft\?t=[^"]+)"/.exec(mail.html)?.[1]
    const token = new URL((href as string).replaceAll('&amp;', '&')).searchParams.get('t')
    expect(verifyConfirmToken(token, Date.now() / 1000)).toEqual({
      publicId: before.public_id,
      consent: { mad: true, group: false },
    })
    expect(mail.html).toContain('https://altidhjem.dk/api/unsubscribe?token=unsub-1')
  })

  it('greets without a name when the row has none', async () => {
    fake.signups = [onFile({ first_name: null })]
    await call(VALID)
    await runAfter()
    const { html } = resendSend.mock.calls[0][0]
    expect(html).toContain('>Hej</p>')
    expect(html).not.toContain('undefined')
    expect(html).not.toContain('null')
  })

  it('sends one mail an hour per address, and a refused repeat does not use the global allowance', async () => {
    fake.signups = [onFile()]
    await call(VALID)
    await runAfter()
    await call(VALID)
    await runAfter()
    expect(resendSend).toHaveBeenCalledTimes(1)
    expect(fake.limits.get('consent-confirm:global')).toBe(1)
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('per-address limit'))
  })

  it('sends nothing when the site-wide limit is reached, and logs it', async () => {
    fake.signups = [onFile()]
    fake.limits.set('consent-confirm:global', 100)
    await call(VALID)
    await runAfter()
    expect(resendSend).not.toHaveBeenCalled()
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('global limit'))
  })

  it('fails closed when the limiter cannot run: no mail, and the person still sees success', async () => {
    fake.signups = [onFile()]
    const res = await (async () => {
      const r = await call(VALID)
      fake.limiterError = { message: 'limiter down' }
      return r
    })()
    await runAfter()
    expect(res.status).toBe(200)
    expect(resendSend).not.toHaveBeenCalled()
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('newsletter confirm failed'), expect.any(Error))
  })

  it('logs a mail Resend refused, or a throw, and never answers 500', async () => {
    fake.signups = [onFile()]
    resendSend.mockResolvedValueOnce({ data: null, error: { message: 'bad domain' } })
    const res = await call(VALID)
    await runAfter()
    expect(res.status).toBe(200)
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('newsletter confirm failed'), expect.any(Error))
  })

  it.each([
    ['already has the consent', { marketing_consent_mad: true }],
    ['has unsubscribed', { unsubscribed: true }],
  ])('%s: nothing is written or sent, and the answer is the same', async (_name, over) => {
    fake.signups = [onFile(over)]
    const res = await call(VALID)
    await runAfter()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(resendSend).not.toHaveBeenCalled()
    expect(fake.signups).toEqual([onFile(over)])
    expect(fake.events).toEqual([])
  })
})

describe('the step 1 path, for pages cached before the flip', () => {
  const step1 = { step: 1, email: 'ny@example.dk', name: 'Vind en præmie her', consent: { mad: true, group: false } }
  const row = (first_name: string | null): Row => ({
    public_id: 'b1946ac9-2c1d-4f3e-8a11-000000000002',
    email: 'ny@example.dk',
    first_name,
    signup_source: 'altid-mad',
    unsub_token: 'unsub-2',
    unsubscribed: false,
    marketing_consent_mad: false,
    marketing_consent_group: false,
  })

  beforeEach(() => {
    vi.stubEnv('SURVEY_TOKEN_SECRET', 'survey-test-secret')
    fetchStub.mockImplementation(() => Promise.resolve(new Response('{}', { status: 409 })))
  })

  it.each([
    ['the name on file', 'Karen', 'Hej Karen'],
    ['no name when the row has none', null, '>Hej</p>'],
  ])('the confirm mail uses %s, never what the form typed', async (_name, firstName, greeting) => {
    fake.signups = [row(firstName)]
    await call(step1)
    expect(resendSend).toHaveBeenCalledTimes(1)
    const { html } = resendSend.mock.calls[0][0]
    expect(html).toContain(greeting)
    expect(html).not.toContain('præmie')
  })
})

describe('the step 1 confirm mail when Resend refuses', () => {
  it('is logged, and not counted as sent', async () => {
    vi.stubEnv('SURVEY_TOKEN_SECRET', 'survey-test-secret')
    fetchStub.mockImplementation(() => Promise.resolve(new Response('{}', { status: 409 })))
    fake.signups = [
      {
        public_id: 'b1946ac9-2c1d-4f3e-8a11-000000000004',
        email: 'ny@example.dk',
        first_name: 'Karen',
        unsub_token: 'unsub-4',
        unsubscribed: false,
        marketing_consent_mad: false,
        marketing_consent_group: false,
      },
    ]
    resendSend.mockResolvedValueOnce({ data: null, error: { message: 'over quota' } })
    const { track } = await import('@amplitude/analytics-node')
    vi.mocked(track).mockClear()
    await call({ step: 1, email: 'ny@example.dk', name: 'Karen', consent: { mad: true, group: false } })
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('refused by Resend'))
    expect(track).not.toHaveBeenCalledWith('Consent Confirmation Sent', expect.anything(), expect.anything())
  })
})

describe('the Slack count', () => {
  it('leaves out newsletter rows and keeps rows with no source', async () => {
    const created_at = new Date().toISOString()
    fake.signups = [
      { created_at, signup_source: null },
      { created_at, signup_source: 'altid-mad' },
      { created_at, signup_source: 'newsletter' },
    ]
    const { getSignupCounts } = await import('@/lib/db')
    expect((await getSignupCounts()).total).toBe(2)
  })
})
