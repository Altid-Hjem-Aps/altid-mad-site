import { describe, expect, it } from 'vitest'
import { renderMadTestScreen } from '@/lib/mad-test'
import {
  MAD_TEST_SURVEY_COPY_VERSION,
  SURVEY_DAYS,
  SURVEY_PROGRESS,
  isSurveyDays,
  isSurveyProgress,
  isSurveyRecommend,
  isSurveyText,
  parseSurvey,
  renderSurveyScreen,
  type SurveyScreen,
} from '@/lib/mad-test-survey'

const ERRORS: SurveyScreen = {
  kind: 'form',
  firstName: 'Anna',
  token: 'tok',
  values: { daysUsed: '', progress: 'plan', recommend: '', workedBest: 'Godt', fixFirst: 'x' },
  errors: { daysUsed: 'missing', recommend: 'missing', fixFirst: 'too-long' },
}

const SCREENS: SurveyScreen[] = [
  { kind: 'form', firstName: 'Anna', token: 'tok' },
  ERRORS,
  { kind: 'thanks' },
  { kind: 'already' },
  { kind: 'invalid' },
  { kind: 'error' },
]

function form(fields: Record<string, string>): FormData {
  const f = new FormData()
  for (const [k, v] of Object.entries(fields)) f.set(k, v)
  return f
}

describe('the answer checks', () => {
  it('days_used: exactly the four values', () => {
    expect(SURVEY_DAYS).toEqual(['0', '1', '2-3', '4+'])
    for (const v of SURVEY_DAYS) expect(isSurveyDays(v)).toBe(true)
    for (const v of ['2', '4', '2–3', ' 1', '', null, 0, 1]) expect(isSurveyDays(v)).toBe(false)
  })

  it('progress: exactly the three values', () => {
    expect(SURVEY_PROGRESS).toEqual(['plan', 'shopped', 'none'])
    for (const v of SURVEY_PROGRESS) expect(isSurveyProgress(v)).toBe(true)
    for (const v of ['PLAN', 'shop', '', null]) expect(isSurveyProgress(v)).toBe(false)
  })

  it('recommend: the integers 0 to 10', () => {
    for (let i = 0; i <= 10; i++) expect(isSurveyRecommend(i)).toBe(true)
    for (const v of [-1, 11, 7.5, NaN, '7', null]) expect(isSurveyRecommend(v)).toBe(false)
  })

  it('a stored text answer: null, or trimmed, non-empty and at most 2000 characters', () => {
    expect(isSurveyText(null)).toBe(true)
    expect(isSurveyText('a\nb')).toBe(true)
    expect(isSurveyText('🥕'.repeat(2000))).toBe(true)
    for (const v of ['', ' a', 'a ', 'a\r\nb', 'a\u0000b', 'x'.repeat(2001), undefined, 1]) {
      expect(isSurveyText(v)).toBe(false)
    }
  })
})

describe('parseSurvey', () => {
  it('a full answer', () => {
    expect(
      parseSurvey(form({ days_used: '2-3', progress: 'shopped', recommend: '10', worked_best: ' a\r\nb ', fix_first: 'c' })),
    ).toEqual({
      ok: true,
      answers: { daysUsed: '2-3', progress: 'shopped', recommend: 10, workedBest: 'a\nb', fixFirst: 'c' },
    })
  })

  it('an empty form: the three required questions are missing, no text error', () => {
    const r = parseSurvey(new FormData())
    expect(r).toEqual({
      ok: false,
      values: { daysUsed: '', progress: '', recommend: '', workedBest: '', fixFirst: '' },
      errors: { daysUsed: 'missing', progress: 'missing', recommend: 'missing' },
    })
  })

  it('a file where a value belongs counts as not answered', () => {
    const f = form({ progress: 'plan', recommend: '4' })
    f.set('days_used', new Blob(['1']), 'x.txt')
    const r = parseSurvey(f)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors).toEqual({ daysUsed: 'missing' })
  })
})

