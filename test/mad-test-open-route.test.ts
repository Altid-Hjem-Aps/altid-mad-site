// @vitest-environment node
// Node, as in production: the beacon's body is parsed by the request's own
// form parser, as on Vercel.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// The page-open record runs the REAL lib/db helpers against a scripted Supabase
// client, so these tests pin the queries (table, filter column, upsert options)
// as well as the answers. The client returns ONLY the columns a select names,
// like PostgREST.

function project(row: Record<string, unknown> | undefined, cols: string) {
  if (!row) return null
  return Object.fromEntries(cols.split(',').map((c) => c.trim()).map((c) => [c, row[c]]))
}

type SignupRow = {
  public_id: string
  email: string
  first_name: string | null
  signup_source: string | null
  unsubscribed: boolean | null
  marketing_consent_mad: boolean | null
  marketing_consent_group: boolean | null
}

type OptinRow = {
  public_id: string
  created_at: string
  copy_version: string
  device: string
  google_account: string | null
}

type OpenRow = { public_id: string; page: string; created_at: string }

const db = {
  signups: new Map<string, SignupRow>(), // keyed by unsub_token
  optins: new Map<string, OptinRow>(),
  surveys: new Map<string, Record<string, unknown>>(),
  opens: new Map<string, OpenRow>(), // keyed by public_id|page, the primary key
  upserts: [] as Array<{ table: string; row: Record<string, unknown>; opts: unknown }>,
  filters: [] as Array<{ table: string; col: string; value: unknown }>,
  signupReadError: null as { message: string } | null,
  optinReadError: null as { message: string } | null,
  insertError: null as { message: string } | null,
  // Each insert gets a later time, so a test can tell the first open from a later one.
  clock: 0,
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: (cols: string) => ({
        eq: (col: string, value: string) => ({
          maybeSingle: () => {
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
            if (table === 'mad_test_survey') {
              return Promise.resolve({ data: project(db.surveys.get(value), cols), error: null })
            }
            throw new Error(`unexpected table ${table}`)
          },
        }),
      }),
      upsert: (row: Record<string, unknown>, opts: { onConflict?: string; ignoreDuplicates?: boolean }) => {
        if (table !== 'mad_test_page_open') throw new Error(`unexpected upsert into ${table}`)
        db.upserts.push({ table, row, opts })
        if (db.insertError) return Promise.resolve({ error: db.insertError })
        const key = `${row.public_id}|${row.page}`
        // ON CONFLICT (public_id, page) DO NOTHING: the first open keeps its time.
        if (!db.opens.has(key) || !opts.ignoreDuplicates || opts.onConflict !== 'public_id,page') {
          db.clock += 1
          db.opens.set(key, {
            public_id: row.public_id as string,
            page: row.page as string,
            created_at: new Date(Date.UTC(2026, 9, 2, 12, 0, db.clock)).toISOString(),
          })
        }
        return Promise.resolve({ error: null })
      },
    }),
  }),
}))

import { POST } from '@/app/api/mad-testen/open/route'
import * as openRoute from '@/app/api/mad-testen/open/route'
import { GET as yesGet, POST as yesPost } from '@/app/api/mad-testen/route'
import { GET as surveyGet } from '@/app/api/mad-testen/survey/route'
import { showPage } from './fake-browser'

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

function yes(device = 'iphone'): OptinRow {
  return {
    public_id: PUBLIC_ID,
    created_at: '2026-09-25T10:00:00Z',
    copy_version: '2026-10-01-mad-test-6',
    device,
    google_account: device === 'android' ? 'anna.hansen@gmail.com' : null,
  }
}

// A tester: eligible signup plus a yes in mad_test_optin.
function tester(overrides: Partial<SignupRow> = {}) {
  db.signups.set(TOKEN, eligible(overrides))
  db.optins.set(PUBLIC_ID, yes())
}

function url(token?: string) {
  const u = new URL('https://altidmad.dk/api/mad-testen/open')
  if (token !== undefined) u.searchParams.set('t', token)
  return u
}

// What navigator.sendBeacon sends for a URLSearchParams body.
const BEACON_TYPE = 'application/x-www-form-urlencoded;charset=UTF-8'

