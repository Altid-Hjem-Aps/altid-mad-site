import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// The yes-page runs the REAL lib/db helpers against a scripted Supabase client,
// so these tests pin the queries (table, selected columns, filter column, upsert
// options) as well as the screens. The client returns ONLY the columns a select
// names, like PostgREST: a helper that stops selecting signup_source or
// first_name gets undefined back and the screens change.

function project(row: Record<string, unknown> | undefined, cols: string) {
  if (!row) return null
  return Object.fromEntries(cols.split(',').map((c) => c.trim()).map((c) => [c, row[c]]))
}

type OptinRow = { public_id: string; created_at: string; copy_version: string; device: string }

type SignupRow = {
  public_id: string
  email: string
  first_name: string | null
  signup_source: string | null
  unsubscribed: boolean | null
  marketing_consent_mad: boolean | null
  marketing_consent_group: boolean | null
}

const db = {
  signups: new Map<string, SignupRow>(), // keyed by unsub_token
  optins: new Map<string, OptinRow>(),
  // Runs inside the upsert before it resolves: simulates a competing answer
  // landing between the route's "already answered?" read and its insert.
  beforeUpsert: null as (() => void) | null,
  upserts: [] as Array<{ row: Record<string, unknown>; opts: unknown }>,
  filters: [] as Array<{ table: string; col: string; value: unknown }>,
  selects: [] as Array<{ table: string; cols: string }>,
  signupReadError: null as { message: string } | null,
  optinReadError: null as { message: string } | null,
  insertError: null as { message: string } | null,
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: (cols: string) => ({
        eq: (col: string, value: string) => ({
          maybeSingle: () => {
            db.selects.push({ table, cols })
            db.filters.push({ table, col, value })
            if (table === 'signup') {
              // Production behaviour: unsub_token is a uuid column, and a
              // non-uuid filter value is a 22P02 error, not an empty result.
              if (col === 'unsub_token' && !/^[0-9a-f-]{36}$/i.test(value)) {
                return Promise.resolve({
                  data: null,
                  error: { code: '22P02', message: `invalid input syntax for type uuid: "${value}"` },
                })
              }
              return Promise.resolve({ data: project(db.signups.get(value), cols), error: db.signupReadError })
            }
            if (table === 'mad_test_optin') {
              return Promise.resolve({ data: project(db.optins.get(value), cols), error: db.optinReadError })
            }
            throw new Error(`unexpected table ${table}`)
          },
        }),
      }),
      upsert: (row: Record<string, unknown>, opts: { ignoreDuplicates?: boolean }) => {
        if (table !== 'mad_test_optin') throw new Error(`unexpected upsert into ${table}`)
        db.upserts.push({ row, opts })
        db.beforeUpsert?.()
        if (db.insertError) return Promise.resolve({ error: db.insertError })
        const id = row.public_id as string
        // ON CONFLICT DO NOTHING: the first answer keeps its device, time and version.
        if (!db.optins.has(id) || !opts.ignoreDuplicates) {
          db.optins.set(id, {
            public_id: id,
            created_at: new Date().toISOString(),
            copy_version: row.copy_version as string,
            device: row.device as string,
          })
        }
        return Promise.resolve({ error: null })
      },
    }),
  }),
}))

import { GET, POST } from '@/app/api/mad-testen/route'
import { MAD_TEST_COPY_VERSION } from '@/lib/mad-test'

const TOKEN = '9b2f7c4e-1d3a-4e5b-8c6d-0a1b2c3d4e5f'
const PUBLIC_ID = '242eba51-9c3f-49ab-a8f6-373a299169e8'

function eligible(overrides: Partial<SignupRow> = {}): SignupRow {
  return {
    public_id: PUBLIC_ID,
    email: 'anna@example.dk',
    first_name: 'Anna',
    signup_source: 'altid-mad',
    unsubscribed: false,
    marketing_consent_mad: true,
    marketing_consent_group: false,
    ...overrides,
  }
}

function url(token?: string) {
  const u = new URL('https://altidmad.dk/api/mad-testen')
  if (token !== undefined) u.searchParams.set('t', token)
  return u
}

const get = (token?: string) => GET(new NextRequest(url(token)))
// What the form sends: the pressed button's name=value, urlencoded.
function post(token?: string, device: string | null = 'iphone') {
  return POST(
    new NextRequest(url(token), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: device === null ? '' : new URLSearchParams({ device }).toString(),
    }),
  )
}