describe('renderSurveyScreen', () => {
  it.each(SCREENS)('$kind: Danish, Altid Mad header, no third-party request, no dashes as punctuation', (screen) => {
    const html = renderSurveyScreen(screen)

    expect(html).toContain('<html lang="da">')
    expect(html).toContain('src="/email/mad/altid-mad-logo-white.png" alt="Altid Mad"')
    expect(html).toContain('<meta name="referrer" content="no-referrer"/>')
    expect(html).toContain('<meta name="robots" content="noindex, nofollow"/>')
    expect(html).toContain("src:url('/fonts/onest-latin.woff2')")
    // The token rides in this page's URL; any absolute URL would be a request
    // (or a Referer) leaving our origin.
    expect(html).not.toMatch(/https?:\/\//)
    expect(html).not.toMatch(/[–—]/)
    expect(html).not.toContain('<script')
  })

  it('invalid and error are the yes-page screens, byte for byte', () => {
    expect(renderSurveyScreen({ kind: 'invalid' })).toBe(renderMadTestScreen({ kind: 'invalid' }))
    expect(renderSurveyScreen({ kind: 'error' })).toBe(renderMadTestScreen({ kind: 'error' }))
  })

  it('the form: intro, three fieldsets with legends, two labelled textareas, one button, the privacy link', () => {
    const html = renderSurveyScreen(SCREENS[0])

    expect(html).toContain('<p class="hello">Hej Anna,</p>')
    expect(html).toContain('<h1>Hvordan gik de første dage med Altid&nbsp;Mad?</h1>')
    expect(html).toContain(
      '<p class="lead">Fem korte spørgsmål. Det tager to minutter, og dine svar går direkte til holdet bag appen.</p>',
    )
    const legends = [...html.matchAll(/<legend><span class="qn" aria-hidden="true">(\d)<\/span>([^<]+)<\/legend>/g)]
    expect(legends.map((m) => [m[1], m[2]])).toEqual([
      ['1', 'Hvor mange dage har du brugt Altid&nbsp;Mad den sidste uge?'],
      ['2', 'Hvor langt nåede du?'],
      ['3', 'Hvor sandsynligt er det, at du vil anbefale Altid&nbsp;Mad til en ven eller kollega?'],
    ])
    expect(html.match(/<fieldset class="q">/g)).toHaveLength(3)
    expect(html).toContain(
      '<label for="worked_best" class="qlabel"><span class="qn" aria-hidden="true">4</span>Hvad virkede bedst? <span class="optional">(valgfrit)</span></label>',
    )
    expect(html).toContain(
      '<label for="fix_first" class="qlabel"><span class="qn" aria-hidden="true">5</span>Hvad skal vi rette først? <span class="optional">(valgfrit)</span></label>',
    )
    expect(html).toContain('<textarea id="worked_best" name="worked_best" rows="4" maxlength="2000"></textarea>')
    expect(html).toContain('<textarea id="fix_first" name="fix_first" rows="4" maxlength="2000"></textarea>')
    expect(html.match(/<button/g)).toHaveLength(1)
    expect(html).toContain('<button type="submit" class="primary">Send svar</button>')
    expect(html.match(/<form /g)).toHaveLength(1)
    expect(html).toContain('<form method="POST" action="/api/mad-testen/survey?t=tok" class="survey"')
    expect(html).toContain('href="/privatlivspolitik"')
    expect(html).not.toContain('class="err-top"')
    expect(html).not.toContain('class="err"')
    expect(html).not.toContain('disabled')
  })

  it('question 1 and 2: the answers in order, values as stored, every radio required', () => {
    const html = renderSurveyScreen(SCREENS[0])
    const opts = (name: string) =>
      [...html.matchAll(new RegExp(`<label class="opt"><input type="radio" name="${name}" value="([^"]+)" required/><span>([^<]+)</span></label>`, 'g'))]
        .map((m) => [m[1], m[2]])
    expect(opts('days_used')).toEqual([
      ['0', 'Ingen'],
      ['1', '1 dag'],
      ['2-3', '2-3 dage'],
      ['4+', '4 dage eller flere'],
    ])
    expect(opts('progress')).toEqual([
      ['plan', 'Jeg lavede en madplan'],
      ['shopped', 'Jeg handlede ind efter den'],
      ['none', 'Ingen af delene'],
    ])
  })

  it('question 3: eleven radios 0 to 10, the end labels visible once and in the 0 and 10 names', () => {
    const html = renderSurveyScreen(SCREENS[0])
    const points = [...html.matchAll(/<label class="pt"><input type="radio" name="recommend" value="(\d+)" required\/><span>(\d+)(<span class="vh">, ([^<]+)<\/span>)?<\/span><\/label>/g)]
    expect(points.map((m) => m[1])).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'])
    expect(points.map((m) => m[1] === m[2])).toEqual(Array(11).fill(true))
    expect(points[0][4]).toBe('Slet ikke sandsynligt')
    expect(points[10][4]).toBe('Meget sandsynligt')
    expect(points.slice(1, 10).every((m) => m[3] === undefined)).toBe(true)
    expect(html).toContain(
      '<p class="ends" aria-hidden="true"><span>0 = Slet ikke sandsynligt</span><span>10 = Meget sandsynligt</span></p>',
    )
  })

  it('the scale fits 375 px: six columns on a phone (two rows), eleven from 600 px', () => {
    const html = renderSurveyScreen(SCREENS[0])
    expect(html).toContain('.scale{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px}')
    expect(html).toContain('@media (min-width:600px){.scale{grid-template-columns:repeat(11,minmax(0,1fr))}')
    // 375 px minus 2 x 24 px padding, minus 5 gaps of 6 px, over 6 columns.
    expect((375 - 48 - 5 * 6) / 6).toBeGreaterThanOrEqual(44)
  })

  it('the form with errors: an alert on top, each bad question points at its error, given answers kept', () => {
    const html = renderSurveyScreen(ERRORS)

    expect(html).toContain('<p class="err-top" role="alert">Tjek de markerede spørgsmål, og send igen.</p>')
    expect(html).toContain('<p id="days_used-err" class="err">Vælg et svar.</p>')
    expect(html).toContain('<p id="recommend-err" class="err">Vælg et svar.</p>')
    expect(html).toContain('<p id="fix_first-err" class="err">Svaret er for langt. Skriv højst 2000 tegn.</p>')
    expect(html).not.toContain('id="progress-err"')
    expect(html).not.toContain('id="worked_best-err"')
    expect(html.match(/name="days_used"[^>]*aria-invalid="true" aria-describedby="days_used-err"/g)).toHaveLength(4)
    expect(html.match(/name="recommend"[^>]*aria-invalid="true" aria-describedby="recommend-err"/g)).toHaveLength(11)
    expect(html).toContain('<textarea id="fix_first" name="fix_first" rows="4" maxlength="2000" aria-invalid="true" aria-describedby="fix_first-err">x</textarea>')
    expect(html).toContain('<textarea id="worked_best" name="worked_best" rows="4" maxlength="2000">Godt</textarea>')
    expect(html).toContain('<input type="radio" name="progress" value="plan" required checked/>')
    expect(html.match(/<fieldset class="q has-err">/g)).toHaveLength(2)
  })

  it('escapes the token in the form action', () => {
    const odd = `a"b'c<d>&e`
    const html = renderSurveyScreen({ kind: 'form', firstName: null, token: odd })
    expect(html).toContain(`action="/api/mad-testen/survey?t=${encodeURIComponent(odd).replace(/'/g, '&#39;')}"`)
    expect(html).not.toContain('a"b')
    expect(html).toContain('<p class="hello">Hej,</p>')
  })

  it.each([
    ['thanks', 'Tak for dine svar'],
    ['already', 'Tak, vi har allerede dine svar'],
  ] as const)('%s: the check mark, the heading, Feedback in the app and the mail address as a link', (kind, heading) => {
    const html = renderSurveyScreen({ kind })
    expect(html).toContain(`<title>${heading} | Altid Mad</title>`)
    expect(html).toContain(`<h1>${heading}</h1>`)
    expect(html).toContain('<div class="mark" aria-hidden="true">')
    expect(html).toContain(
      '<p class="lead">Vi læser dem alle. Har du mere på hjerte, så tryk på Feedback i appen eller skriv til <a href="mailto:hej@altidmad.dk">hej@altidmad.dk</a>.</p>',
    )
    expect(html).not.toContain('<form')
  })

  it('the wording version names the day and the survey', () => {
    expect(MAD_TEST_SURVEY_COPY_VERSION).toBe('2026-09-29-mad-test-survey-1')
  })
})