function send(target: URL | string, body: string, type: string | null = BEACON_TYPE) {
  return POST(new NextRequest(target, { method: 'POST', body, headers: type ? { 'Content-Type': type } : {} }))
}
const beacon = (token: string | undefined, page: string) => send(url(token), `page=${page}`)

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
  db.surveys.clear()
  db.opens.clear()
  db.upserts.length = 0
  db.filters.length = 0
  db.signupReadError = null
  db.optinReadError = null
  db.insertError = null
  db.clock = 0
  // Fresh spies per test, so call counts never leak between tests.
  vi.restoreAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

// Links whose token is not a uuid: refused before any query is made.
const NOT_A_UUID: Array<[string, string | undefined]> = [
  ['no token', undefined],
  ['empty token', ''],
  ['?t=abc', 'abc'],
  ['truncated uuid', TOKEN.slice(0, 30)],
  ['uuid with extra characters', `${TOKEN}0`],
  ['overlong string', 'x'.repeat(5000)],
]

// Every reason the yes-page refuses a link, refused here too for page optin.
const REFUSED_OPTIN: Array<[string, () => string | undefined]> = [
  ...NOT_A_UUID.map(([name, token]): [string, () => string | undefined] => [name, () => token]),
  ['unknown token', () => '00000000-0000-4000-8000-000000000000'],
  ['unsubscribed', () => (db.signups.set(TOKEN, eligible({ unsubscribed: true })), TOKEN)],
  ['no Altid Mad consent', () => (db.signups.set(TOKEN, eligible({ marketing_consent_mad: false })), TOKEN)],
  ['NULL Altid Mad consent (legacy row)', () => (db.signups.set(TOKEN, eligible({ marketing_consent_mad: null })), TOKEN)],
  ['Hjem-form signup', () => (db.signups.set(TOKEN, eligible({ signup_source: 'altid-hjem' })), TOKEN)],
  ['no signup source', () => (db.signups.set(TOKEN, eligible({ signup_source: null })), TOKEN)],
]

// Every reason the survey refuses a link, refused here too for page survey.
const REFUSED_SURVEY: Array<[string, () => string | undefined]> = [
  ...REFUSED_OPTIN,
  ['on the list, but never said yes to the test', () => (db.signups.set(TOKEN, eligible()), TOKEN)],
  ['said yes, then unsubscribed', () => (tester({ unsubscribed: true }), TOKEN)],
]

// The beacon a rendered page sends when a real browser shows it: the page's
// own handlers run in the fake browser (test/fake-browser.ts), and the one
// beacon they send is resolved against the page's origin. null when the page
// sends none; more than one fails the test.
function beaconIn(html: string): { target: string; body: string } | null {
  const { beacons, errors } = showPage(html)
  expect(errors).toEqual([])
  expect(beacons.length).toBeLessThanOrEqual(1)
  return beacons[0] ? { target: `https://altidmad.dk${beacons[0].url}`, body: beacons[0].body } : null
}

