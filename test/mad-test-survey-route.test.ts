// @vitest-environment node
// Node, as in production: under jsdom, File is jsdom's and the request's
// multipart parser cannot build a file part, so a post with a file would be
// refused by the parser and never reach the route's own check.
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
  plan_fit: unknown
  plan_fit_note: unknown
  easy_to_use: unknown
  easy_note: unknown
  missing: unknown
  other_feedback: unknown
  panel: unknown
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
            plan_fit: row.plan_fit,
            plan_fit_note: row.plan_fit_note,
            easy_to_use: row.easy_to_use,
            easy_note: row.easy_note,
            missing: row.missing,
            other_feedback: row.other_feedback,
            panel: row.panel,
          })
        }
        return Promise.resolve({ error: null })
      },
    }),
  }),
}))

import { GET, POST } from '@/app/api/mad-testen/survey/route'
import { MAD_TEST_SURVEY_COPY_VERSION, SURVEY_BODY_MAX } from '@/lib/mad-test-survey'

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
    plan_fit: 'delvist',
    plan_fit_note: null,
    easy_to_use: 'ja',
    easy_note: null,
    missing: null,
    other_feedback: null,
    panel: true,
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
  plan_fit: 'delvist',
  plan_fit_note: '  Vi er fire, planen var til to.\r\nMen retterne var gode.  ',
  easy_to_use: 'ja',
  easy_note: 'Indkøbslisten hopper.',
  missing: 'Aftensmad til børn.',
  other_feedback: '\nTak for testen.\n',
  panel: 'ja',
}
// FULL as it is stored.
const FULL_ROW = {
  plan_fit: 'delvist',
  plan_fit_note: 'Vi er fire, planen var til to.\nMen retterne var gode.',
  easy_to_use: 'ja',
  easy_note: 'Indkøbslisten hopper.',
  missing: 'Aftensmad til børn.',
  other_feedback: 'Tak for testen.',
  panel: true,
}
const TEXT_FIELDS = ['plan_fit_note', 'easy_note', 'missing', 'other_feedback'] as const
const ALL_FIELDS = ['plan_fit', 'plan_fit_note', 'easy_to_use', 'easy_note', 'missing', 'other_feedback', 'panel']
// A POST with the content-length a browser sends (the route reads no body
// without one). `size` overrides it; null leaves it out.
function send(
  token: string | undefined,
  body: string | ArrayBuffer,
  type: string | null,
  size: string | null = String(typeof body === 'string' ? Buffer.byteLength(body) : body.byteLength),
) {
  const headers: Record<string, string> = {}
  if (type) headers['Content-Type'] = type
  if (size !== null) headers['Content-Length'] = size
  return POST(new NextRequest(url(token), { method: 'POST', headers, body }))
}
function post(token: string | undefined, fields: Record<string, string> = FULL) {
  return send(token, new URLSearchParams(fields).toString(), 'application/x-www-form-urlencoded')
}
// The form as multipart/form-data, encoded the way fetch encodes a FormData body.
async function postMultipart(token: string, form: FormData) {
  const encoded = new Response(form)
  return send(token, await encoded.arrayBuffer(), encoded.headers.get('Content-Type'))
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
    expect(html).toContain('<h1>Hej Anna, hvordan gik de første dage med Altid&nbsp;Mad?</h1>')
    expect(html).not.toContain('class="hello"')
    expect(html).not.toContain('class="lead"')
    expect(html).toContain(`<form method="POST" action="/api/mad-testen/survey?t=${TOKEN}" class="survey"`)
    expect(html.match(/<fieldset/g)).toHaveLength(3)
    expect(html.match(/<textarea/g)).toHaveLength(4)
    for (const name of ALL_FIELDS) expect(html).toContain(`name="${name}"`)
    expect(html).toContain('<button type="submit" class="primary">Send mine svar</button>')
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
      'public_id, created_at, copy_version, plan_fit, plan_fit_note, easy_to_use, easy_note, missing, other_feedback, panel',
    )
  })

  it('an Android tester and the exit-intent form are testers too', async () => {
    db.signups.set(TOKEN, eligible({ signup_source: 'altid-mad-exit' }))
    db.optins.set(PUBLIC_ID, yes('android'))
    const res = await get(TOKEN)
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('Send mine svar</button>')
  })

  it('greets without a name when the signup has none', async () => {
    tester({ first_name: null })
    expect(await (await get(TOKEN)).text()).toContain('<h1>Hej, hvordan gik de første dage med Altid&nbsp;Mad?</h1>')
  })

  it('escapes the first name', async () => {
    tester({ first_name: '<script>alert("x")</script>' })
    const html = await (await get(TOKEN)).text()
    expect(html).not.toContain('<script>alert')
    expect(html).toContain('<h1>Hej &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;, hvordan gik de første dage med Altid&nbsp;Mad?</h1>')
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
    expect(html).toContain('<h1>Tak, vi har allerede dine svar</h1>\n<p class="lead">Du behøver ikke gøre mere.</p>')
    expect(html).not.toContain('<form')
    expect(db.upserts).toHaveLength(0)
  })

  it.each([
    ['an unknown plan_fit', stored({ plan_fit: 'maaske' })],
    ['a missing plan_fit', stored({ plan_fit: null })],
    ['an unknown easy_to_use', stored({ easy_to_use: 'Ja' })],
    ['panel as text', stored({ panel: 'ja' })],
    ['a missing panel', stored({ panel: null })],
    ['a non-text other_feedback', stored({ other_feedback: 5 })],
    ['an object as plan_fit_note', stored({ plan_fit_note: { a: 1 } })],
  ])('a stored survey row with %s: 500, never a guessed screen', async (_, row) => {
    tester()
    db.surveys.set(PUBLIC_ID, row)
    expect((await get(TOKEN)).status).toBe(500)
  })

  // Rows the table accepts but the page would not have written (typed into the
  // SQL editor, imported): a stored answer is an answer, so the tester sees the
  // already screen on every visit and every post, never a 500 for good.
  it.each([
    ['a leading no-break space', stored({ plan_fit_note: '\u00a0x' })],
    ['a byte order mark', stored({ easy_note: '\ufeffx' })],
    ['a vertical tab at the end', stored({ missing: 'x\u000b' })],
    ['a \\r inside (a row from before the \\r check)', stored({ other_feedback: 'a\rb' })],
    ['surrounding spaces', stored({ easy_note: ' x ' })],
    ['an empty string', stored({ plan_fit_note: '' })],
    ['over 2000 characters', stored({ missing: 'x'.repeat(2001) })],
  ])('a stored row with %s in a text answer: the already screen, for GET and POST, nothing written', async (_, row) => {
    tester()
    db.surveys.set(PUBLIC_ID, row)
    for (const res of [await get(TOKEN), await post(TOKEN)]) {
      expect(res.status).toBe(200)
      expect(await res.text()).toContain('<h1>Tak, vi har allerede dine svar</h1>')
    }
    expect(db.upserts).toHaveLength(0)
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
        row: { public_id: PUBLIC_ID, copy_version: MAD_TEST_SURVEY_COPY_VERSION, ...FULL_ROW },
        opts: { onConflict: 'public_id', ignoreDuplicates: true },
      },
    ])
    expect(html).toContain('<h1>Tak for dine svar</h1>\n<p class="lead">Vi læser dem alle.</p>')
    expect(html).toContain(
      '<p class="note">Har du mere på hjerte, kan du altid trykke på Feedback i Altid&nbsp;Mad eller skrive til <a href="mailto:hej@altidmad.dk">hej@altidmad.dk</a>.</p>',
    )
    expect(html).not.toContain('<form')
  })

  it('the four text answers are optional: empty or whitespace is stored as null', async () => {
    tester()
    const res = await post(TOKEN, {
      plan_fit: 'nej',
      plan_fit_note: '  \r\n ',
      easy_to_use: 'nej',
      easy_note: '',
      missing: '\t',
      other_feedback: ' ',
      panel: 'nej',
    })

    expect(res.status).toBe(200)
    expect(db.upserts.map((u) => u.row)).toEqual([
      {
        public_id: PUBLIC_ID,
        copy_version: MAD_TEST_SURVEY_COPY_VERSION,
        plan_fit: 'nej',
        plan_fit_note: null,
        easy_to_use: 'nej',
        easy_note: null,
        missing: null,
        other_feedback: null,
        panel: false,
      },
    ])
    expect(await res.text()).toContain('<h1>Tak for dine svar</h1>')
  })

  it('text fields left out of the body entirely are null too', async () => {
    tester()
    await post(TOKEN, { plan_fit: 'ja', easy_to_use: 'delvist', panel: 'ja' })
    expect(db.upserts.map((u) => TEXT_FIELDS.map((f) => u.row[f]))).toEqual([[null, null, null, null]])
    expect(db.upserts[0].row.panel).toBe(true)
  })

  it.each([
    ['ja', 'nej', true],
    ['delvist', 'ja', false],
    ['nej', 'delvist', true],
  ])('plan_fit %s, easy_to_use %s are stored as sent, panel as a boolean', async (planFit, easy, panel) => {
    tester()
    await post(TOKEN, { ...FULL, plan_fit: planFit, easy_to_use: easy, panel: panel ? 'ja' : 'nej' })
    expect([db.upserts[0].row.plan_fit, db.upserts[0].row.easy_to_use, db.upserts[0].row.panel]).toEqual([planFit, easy, panel])
  })

  it.each(TEXT_FIELDS)('%s: 2000 characters is accepted, emoji counted as one character each (as Postgres counts)', async (name) => {
    tester()
    const text = '🥕'.repeat(2000)
    const res = await post(TOKEN, { ...FULL, [name]: text })
    expect(res.status).toBe(200)
    expect(db.upserts[0].row[name]).toBe(text)
  })

  it.each(TEXT_FIELDS)('%s: NUL characters are removed before storing (Postgres text cannot hold them)', async (name) => {
    tester()
    await post(TOKEN, { ...FULL, [name]: 'a\u0000b' })
    expect(db.upserts[0].row[name]).toBe('ab')
  })

  const without = (name: string) => Object.fromEntries(Object.entries(FULL).filter(([k]) => k !== name))
  it.each([
    ['nothing at all', {}, ['plan_fit', 'easy_to_use', 'panel'], ['1', '2', '5']],
    ['question 1 left out', without('plan_fit'), ['plan_fit'], ['1']],
    ['question 1 empty', { ...FULL, plan_fit: '' }, ['plan_fit'], ['1']],
    ['question 1 out of range', { ...FULL, plan_fit: 'maaske' }, ['plan_fit'], ['1']],
    ['question 1 as a label', { ...FULL, plan_fit: 'Ja' }, ['plan_fit'], ['1']],
    ['question 1 with spaces', { ...FULL, plan_fit: ' ja' }, ['plan_fit'], ['1']],
    ['question 1 elaboration over 2000 characters', { ...FULL, plan_fit_note: 'x'.repeat(2001) }, ['plan_fit_note'], ['1']],
    ['question 2 left out', without('easy_to_use'), ['easy_to_use'], ['2']],
    ['question 2 out of range', { ...FULL, easy_to_use: 'DELVIST' }, ['easy_to_use'], ['2']],
    ['question 2 elaboration over 2000 characters', { ...FULL, easy_note: 'x'.repeat(2001) }, ['easy_note'], ['2']],
    ['question 3 over 2000 characters', { ...FULL, missing: 'x'.repeat(2001) }, ['missing'], ['3']],
    ['question 4 over 2000 characters', { ...FULL, other_feedback: 'x'.repeat(2001) }, ['other_feedback'], ['4']],
    ['question 5 left out', without('panel'), ['panel'], ['5']],
    ['question 5 delvist (not an option there)', { ...FULL, panel: 'delvist' }, ['panel'], ['5']],
    ['question 5 as a boolean', { ...FULL, panel: 'true' }, ['panel'], ['5']],
    ['question 1 and its elaboration both wrong', { ...FULL, plan_fit: '', plan_fit_note: 'x'.repeat(2001) }, ['plan_fit', 'plan_fit_note'], ['1']],
    [
      'question 1 and 5 unanswered, question 2 answered with an elaboration',
      { plan_fit_note: '', easy_to_use: 'delvist', easy_note: 'Svært at finde tilbud.' },
      ['plan_fit', 'panel'],
      ['1', '5'],
    ],
  ] as Array<[string, Record<string, string>, string[], string[]]>)(
    '%s: the form again with an inline error per question, status 200, nothing written',
    async (_, fields, bad, questions) => {
      tester()
      const res = await post(TOKEN, fields)
      const html = await res.text()

      expect(res.status).toBe(200)
      expect(db.upserts).toHaveLength(0)
      expect(html).toContain('<div class="err-top" role="alert"><p>Tjek de markerede spørgsmål, og send igen.</p><ul>')
      expect([...html.matchAll(/<li><a href="#q-[a-z_]+">Spørgsmål (\d)<\/a><\/li>/g)].map((m) => m[1])).toEqual(questions)
      for (const name of ALL_FIELDS) {
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
    const html = await (
      await post(TOKEN, {
        plan_fit: 'bogus',
        plan_fit_note: ' Til to ',
        easy_to_use: 'delvist',
        easy_note: 'Indkøbslisten',
        missing: 'Godt',
        other_feedback: '',
        panel: 'nej',
      })
    ).text()

    expect(html.match(/ checked/g)).toHaveLength(2)
    expect(html).toMatch(/name="easy_to_use" value="delvist" required checked/)
    expect(html).toMatch(/name="panel" value="nej" required checked/)
    expect(html).not.toMatch(/name="plan_fit"[^>]* checked/)
    expect(html).toMatch(/<textarea id="plan_fit_note" name="plan_fit_note"[^>]*>Til to<\/textarea>/)
    expect(html).toMatch(/<textarea id="easy_note" name="easy_note"[^>]*>Indkøbslisten<\/textarea>/)
    expect(html).toMatch(/<textarea id="missing" name="missing"[^>]*>Godt<\/textarea>/)
    expect(html).toMatch(/<textarea id="other_feedback" name="other_feedback"[^>]*><\/textarea>/)
    expect(html).toContain('<p id="plan_fit-err" class="err">Vælg et svar.</p>')
  })

  it.each(TEXT_FIELDS)('%s over the limit is shown again so it can be shortened, with the length error', async (name) => {
    tester()
    const long = 'ø'.repeat(2001)
    const html = await (await post(TOKEN, { ...FULL, [name]: long })).text()
    expect(html).toContain(`>${long}</textarea>`)
    expect(html).toContain(`<p id="${name}-err" class="err">Svaret er for langt. Skriv højst 2.000 tegn.</p>`)
  })

  it('a huge text answer is echoed only up to 20000 characters', async () => {
    tester()
    const html = await (await post(TOKEN, { ...FULL, missing: 'a'.repeat(50_000) })).text()
    expect(html).toContain(`>${'a'.repeat(20_000)}</textarea>`)
    expect(html).not.toContain('a'.repeat(20_001))
    expect(db.upserts).toHaveLength(0)
  })

  it('escapes the text answers when showing the form again', async () => {
    tester()
    const html = await (
      await post(TOKEN, {
        plan_fit: '',
        plan_fit_note: '</textarea><script>x</script>',
        easy_to_use: 'ja',
        easy_note: '"&\'',
        missing: '<img src=x>',
        other_feedback: '&lt;',
        panel: 'ja',
      })
    ).text()

    expect(html).not.toContain('<script>x')
    expect(html).not.toContain('<img src=x>')
    expect(html).toContain('>&lt;/textarea&gt;&lt;script&gt;x&lt;/script&gt;</textarea>')
    expect(html).toContain('>&quot;&amp;&#39;</textarea>')
    expect(html).toContain('>&lt;img src=x&gt;</textarea>')
    expect(html).toContain('>&amp;lt;</textarea>')
  })

  it('stores text answers raw (escaping is for display only)', async () => {
    tester()
    await post(TOKEN, { ...FULL, easy_note: '<b>Tak & "hej"</b>' })
    expect(db.upserts[0].row.easy_note).toBe('<b>Tak & "hej"</b>')
  })

  it('a repeat answer keeps the first row and shows the already screen', async () => {
    tester()
    await post(TOKEN)
    const first = db.surveys.get(PUBLIC_ID)

    for (const res of [await post(TOKEN, { ...FULL, plan_fit: 'nej' }), await post(TOKEN, {}), await get(TOKEN)]) {
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
      db.surveys.set(PUBLIC_ID, stored({ plan_fit: 'nej' }))
    }
    const res = await post(TOKEN)

    expect(res.status).toBe(200)
    expect(await res.text()).toContain('<h1>Tak, vi har allerede dine svar</h1>')
    expect(db.surveys.get(PUBLIC_ID)?.plan_fit).toBe('nej')
  })

  it.each([
    ['plan_fit_note', { plan_fit_note: null }],
    ['easy_note', { easy_note: 'Noget andet' }],
    ['missing', { missing: null }],
    ['other_feedback', { other_feedback: null }],
    ['panel', { panel: false }],
  ] as Array<[string, Partial<SurveyRow>]>)(
    'a competing answer that differs only in %s: the already screen, the first row kept',
    async (_, diff) => {
      tester()
      db.beforeUpsert = () => {
        db.surveys.set(PUBLIC_ID, stored({ ...FULL_ROW, ...diff }))
      }
      const res = await post(TOKEN)
      expect(await res.text()).toContain('<h1>Tak, vi har allerede dine svar</h1>')
      expect(db.surveys.get(PUBLIC_ID)).toMatchObject(diff)
    },
  )

  it('a competing identical answer under an older wording: the already screen', async () => {
    tester()
    db.beforeUpsert = () => {
      db.surveys.set(PUBLIC_ID, stored({ ...FULL_ROW, copy_version: '2026-09-29-mad-test-survey-1' }))
    }
    expect(await (await post(TOKEN)).text()).toContain('<h1>Tak, vi har allerede dine svar</h1>')
  })

  it('a competing identical answer (double tap): thank-you, one row', async () => {
    tester()
    db.beforeUpsert = () => {
      db.surveys.set(PUBLIC_ID, stored(FULL_ROW))
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
    ['plan_fit', 'plan_fit=ja&plan_fit=nej'],
    ['plan_fit (same value twice)', 'plan_fit=ja&plan_fit=ja'],
    ['plan_fit_note', 'plan_fit_note=a&plan_fit_note=b'],
    ['easy_to_use', 'easy_to_use=ja&easy_to_use=delvist'],
    ['easy_note', 'easy_note=a&easy_note='],
    ['missing', 'missing=a&missing=b'],
    ['other_feedback', 'other_feedback=&other_feedback=b'],
    ['panel', 'panel=ja&panel=nej'],
  ])('a repeated %s field (a hand-made request): the invalid-link screen, nothing written', async (name, dup) => {
    tester()
    const rest = new URLSearchParams(FULL)
    rest.delete(name.split(' ')[0])
    const res = await send(TOKEN, `${rest.toString()}&${dup}`, 'application/x-www-form-urlencoded')
    expect(res.status).toBe(400)
    expect(db.upserts).toHaveLength(0)
    expect(await res.text()).toContain('Linket virker ikke')
  })

  it.each([
    ['JSON', 'application/json', JSON.stringify(FULL)],
    ['text/plain', 'text/plain', new URLSearchParams(FULL).toString()],
    ['no content type', null, new URLSearchParams(FULL).toString()],
  ])('%s body with a valid token: invalid-link screen, nothing written', async (_, type, body) => {
    tester()
    const ref = await referenceInvalid()
    const res = await send(TOKEN, body, type)

    expect(res.status).toBe(400)
    expect(await res.text()).toBe(ref.body)
    expect(db.upserts).toEqual([])
    expect(console.error).not.toHaveBeenCalled()
  })

  it('multipart form data is form data too', async () => {
    tester()
    const form = new FormData()
    for (const [k, v] of Object.entries(FULL)) form.set(k, v)
    const res = await postMultipart(TOKEN, form)
    expect(res.status).toBe(200)
    expect(db.upserts).toHaveLength(1)
    expect(db.upserts[0].row).toMatchObject(FULL_ROW)
  })

  it.each(['missing', 'plan_fit_note', 'plan_fit'])(
    'a file sent as %s, everything else valid: the invalid-link screen, nothing written',
    async (name) => {
      tester()
      const ref = await referenceInvalid()
      const form = new FormData()
      for (const [k, v] of Object.entries(FULL)) if (k !== name) form.set(k, v)
      form.set(name, new File(['Aftensmad til børn.'], 'svar.txt', { type: 'text/plain' }))
      const res = await postMultipart(TOKEN, form)

      expect(res.status).toBe(400)
      expect(await res.text()).toBe(ref.body)
      expect(db.upserts).toEqual([])
    },
  )

  it('a body over the cap by its content-length: the invalid-link screen, unread, nothing written', async () => {
    tester()
    const ref = await referenceInvalid()
    const body = new URLSearchParams(FULL).toString()
    for (const size of [String(SURVEY_BODY_MAX + 1), '4194304']) {
      const res = await send(TOKEN, body, 'application/x-www-form-urlencoded', size)
      expect(res.status).toBe(400)
      expect(await res.text()).toBe(ref.body)
    }
    // A real body over the cap, honestly declared.
    const big = new URLSearchParams({ ...FULL, other_feedback: 'x'.repeat(SURVEY_BODY_MAX) }).toString()
    expect((await send(TOKEN, big, 'application/x-www-form-urlencoded')).status).toBe(400)
    expect(db.upserts).toEqual([])
    expect(console.error).not.toHaveBeenCalled()
  })

  it.each([
    ['no content-length', null],
    ['an empty content-length', ''],
    ['a content-length that is not a number', 'abc'],
    ['a negative content-length', '-1'],
    ['a fractional content-length', '10.5'],
  ])('%s: the invalid-link screen, nothing written', async (_, size) => {
    tester()
    const ref = await referenceInvalid()
    const res = await send(TOKEN, new URLSearchParams(FULL).toString(), 'application/x-www-form-urlencoded', size)
    expect(res.status).toBe(400)
    expect(await res.text()).toBe(ref.body)
    expect(db.upserts).toEqual([])
  })

  it('a body exactly at the cap is read: a long answer gets the too-long form, not a refusal', async () => {
    tester()
    const base = new URLSearchParams({ ...FULL, other_feedback: '' }).toString()
    const body = new URLSearchParams({ ...FULL, other_feedback: 'x'.repeat(SURVEY_BODY_MAX - base.length) }).toString()
    expect(Buffer.byteLength(body)).toBe(SURVEY_BODY_MAX)
    const res = await send(TOKEN, body, 'application/x-www-form-urlencoded')
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('<p id="other_feedback-err" class="err">Svaret er for langt. Skriv højst 2.000 tegn.</p>')
    expect(db.upserts).toEqual([])
  })

  it('the largest Danish form a browser can send fits under the cap: four answers of 2000 æ, ø, å', async () => {
    tester()
    const full = 'æøå'.repeat(667).slice(0, 2000)
    const fields = { ...FULL, plan_fit_note: full, easy_note: full, missing: full, other_feedback: full }
    const body = new URLSearchParams(fields).toString()
    expect(Buffer.byteLength(body)).toBeLessThan(SURVEY_BODY_MAX)
    const res = await post(TOKEN, fields)
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('<h1>Tak for dine svar</h1>')
    expect(db.upserts[0].row.missing).toBe(full)
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
