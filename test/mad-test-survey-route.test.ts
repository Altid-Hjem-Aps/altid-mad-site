import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// The survey runs the REAL lib/db helpers against a scripted Supabase client,
// so these tests pin the queries (table, selected columns, filter column, upsert
// options) as well as the screens. The client returns ONLY the columns a select
// names, like PostgREST: a helper that stops selecting a column gets undefined
// back and the screens change.

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

type SurveyRow = {
  public_id: string
  created_at: string
  copy_version: string
  days_used: unknown
  progress: unknown
  recommend: unknown
  worked_best: unknown
  fix_first: unknown
}

const db = {
  signups: new Map<string, SignupRow>(), // keyed by unsub_token
  optins: new Map<string, OptinRow>(),
  surveys: new Map<string, SurveyRow>(),
  // Runs inside the upsert before it resolves: simulates a competing answer
  // landing between the route's "already answered?" read and its insert.
  beforeUpsert: null as (() => void) | null,
  upserts: [] as Array<{ table: string; row: Record<string, unknown>; opts: unknown }>,
  filters: [] as Array<{ table: string; col: string; value: unknown }>,
  selects: [] as Array<{ table: string; cols: string }>,
  signupReadError: null as { message: string } | null,
  optinReadError: null as { message: string } | null,
  surveyReadError: null as { message: string } | null,
  insertError: null as { message: string } | null,
  // The upsert reports success but stores nothing.
  dropInsert: false,
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
            if (table === 'mad_test_survey') {
              return Promise.resolve({ data: project(db.surveys.get(value), cols), error: db.surveyReadError })
            }
            throw new Error(`unexpected table ${table}`)
          },
        }),
      }),
      upsert: (row: Record<string, unknown>, opts: { ignoreDuplicates?: boolean }) => {
        if (table !== 'mad_test_survey') throw new Error(`unexpected upsert into ${table}`)
        db.upserts.push({ table, row, opts })
        db.beforeUpsert?.()
        if (db.insertError) return Promise.resolve({ error: db.insertError })
        if (db.dropInsert) return Promise.resolve({ error: null })
        const id = row.public_id as string
        // ON CONFLICT DO NOTHING: the first answer stays.
        if (!db.surveys.has(id) || !opts.ignoreDuplicates) {
          db.surveys.set(id, {
            public_id: id,
            created_at: new Date().toISOString(),
            copy_version: row.copy_version as string,
            days_used: row.days_used,
            progress: row.progress,
            recommend: row.recommend,
            worked_best: row.worked_best,
            fix_first: row.fix_first,
          })
        }
        return Promise.resolve({ error: null })
      },
    }),
  }),
}))

import { GET, POST } from '@/app/api/mad-testen/survey/route'
import { MAD_TEST_SURVEY_COPY_VERSION } from '@/lib/mad-test-survey'

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
    copy_version: '2026-09-29-mad-test-3',
    device,
    google_account: device === 'android' ? 'anna.hansen@gmail.com' : null,
  }
}

// A tester: eligible signup plus a yes in mad_test_optin.
function tester(overrides: Partial<SignupRow> = {}) {
  db.signups.set(TOKEN, eligible(overrides))
  db.optins.set(PUBLIC_ID, yes())
}

function stored(overrides: Partial<SurveyRow> = {}): SurveyRow {
  return {
    public_id: PUBLIC_ID,
    created_at: '2026-10-04T08:00:00Z',
    copy_version: MAD_TEST_SURVEY_COPY_VERSION,
    days_used: '2-3',
    progress: 'shopped',
    recommend: 8,
    worked_best: null,
    fix_first: null,
    ...overrides,
  }
}

function url(token?: string) {
  const u = new URL('https://altidmad.dk/api/mad-testen/survey')
  if (token !== undefined) u.searchParams.set('t', token)
  return u
}

const get = (token?: string) => GET(new NextRequest(url(token)))