describe('POST /api/mad-testen/open', () => {
  it('page optin, an eligible signup: writes one row for that person and page, 204 with no body', async () => {
    db.signups.set(TOKEN, eligible())
    const res = await beacon(TOKEN, 'optin')

    expect(res.status).toBe(204)
    expect(await res.text()).toBe('')
    expect(res.headers.get('Cache-Control')).toBe('private, no-store')
    expect(res.headers.getSetCookie()).toEqual([])
    expect(db.upserts).toEqual([
      {
        table: 'mad_test_page_open',
        row: { public_id: PUBLIC_ID, page: 'optin' },
        opts: { onConflict: 'public_id,page', ignoreDuplicates: true },
      },
    ])
    // Looked up by the secret token, the same query the yes-page makes.
    expect(db.filters).toEqual([{ table: 'signup', col: 'unsub_token', value: TOKEN }])
    expect([...db.opens.values()].map((r) => [r.public_id, r.page])).toEqual([[PUBLIC_ID, 'optin']])
    expect(console.warn).not.toHaveBeenCalled()
    expect(console.error).not.toHaveBeenCalled()
  })

  it('page survey, a tester: writes one row for the survey, checked like the survey page', async () => {
    tester()
    const res = await beacon(TOKEN, 'survey')

    expect(res.status).toBe(204)
    expect(db.upserts.map((u) => u.row)).toEqual([{ public_id: PUBLIC_ID, page: 'survey' }])
    expect(db.filters).toEqual([
      { table: 'signup', col: 'unsub_token', value: TOKEN },
      { table: 'mad_test_optin', col: 'public_id', value: PUBLIC_ID },
    ])
  })

  it('a second open of the same page keeps the first row and its time', async () => {
    db.signups.set(TOKEN, eligible())
    expect((await beacon(TOKEN, 'optin')).status).toBe(204)
    const first = db.opens.get(`${PUBLIC_ID}|optin`)

    expect((await beacon(TOKEN, 'optin')).status).toBe(204)
    expect(db.upserts).toHaveLength(2)
    expect(db.opens.size).toBe(1)
    expect(db.opens.get(`${PUBLIC_ID}|optin`)).toBe(first)
  })

  it('the two pages are two rows for the same person', async () => {
    tester()
    await beacon(TOKEN, 'optin')
    await beacon(TOKEN, 'survey')
    expect([...db.opens.keys()].sort()).toEqual([`${PUBLIC_ID}|optin`, `${PUBLIC_ID}|survey`])
  })

  it('page optin after the answer is stored still counts (the iPhone route sends its form straight after the beacon)', async () => {
    db.signups.set(TOKEN, eligible())
    db.optins.set(PUBLIC_ID, yes())
    expect((await beacon(TOKEN, 'optin')).status).toBe(204)
    expect(db.opens.has(`${PUBLIC_ID}|optin`)).toBe(true)
  })

  it.each(REFUSED_OPTIN)('page optin, %s: 400, nothing written, logged without the token', async (_, setup) => {
    const token = setup()
    const res = await beacon(token, 'optin')

    expect(res.status).toBe(400)
    expect(await res.text()).toBe('')
    expect(db.upserts).toEqual([])
    expect(console.warn).toHaveBeenCalledWith('mad-testen open refused: not a Mad-testen link for page optin')
    expect(console.error).not.toHaveBeenCalled()
  })

  it.each(REFUSED_SURVEY)('page survey, %s: 400, nothing written', async (_, setup) => {
    const res = await beacon(setup(), 'survey')

    expect(res.status).toBe(400)
    expect(db.upserts).toEqual([])
    expect(console.warn).toHaveBeenCalledWith('mad-testen open refused: not a Mad-testen link for page survey')
  })

  it.each(NOT_A_UUID)('%s: refused without a single database query', async (_, token) => {
    expect((await beacon(token, 'optin')).status).toBe(400)
    expect((await beacon(token, 'survey')).status).toBe(400)
    expect(db.filters).toEqual([])
    expect(db.upserts).toEqual([])
  })

  it.each([
    ['no page', ''],
    ['an empty page', 'page='],
    ['an unknown page', 'page=thanks'],
    ['an upper-case page', 'page=OPTIN'],
    ['the page twice', 'page=optin&page=optin'],
    ['two different pages', 'page=optin&page=survey'],
  ])('%s with a valid token: 400, nothing read or written', async (_, body) => {
    tester()
    const res = await send(url(TOKEN), body)

    expect(res.status).toBe(400)
    expect(db.filters).toEqual([])
    expect(db.upserts).toEqual([])
    expect(console.warn).toHaveBeenCalledWith('mad-testen open refused: page is not optin or survey')
  })

  it('a file under page: 400, nothing written', async () => {
    tester()
    const form = new FormData()
    form.set('page', new Blob(['optin']), 'page.txt')
    const encoded = new Response(form)
    const res = await POST(
      new NextRequest(url(TOKEN), {
        method: 'POST',
        body: await encoded.arrayBuffer(),
        headers: { 'Content-Type': encoded.headers.get('Content-Type') ?? '' },
      }),
    )
    expect(res.status).toBe(400)
    expect(db.upserts).toEqual([])
  })

  it.each([
    ['JSON', 'application/json', JSON.stringify({ page: 'optin' })],
    ['text/plain (a beacon with a string body)', 'text/plain;charset=UTF-8', 'page=optin'],
    ['no content type', null, 'page=optin'],
  ])('%s body with a valid token: 400, nothing written', async (_, type, body) => {
    tester()
    const res = await send(url(TOKEN), body, type)

    expect(res.status).toBe(400)
    expect(db.upserts).toEqual([])
    expect(console.warn).toHaveBeenCalledWith('mad-testen open refused: body is not form data')
    expect(console.error).not.toHaveBeenCalled()
  })

  it('insert fails: 500, logged, nothing pretends it was written', async () => {
    db.signups.set(TOKEN, eligible())
    db.insertError = { message: 'relation "public.mad_test_page_open" does not exist' }
    const res = await beacon(TOKEN, 'optin')

    expect(res.status).toBe(500)
    expect(await res.text()).toBe('')
    expect(db.opens.size).toBe(0)
    expect(console.error).toHaveBeenCalledWith('mad-testen open POST failed', expect.any(Error))
    const err = vi.mocked(console.error).mock.calls[0][1] as Error
    expect(err.message).toBe('mad_test_page_open insert failed: relation "public.mad_test_page_open" does not exist')
  })

  it('signup read fails: 500, nothing written', async () => {
    db.signupReadError = { message: 'timeout' }
    const res = await beacon(TOKEN, 'optin')

    expect(res.status).toBe(500)
    expect(db.upserts).toEqual([])
    expect(console.error).toHaveBeenCalledWith('mad-testen open POST failed', expect.any(Error))
  })

  it('yes-list read fails on a survey open: 500, nothing written', async () => {
    db.signups.set(TOKEN, eligible())
    db.optinReadError = { message: 'timeout' }
    expect((await beacon(TOKEN, 'survey')).status).toBe(500)
    expect(db.upserts).toEqual([])
  })

  it('answers POST only: a GET (a scanner following the URL) has no handler here', () => {
    expect(Object.keys(openRoute).sort()).toEqual(['POST'])
  })
})