function answered(device: string): OptinRow {
  return { public_id: PUBLIC_ID, created_at: '2026-09-25T10:00:00Z', copy_version: MAD_TEST_COPY_VERSION, device }
}

beforeAll(() => {
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-test-key')
})
afterAll(() => {
  vi.unstubAllEnvs()
})

beforeEach(() => {
  db.signups.clear()
  db.optins.clear()
  db.upserts.length = 0
  db.filters.length = 0
  db.beforeUpsert = null
  db.selects.length = 0
  db.signupReadError = null
  db.optinReadError = null
  db.insertError = null
  // Fresh spy per test, so call counts never leak between tests.
  vi.restoreAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

// Links whose token is not a uuid. signup.unsub_token is a uuid column, and
// PostgREST answers a non-uuid filter with 22P02 (a 500), so these must be
// refused before any query is made.
const NOT_A_UUID: Array<[string, string | undefined]> = [
  ['no token', undefined],
  ['empty token', ''],
  ['?t=abc', 'abc'],
  ['truncated uuid', TOKEN.slice(0, 30)],
  ['uuid with extra characters', `${TOKEN}0`],
  ['overlong string', 'x'.repeat(5000)],
]

// Every reason a link is refused. The page must answer all of them with the
// exact same bytes and status, so it never tells anyone who is on the list.
const REFUSED: Array<[string, () => string | undefined]> = [
  ...NOT_A_UUID.map(([name, token]): [string, () => string | undefined] => [name, () => token]),
  ['unknown token', () => '00000000-0000-4000-8000-000000000000'],
  ['unsubscribed', () => (db.signups.set(TOKEN, eligible({ unsubscribed: true })), TOKEN)],
  ['no Altid Mad consent', () => (db.signups.set(TOKEN, eligible({ marketing_consent_mad: false })), TOKEN)],
  ['NULL Altid Mad consent (legacy row)', () => (db.signups.set(TOKEN, eligible({ marketing_consent_mad: null })), TOKEN)],
  ['Hjem-form signup', () => (db.signups.set(TOKEN, eligible({ signup_source: 'altid-hjem' })), TOKEN)],
  ['no signup source', () => (db.signups.set(TOKEN, eligible({ signup_source: null })), TOKEN)],
]

async function referenceInvalid() {
  const res = await get()
  return { status: res.status, body: await res.text() }
}

describe('GET /api/mad-testen', () => {
  it('eligible, not yet answered: greets by first name, shows the two answers, writes nothing', async () => {
    db.signups.set(TOKEN, eligible())
    const res = await get(TOKEN)
    const html = await res.text()

    expect(res.status).toBe(200)
    expect(html).toContain('Hej Anna,')
    expect(html).toContain('<button type="submit" name="device" value="iphone" class="primary">Ja, jeg har en iPhone</button>')
    expect(html).toContain('<button type="submit" name="device" value="android" class="secondary">Ja, men jeg har Android</button>')
    expect(html).toContain(`<form method="POST" action="/api/mad-testen?t=${TOKEN}"`)
    expect(html).toContain('href="/privatlivspolitik"')
    expect(html.match(/<button/g)).toHaveLength(2)
    expect(html.match(/<form/g)).toHaveLength(1)
    expect(html).not.toContain('type="checkbox"')
    expect(db.upserts).toHaveLength(0)
    // Looked up by the secret token, then the yes-list by the signup's own id.
    expect(db.filters).toEqual([
      { table: 'signup', col: 'unsub_token', value: TOKEN },
      { table: 'mad_test_optin', col: 'public_id', value: PUBLIC_ID },
    ])
    const signupCols = db.selects[0].cols.split(',').map((c) => c.trim())
    expect(signupCols).toEqual(
      expect.arrayContaining(['public_id', 'email', 'first_name', 'signup_source', 'unsubscribed', 'marketing_consent_mad']),
    )
  })

  it('also admits the exit-intent form on altidmad.dk', async () => {
    db.signups.set(TOKEN, eligible({ signup_source: 'altid-mad-exit' }))
    const res = await get(TOKEN)
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('Ja, jeg har en iPhone</button>')
  })

  it('greets without a name when the signup has none', async () => {
    db.signups.set(TOKEN, eligible({ first_name: null }))
    const html = await (await get(TOKEN)).text()
    expect(html).toContain('<p class="hello">Hej,</p>')
  })

  it('never cached, never indexed, never leaks the link in a Referer', async () => {
    db.signups.set(TOKEN, eligible())
    for (const res of [await get(TOKEN), await get()]) {
      expect(res.headers.get('Cache-Control')).toBe('private, no-store')
      expect(res.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
      expect(res.headers.get('Referrer-Policy')).toBe('no-referrer')
      expect(res.headers.get('Content-Type')).toBe('text/html; charset=utf-8')
      expect(res.headers.getSetCookie()).toEqual([])
    }
  })

  it.each(REFUSED)('%s: the identical invalid-link screen, nothing written', async (_, setup) => {
    const ref = await referenceInvalid()
    const res = await get(setup())
    const html = await res.text()

    expect(res.status).toBe(400)
    expect(html).toBe(ref.body)
    expect(html).toContain('Linket virker ikke')
    expect(html).not.toContain('<form')
    expect(db.upserts).toHaveLength(0)
  })

  it('already answered iPhone: says so with the login next step, no form', async () => {
    db.signups.set(TOKEN, eligible())
    db.optins.set(PUBLIC_ID, answered('iphone'))
    const res = await get(TOKEN)
    const html = await res.text()

    expect(res.status).toBe(200)
    expect(html).toContain('<h1>Vi har allerede dit ja</h1>')
    expect(html).toContain('Du får en mail med dit login')
    expect(html).not.toContain('<form')
    expect(db.upserts).toHaveLength(0)
  })

  it('already answered Android: the Android message, no form', async () => {
    db.signups.set(TOKEN, eligible())
    db.optins.set(PUBLIC_ID, answered('android'))
    const res = await get(TOKEN)
    const html = await res.text()

    expect(res.status).toBe(200)
    expect(html).toContain('<h1>Vi har allerede dit svar</h1>')
    expect(html).toContain('Testen kører kun på iPhone')
    expect(html).not.toContain('login')
    expect(html).not.toContain('<form')
  })

  it('a stored row with an unknown device: 500, never a guessed screen', async () => {
    db.signups.set(TOKEN, eligible())
    db.optins.set(PUBLIC_ID, answered('windows'))
    expect((await get(TOKEN)).status).toBe(500)
  })

  it('signup read fails: error screen with 500, not a form or an invalid link', async () => {
    db.signupReadError = { message: 'connection reset' }
    const res = await get(TOKEN)
    const html = await res.text()

    expect(res.status).toBe(500)
    expect(html).toContain('Noget gik galt')
    expect(html).not.toContain('Linket virker ikke')
  })

  it('yes-list read fails: error screen with 500, not the form', async () => {
    db.signups.set(TOKEN, eligible())
    db.optinReadError = { message: 'relation "mad_test_optin" does not exist' }
    const res = await get(TOKEN)

    expect(res.status).toBe(500)
    expect(await res.text()).not.toContain('<form')
  })

  it('escapes the first name', async () => {
    db.signups.set(TOKEN, eligible({ first_name: '<script>alert("x")</script>' }))
    const html = await (await get(TOKEN)).text()

    expect(html).not.toContain('<script>alert')
    expect(html).toContain('Hej &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;,')
  })

  it.each(NOT_A_UUID)('%s: invalid screen without a single database query', async (_, token) => {
    const ref = await referenceInvalid()
    for (const res of [await get(token), await post(token)]) {
      expect(res.status).toBe(400)
      expect(await res.text()).toBe(ref.body)
    }
    expect(db.selects).toEqual([])
    expect(db.filters).toEqual([])
    expect(db.upserts).toEqual([])
  })

  it('accepts an upper-case uuid (Postgres reads it as the same value)', async () => {
    db.signups.set(TOKEN.toUpperCase(), eligible())
    const res = await get(TOKEN.toUpperCase())
    expect(res.status).toBe(200)
  })
})

describe('POST /api/mad-testen', () => {
  it('iPhone: records the answer once, with device and wording version, and says you are in', async () => {
    db.signups.set(TOKEN, eligible())
    const res = await post(TOKEN, 'iphone')
    const html = await res.text()

    expect(res.status).toBe(200)
    expect(db.upserts).toEqual([
      {
        row: { public_id: PUBLIC_ID, copy_version: MAD_TEST_COPY_VERSION, device: 'iphone' },
        opts: { onConflict: 'public_id', ignoreDuplicates: true },
      },
    ])
    expect(html).toContain('<h1>Tak, du er med</h1>')
    expect(html).toContain('Du får en mail med dit login, så snart Apple har godkendt testversionen.')
    expect(html).toContain('mailto:hej@altidmad.dk')
    expect(res.headers.get('Cache-Control')).toBe('private, no-store')
  })

  it('Android: records the answer with device android and says the test is iPhone only', async () => {
    db.signups.set(TOKEN, eligible())
    const res = await post(TOKEN, 'android')
    const html = await res.text()

    expect(res.status).toBe(200)
    expect(db.upserts.map((u) => u.row)).toEqual([
      { public_id: PUBLIC_ID, copy_version: MAD_TEST_COPY_VERSION, device: 'android' },
    ])
    expect(html).toContain('<h1>Tak for dit svar</h1>')
    expect(html).toContain('Testen kører kun på iPhone, så du er ikke med denne gang.')
    expect(html).not.toContain('login')
  })

  it.each([
    ['iphone', 'Vi har allerede dit ja'],
    ['android', 'Vi har allerede dit svar'],
  ])('a repeat answer after %s keeps the first row and shows its already screen', async (first, heading) => {
    db.signups.set(TOKEN, eligible())
    await post(TOKEN, first)
    const row = db.optins.get(PUBLIC_ID)
    const other = first === 'iphone' ? 'android' : 'iphone'

    for (const device of [first, other]) {
      const res = await post(TOKEN, device)
      expect(res.status).toBe(200)
      expect(await res.text()).toContain(`<h1>${heading}</h1>`)
    }
    expect(db.upserts).toHaveLength(1)
    expect(db.optins.size).toBe(1)
    expect(db.optins.get(PUBLIC_ID)).toBe(row)
  })

  it('a competing answer that lands first wins, and the screen describes it', async () => {
    db.signups.set(TOKEN, eligible())
    db.beforeUpsert = () => {
      db.optins.set(PUBLIC_ID, answered('android'))
    }
    const res = await post(TOKEN, 'iphone')

    expect(res.status).toBe(200)
    expect(await res.text()).toContain('<h1>Vi har allerede dit svar</h1>')
    expect(db.optins.get(PUBLIC_ID)?.device).toBe('android')
  })

  it.each([
    ['JSON', 'application/json', JSON.stringify({ device: 'iphone' })],
    ['text/plain', 'text/plain', 'device=iphone'],
    ['no content type', null, 'device=iphone'],
  ])('%s body with a valid token: invalid-link screen, nothing written', async (_, type, body) => {
    db.signups.set(TOKEN, eligible())
    const ref = await referenceInvalid()
    const res = await POST(
      new NextRequest(url(TOKEN), { method: 'POST', body, headers: type ? { 'Content-Type': type } : {} }),
    )

    expect(res.status).toBe(400)
    expect(await res.text()).toBe(ref.body)
    expect(db.upserts).toEqual([])
    expect(console.error).not.toHaveBeenCalled()
  })

  it.each([
    ['no device', null],
    ['empty device', ''],
    ['unknown device', 'windows'],
    ['upper-case device', 'IPHONE'],
  ])('%s: invalid-link screen, nothing written', async (_, device) => {
    db.signups.set(TOKEN, eligible())
    const ref = await referenceInvalid()
    const res = await post(TOKEN, device)

    expect(res.status).toBe(400)
    expect(await res.text()).toBe(ref.body)
    expect(db.upserts).toHaveLength(0)
  })

  it.each(REFUSED)('%s: never inserts, same invalid-link screen', async (_, setup) => {
    const ref = await referenceInvalid()
    const res = await post(setup())

    expect(res.status).toBe(400)
    expect(await res.text()).toBe(ref.body)
    expect(db.upserts).toHaveLength(0)
  })

  it('insert fails: 500 error screen, never the thank-you screen', async () => {
    db.signups.set(TOKEN, eligible())
    db.insertError = { message: 'permission denied for table mad_test_optin' }
    const res = await post(TOKEN)
    const html = await res.text()

    expect(res.status).toBe(500)
    expect(html).toContain('Noget gik galt')
    expect(html).not.toContain('Tak')
    expect(html).not.toContain('Vi har allerede')
    expect(console.error).toHaveBeenCalledWith('mad-testen POST failed', expect.any(Error))
  })

  it('signup read fails: 500, nothing inserted', async () => {
    db.signupReadError = { message: 'timeout' }
    const res = await post(TOKEN)

    expect(res.status).toBe(500)
    expect(db.upserts).toHaveLength(0)
  })
})