// What the form sends, urlencoded like a browser.
const FULL = {
  days_used: '4+',
  progress: 'plan',
  recommend: '9',
  worked_best: '  Madplanen på to minutter.\r\nOg tilbuddene.  ',
  fix_first: 'Indkøbslisten hopper.',
}
function post(token: string | undefined, fields: Record<string, string> = FULL) {
  return POST(
    new NextRequest(url(token), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields).toString(),
    }),
  )
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
  db.surveys.clear()
  db.upserts.length = 0
  db.filters.length = 0
  db.selects.length = 0
  db.beforeUpsert = null
  db.signupReadError = null
  db.optinReadError = null
  db.surveyReadError = null
  db.insertError = null
  db.dropInsert = false
  // Fresh spy per test, so call counts never leak between tests.
  vi.restoreAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
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

// Every reason a link is refused. The page must answer all of them with the
// exact same bytes and status, so it never tells anyone who is on the list or
// in the test.
const REFUSED: Array<[string, () => string | undefined]> = [
  ...NOT_A_UUID.map(([name, token]): [string, () => string | undefined] => [name, () => token]),
  ['unknown token', () => '00000000-0000-4000-8000-000000000000'],
  ['on the list, but never said yes to the test', () => (db.signups.set(TOKEN, eligible()), TOKEN)],
  ['said yes, then unsubscribed', () => (tester({ unsubscribed: true }), TOKEN)],
  ['said yes, then withdrew Altid Mad consent', () => (tester({ marketing_consent_mad: false }), TOKEN)],
  ['NULL Altid Mad consent (legacy row)', () => (tester({ marketing_consent_mad: null }), TOKEN)],
  ['Hjem-form signup', () => (tester({ signup_source: 'altid-hjem' }), TOKEN)],
  ['no signup source', () => (tester({ signup_source: null }), TOKEN)],
]

async function referenceInvalid() {
  const res = await get()
  return { status: res.status, body: await res.text() }
}