describe('the beacon each page sends lands', () => {
  function phone(d?: string) {
    const u = new URL('https://altidmad.dk/api/mad-testen')
    u.searchParams.set('t', TOKEN)
    if (d) u.searchParams.set('d', d)
    return new NextRequest(u)
  }

  it.each([
    ['the iPhone route', 'iphone'],
    ['the Android Google-account step', 'android'],
    ['the two-button form', undefined],
  ])('%s: its beacon writes the optin row', async (_, d) => {
    db.signups.set(TOKEN, eligible())
    const sent = beaconIn(await (await yesGet(phone(d))).text())

    expect(sent).toEqual({ target: `https://altidmad.dk/api/mad-testen/open?t=${TOKEN}`, body: 'page=optin' })
    expect((await send(sent!.target, sent!.body)).status).toBe(204)
    expect([...db.opens.keys()]).toEqual([`${PUBLIC_ID}|optin`])
  })

  it('the Google-account step reached through the Android button (a POST): the same beacon', async () => {
    db.signups.set(TOKEN, eligible())
    const html = await (
      await yesPost(
        new NextRequest(`https://altidmad.dk/api/mad-testen?t=${TOKEN}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'device=android',
        }),
      )
    ).text()
    expect(beaconIn(html)).toEqual({ target: `https://altidmad.dk/api/mad-testen/open?t=${TOKEN}`, body: 'page=optin' })
  })

  it('the survey form: its beacon writes the survey row', async () => {
    tester()
    const u = new URL('https://altidmad.dk/api/mad-testen/survey')
    u.searchParams.set('t', TOKEN)
    const sent = beaconIn(await (await surveyGet(new NextRequest(u))).text())

    expect(sent).toEqual({ target: `https://altidmad.dk/api/mad-testen/open?t=${TOKEN}`, body: 'page=survey' })
    expect((await send(sent!.target, sent!.body)).status).toBe(204)
    expect([...db.opens.keys()]).toEqual([`${PUBLIC_ID}|survey`])
  })
})