describe('GET /api/mad-testen/survey', () => {
  it('a tester who has not answered: greets by first name, shows the five questions, writes nothing', async () => {
    tester()
    const res = await get(TOKEN)
    const html = await res.text()

    expect(res.status).toBe(200)
    expect(html).toContain('<p class="hello">Hej Anna,</p>')
    expect(html).toContain('<h1>Hvordan gik de første dage med Altid&nbsp;Mad?</h1>')
    expect(html).toContain(
      '<p class="lead">Fem korte spørgsmål. Det tager to minutter, og dine svar går direkte til holdet bag appen.</p>',
    )
    expect(html).toContain(`<form method="POST" action="/api/mad-testen/survey?t=${TOKEN}" class="survey"`)
    expect(html.match(/<fieldset/g)).toHaveLength(3)
    expect(html.match(/<textarea/g)).toHaveLength(2)
    expect(html).toContain('<button type="submit" class="primary">Send svar</button>')
    expect(html).not.toContain(' checked')
    expect(html).not.toContain('aria-invalid="true"')
    expect(db.upserts).toHaveLength(0)
    // Looked up by the secret token, then the yes-list and the survey by the signup's own id.
    expect(db.filters).toEqual([
      { table: 'signup', col: 'unsub_token', value: TOKEN },
      { table: 'mad_test_optin', col: 'public_id', value: PUBLIC_ID },
      { table: 'mad_test_survey', col: 'public_id', value: PUBLIC_ID },
    ])
    expect(db.selects.find((q) => q.table === 'mad_test_survey')?.cols).toBe(
      'public_id, created_at, copy_version, days_used, progress, recommend, worked_best, fix_first',
    )
  })

  it('an Android tester and the exit-intent form are testers too', async () => {
    db.signups.set(TOKEN, eligible({ signup_source: 'altid-mad-exit' }))
    db.optins.set(PUBLIC_ID, yes('android'))
    const res = await get(TOKEN)
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('Send svar</button>')
  })

  it('greets without a name when the signup has none', async () => {
    tester({ first_name: null })
    expect(await (await get(TOKEN)).text()).toContain('<p class="hello">Hej,</p>')
  })

  it('escapes the first name', async () => {
    tester({ first_name: '<script>alert("x")</script>' })
    const html = await (await get(TOKEN)).text()
    expect(html).not.toContain('<script>alert')
    expect(html).toContain('Hej &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;,')
  })

  it('never cached, never indexed, never leaks the link in a Referer, no cookie', async () => {
    tester()
    for (const res of [await get(TOKEN), await get(), await post(TOKEN), await post(TOKEN, {})]) {
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

  it('the refusal is the yes-page refusal, byte for byte', async () => {
    const { GET: yesGet } = await import('@/app/api/mad-testen/route')
    const yesInvalid = await (await yesGet(new NextRequest('https://altidmad.dk/api/mad-testen'))).text()
    expect((await referenceInvalid()).body).toBe(yesInvalid)
  })

  it('already answered: says so, no form, nothing written', async () => {
    tester()
    db.surveys.set(PUBLIC_ID, stored())
    const res = await get(TOKEN)
    const html = await res.text()

    expect(res.status).toBe(200)
    expect(html).toContain('<h1>Tak, vi har allerede dine svar</h1>')
    expect(html).not.toContain('<form')
    expect(db.upserts).toHaveLength(0)
  })

  it.each([
    ['an unknown days_used', stored({ days_used: '7' })],
    ['an unknown progress', stored({ progress: 'cooked' })],
    ['recommend out of range', stored({ recommend: 11 })],
    ['recommend as text', stored({ recommend: '8' })],
    ['an empty text answer (should be null)', stored({ worked_best: '' })],
    ['an over-long text answer', stored({ fix_first: 'x'.repeat(2001) })],
  ])('a stored survey row with %s: 500, never a guessed screen', async (_, row) => {
    tester()
    db.surveys.set(PUBLIC_ID, row)
    expect((await get(TOKEN)).status).toBe(500)
  })

  it.each([
    ['signup', () => (db.signupReadError = { message: 'connection reset' })],
    ['yes-list', () => (db.optinReadError = { message: 'timeout' })],
    ['survey', () => (db.surveyReadError = { message: 'relation "mad_test_survey" does not exist' })],
  ])('%s read fails: error screen with 500, not a form or an invalid link', async (_, fail) => {
    tester()
    fail()
    const res = await get(TOKEN)
    const html = await res.text()

    expect(res.status).toBe(500)
    expect(html).toContain('Noget gik galt')
    expect(html).not.toContain('Linket virker ikke')
    expect(html).not.toContain('<form')
  })

  it('a stored yes-row that breaks its own checks: 500 (the yes-page helper is reused)', async () => {
    tester()
    db.optins.set(PUBLIC_ID, yes('windows'))
    expect((await get(TOKEN)).status).toBe(500)
  })

  it.each(NOT_A_UUID)('%s: invalid screen without a single database query', async (_, token) => {
    const ref = await referenceInvalid()
    for (const res of [await get(token), await post(token)]) {
      expect(res.status).toBe(400)
      expect(await res.text()).toBe(ref.body)
    }
    expect(db.selects).toEqual([])
    expect(db.upserts).toEqual([])
  })

  it('accepts an upper-case uuid (Postgres reads it as the same value)', async () => {
    db.signups.set(TOKEN.toUpperCase(), eligible())
    db.optins.set(PUBLIC_ID, yes())
    expect((await get(TOKEN.toUpperCase())).status).toBe(200)
  })
})

describe('POST /api/mad-testen/survey', () => {
  it('a full answer: recorded exactly once, text trimmed with its line break kept, thank-you screen', async () => {
    tester()
    const res = await post(TOKEN)
    const html = await res.text()

    expect(res.status).toBe(200)
    expect(db.upserts).toEqual([
      {
        table: 'mad_test_survey',
        row: {
          public_id: PUBLIC_ID,
          copy_version: MAD_TEST_SURVEY_COPY_VERSION,
          days_used: '4+',
          progress: 'plan',
          recommend: 9,
          worked_best: 'Madplanen på to minutter.\nOg tilbuddene.',
          fix_first: 'Indkøbslisten hopper.',
        },
        opts: { onConflict: 'public_id', ignoreDuplicates: true },
      },
    ])
    expect(html).toContain('<h1>Tak for dine svar</h1>')
    expect(html).toContain(
      '<p class="lead">Vi læser dem alle. Har du mere på hjerte, så tryk på Feedback i appen eller skriv til <a href="mailto:hej@altidmad.dk">hej@altidmad.dk</a>.</p>',
    )
    expect(html).not.toContain('<form')
  })

  it('the two text questions are optional: empty or whitespace is stored as null', async () => {
    tester()
    const res = await post(TOKEN, { days_used: '0', progress: 'none', recommend: '0', worked_best: '  \r\n ', fix_first: '' })

    expect(res.status).toBe(200)
    expect(db.upserts.map((u) => u.row)).toEqual([
      {
        public_id: PUBLIC_ID,
        copy_version: MAD_TEST_SURVEY_COPY_VERSION,
        days_used: '0',
        progress: 'none',
        recommend: 0,
        worked_best: null,
        fix_first: null,
      },
    ])
    expect(await res.text()).toContain('<h1>Tak for dine svar</h1>')
  })

  it('text fields left out of the body entirely are null too', async () => {
    tester()
    await post(TOKEN, { days_used: '1', progress: 'shopped', recommend: '10' })
    expect(db.upserts.map((u) => [u.row.worked_best, u.row.fix_first, u.row.recommend])).toEqual([[null, null, 10]])
  })

  it.each([
    ['1', '1'],
    ['2-3', '2-3'],
  ])('days_used %s is stored as the string %s', async (sent, want) => {
    tester()
    await post(TOKEN, { ...FULL, days_used: sent })
    expect(db.upserts[0].row.days_used).toBe(want)
  })

  it('2000 characters is accepted, emoji counted as one character each (as Postgres counts)', async () => {
    tester()
    const text = '🥕'.repeat(2000)
    const res = await post(TOKEN, { ...FULL, worked_best: text })
    expect(res.status).toBe(200)
    expect(db.upserts[0].row.worked_best).toBe(text)
  })

  it('NUL characters are removed before storing (Postgres text cannot hold them)', async () => {
    tester()
    await post(TOKEN, { ...FULL, fix_first: 'a\u0000b' })
    expect(db.upserts[0].row.fix_first).toBe('ab')
  })

  it.each([
    ['nothing at all', {}, ['days_used', 'progress', 'recommend']],
    ['question 1 missing', { ...FULL, days_used: '' }, ['days_used']],
    ['question 1 out of range', { ...FULL, days_used: '7' }, ['days_used']],
    ['question 1 as a label', { ...FULL, days_used: '4 dage eller flere' }, ['days_used']],
    ['question 2 missing', { ...FULL, progress: '' }, ['progress']],
    ['question 2 out of range', { ...FULL, progress: 'PLAN' }, ['progress']],
    ['question 3 missing', { ...FULL, recommend: '' }, ['recommend']],
    ['question 3 above 10', { ...FULL, recommend: '11' }, ['recommend']],
    ['question 3 below 0', { ...FULL, recommend: '-1' }, ['recommend']],
    ['question 3 not an integer', { ...FULL, recommend: '7.5' }, ['recommend']],
    ['question 3 with a leading zero', { ...FULL, recommend: '07' }, ['recommend']],
    ['question 3 with spaces', { ...FULL, recommend: ' 7' }, ['recommend']],
    ['question 4 over 2000 characters', { ...FULL, worked_best: 'x'.repeat(2001) }, ['worked_best']],
    ['question 5 over 2000 characters', { ...FULL, fix_first: 'x'.repeat(2001) }, ['fix_first']],
  ] as Array<[string, Record<string, string>, string[]]>)(
    '%s: the form again with an inline error per question, status 200, nothing written',
    async (_, fields, bad) => {
      tester()
      const res = await post(TOKEN, fields)
      const html = await res.text()

      expect(res.status).toBe(200)
      expect(db.upserts).toHaveLength(0)
      expect(html).toContain('<p class="err-top" role="alert">Tjek de markerede spørgsmål, og send igen.</p>')
      for (const name of ['days_used', 'progress', 'recommend', 'worked_best', 'fix_first']) {
        const err = `id="${name}-err"`
        if (bad.includes(name)) {
          expect(html).toContain(err)
          expect(html).toContain(`name="${name}"`)
          expect(html).toMatch(new RegExp(`name="${name}"[^>]*aria-invalid="true" aria-describedby="${name}-err"`))
        } else {
          expect(html).not.toContain(err)
          expect(html).not.toMatch(new RegExp(`name="${name}"[^>]*aria-invalid`))
        }
      }
      expect(html.match(/class="err"/g)).toHaveLength(bad.length)
    },
  )

  it('keeps the valid answers of a failed submission, and not the invalid ones', async () => {
    tester()
    const html = await (await post(TOKEN, { days_used: '2-3', progress: 'bogus', recommend: '6', worked_best: 'Godt', fix_first: '' })).text()

    expect(html.match(/ checked/g)).toHaveLength(2)
    expect(html).toMatch(/name="days_used" value="2-3" required checked/)
    expect(html).toMatch(/name="recommend" value="6" required checked/)
    expect(html).not.toMatch(/name="progress"[^>]* checked/)
    expect(html).toMatch(/<textarea id="worked_best" name="worked_best"[^>]*>Godt<\/textarea>/)
    expect(html).toMatch(/<textarea id="fix_first" name="fix_first"[^>]*><\/textarea>/)
    expect(html).toContain('Vælg et svar.')
  })

  it('an over-long text answer is shown again so it can be shortened, with the length error', async () => {
    tester()
    const long = 'ø'.repeat(2001)
    const html = await (await post(TOKEN, { ...FULL, fix_first: long })).text()
    expect(html).toContain(`>${long}</textarea>`)
    expect(html).toContain('<p id="fix_first-err" class="err">Svaret er for langt. Skriv højst 2000 tegn.</p>')
  })

  it('a huge text answer is echoed only up to 20000 characters', async () => {
    tester()
    const html = await (await post(TOKEN, { ...FULL, worked_best: 'a'.repeat(50_000) })).text()
    expect(html).toContain(`>${'a'.repeat(20_000)}</textarea>`)
    expect(html).not.toContain('a'.repeat(20_001))
    expect(db.upserts).toHaveLength(0)
  })

  it('escapes the text answers when showing the form again', async () => {
    tester()
    const html = await (
      await post(TOKEN, { days_used: '', progress: 'plan', recommend: '5', worked_best: '</textarea><script>x</script>', fix_first: '"&\'' })
    ).text()

    expect(html).not.toContain('<script>x')
    expect(html).toContain('>&lt;/textarea&gt;&lt;script&gt;x&lt;/script&gt;</textarea>')
    expect(html).toContain('>&quot;&amp;&#39;</textarea>')
  })

  it('stores text answers raw (escaping is for display only)', async () => {
    tester()
    await post(TOKEN, { ...FULL, worked_best: '<b>Tak & "hej"</b>' })
    expect(db.upserts[0].row.worked_best).toBe('<b>Tak & "hej"</b>')
  })

  it('a repeat answer keeps the first row and shows the already screen', async () => {
    tester()
    await post(TOKEN)
    const first = db.surveys.get(PUBLIC_ID)

    for (const res of [await post(TOKEN, { ...FULL, recommend: '2' }), await post(TOKEN, {}), await get(TOKEN)]) {
      expect(res.status).toBe(200)
      expect(await res.text()).toContain('<h1>Tak, vi har allerede dine svar</h1>')
    }
    expect(db.upserts).toHaveLength(1)
    expect(db.surveys.size).toBe(1)
    expect(db.surveys.get(PUBLIC_ID)).toBe(first)
  })

  it('a competing answer that lands first wins, and the screen says the answers are already in', async () => {
    tester()
    db.beforeUpsert = () => {
      db.surveys.set(PUBLIC_ID, stored({ recommend: 3 }))
    }
    const res = await post(TOKEN)

    expect(res.status).toBe(200)
    expect(await res.text()).toContain('<h1>Tak, vi har allerede dine svar</h1>')
    expect(db.surveys.get(PUBLIC_ID)?.recommend).toBe(3)
  })

  it('a competing identical answer (double tap): thank-you, one row', async () => {
    tester()
    db.beforeUpsert = () => {
      db.surveys.set(
        PUBLIC_ID,
        stored({ days_used: '4+', progress: 'plan', recommend: 9, worked_best: 'Madplanen på to minutter.\nOg tilbuddene.', fix_first: 'Indkøbslisten hopper.' }),
      )
    }
    expect(await (await post(TOKEN)).text()).toContain('<h1>Tak for dine svar</h1>')
    expect(db.surveys.size).toBe(1)
  })

  it('the row missing right after the insert: 500, never the thank-you screen', async () => {
    tester()
    db.dropInsert = true
    const res = await post(TOKEN)
    expect(res.status).toBe(500)
    expect(await res.text()).not.toContain('Tak')
  })

  it.each([
    ['JSON', 'application/json', JSON.stringify(FULL)],
    ['text/plain', 'text/plain', new URLSearchParams(FULL).toString()],
    ['no content type', null, new URLSearchParams(FULL).toString()],
  ])('%s body with a valid token: invalid-link screen, nothing written', async (_, type, body) => {
    tester()
    const ref = await referenceInvalid()
    const res = await POST(
      new NextRequest(url(TOKEN), { method: 'POST', body, headers: type ? { 'Content-Type': type } : {} }),
    )

    expect(res.status).toBe(400)
    expect(await res.text()).toBe(ref.body)
    expect(db.upserts).toEqual([])
    expect(console.error).not.toHaveBeenCalled()
  })

  it('multipart form data is form data too', async () => {
    tester()
    const form = new FormData()
    for (const [k, v] of Object.entries(FULL)) form.set(k, v)
    const res = await POST(new NextRequest(url(TOKEN), { method: 'POST', body: form }))
    expect(res.status).toBe(200)
    expect(db.upserts).toHaveLength(1)
  })

  it.each(REFUSED)('%s: never inserts, same invalid-link screen', async (_, setup) => {
    const ref = await referenceInvalid()
    const res = await post(setup())

    expect(res.status).toBe(400)
    expect(await res.text()).toBe(ref.body)
    expect(db.upserts).toHaveLength(0)
  })

  it('insert fails: 500 error screen, never the thank-you screen', async () => {
    tester()
    db.insertError = { message: 'permission denied for table mad_test_survey' }
    const res = await post(TOKEN)
    const html = await res.text()

    expect(res.status).toBe(500)
    expect(html).toContain('Noget gik galt')
    expect(html).not.toContain('Tak')
    expect(console.error).toHaveBeenCalledWith('mad-testen survey POST failed', expect.any(Error))
  })

  it.each([
    ['signup', () => (db.signupReadError = { message: 'timeout' })],
    ['yes-list', () => (db.optinReadError = { message: 'timeout' })],
    ['survey', () => (db.surveyReadError = { message: 'timeout' })],
  ])('%s read fails: 500, nothing inserted', async (_, fail) => {
    tester()
    fail()
    const res = await post(TOKEN)

    expect(res.status).toBe(500)
    expect(db.upserts).toHaveLength(0)
  })
})
