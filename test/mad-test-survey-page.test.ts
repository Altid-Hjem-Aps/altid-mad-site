import { describe, expect, it } from 'vitest'
import { renderMadTestScreen } from '@/lib/mad-test'
import {
  MAD_TEST_SURVEY_COPY_VERSION,
  SURVEY_FIELD_NAMES,
  SURVEY_PANEL,
  SURVEY_RATINGS,
  SURVEY_TEXT_MAX,
  isSurveyRating,
  isSurveyText,
  parseSurvey,
  renderSurveyScreen,
  type SurveyScreen,
} from '@/lib/mad-test-survey'

const EMPTY_VALUES = {
  planFit: '',
  planFitNote: '',
  easyToUse: '',
  easyNote: '',
  missing: '',
  otherFeedback: '',
  panel: '',
}

// Q1 and Q5 unanswered, Q2 = delvist with an elaboration, Q4 too long.
const ERRORS: SurveyScreen = {
  kind: 'form',
  firstName: 'Anna',
  token: 'tok',
  values: { ...EMPTY_VALUES, easyToUse: 'delvist', easyNote: 'Indkøbslisten', otherFeedback: 'x' },
  errors: { planFit: 'missing', otherFeedback: 'too-long', panel: 'missing' },
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
  it('ratings: exactly ja, delvist, nej', () => {
    expect(SURVEY_RATINGS).toEqual(['ja', 'delvist', 'nej'])
    for (const v of SURVEY_RATINGS) expect(isSurveyRating(v)).toBe(true)
    for (const v of ['Ja', 'JA', ' ja', 'maaske', 'yes', '', null, 1, true]) expect(isSurveyRating(v)).toBe(false)
  })

  it('panel: exactly ja and nej on the form', () => {
    expect(SURVEY_PANEL).toEqual(['ja', 'nej'])
  })

  it('a stored text answer: null, or trimmed, non-empty and at most 2000 characters', () => {
    expect(SURVEY_TEXT_MAX).toBe(2000)
    expect(isSurveyText(null)).toBe(true)
    expect(isSurveyText('a\nb')).toBe(true)
    expect(isSurveyText('🥕'.repeat(2000))).toBe(true)
    for (const v of ['', ' a', 'a ', 'a\r\nb', 'a\u0000b', 'x'.repeat(2001), undefined, 1]) {
      expect(isSurveyText(v)).toBe(false)
    }
  })

  it('the form field names', () => {
    expect(SURVEY_FIELD_NAMES).toEqual([
      'plan_fit',
      'plan_fit_note',
      'easy_to_use',
      'easy_note',
      'missing',
      'other_feedback',
      'panel',
    ])
  })
})

describe('parseSurvey', () => {
  it('a full answer: text trimmed with line breaks kept, panel ja is true', () => {
    expect(
      parseSurvey(
        form({
          plan_fit: 'delvist',
          plan_fit_note: ' a\r\nb ',
          easy_to_use: 'ja',
          easy_note: 'c',
          missing: '\nd\n',
          other_feedback: 'e\rf',
          panel: 'ja',
        }),
      ),
    ).toEqual({
      ok: true,
      answers: {
        planFit: 'delvist',
        planFitNote: 'a\nb',
        easyToUse: 'ja',
        easyNote: 'c',
        missing: 'd',
        otherFeedback: 'e\nf',
        panel: true,
      },
    })
  })

  it('only the required answers: every text is null, panel nej is false', () => {
    expect(parseSurvey(form({ plan_fit: 'nej', easy_to_use: 'nej', panel: 'nej', missing: '   ' }))).toEqual({
      ok: true,
      answers: {
        planFit: 'nej',
        planFitNote: null,
        easyToUse: 'nej',
        easyNote: null,
        missing: null,
        otherFeedback: null,
        panel: false,
      },
    })
  })

  it('an empty form: the three required questions are missing, no text error', () => {
    expect(parseSurvey(new FormData())).toEqual({
      ok: false,
      values: EMPTY_VALUES,
      errors: { planFit: 'missing', easyToUse: 'missing', panel: 'missing' },
    })
  })

  it('panel delvist is not an answer (only questions 1 and 2 have it)', () => {
    const r = parseSurvey(form({ plan_fit: 'ja', easy_to_use: 'ja', panel: 'delvist' }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors).toEqual({ panel: 'missing' })
  })

  it('each text field over 2000 characters is its own too-long error, counted in code points', () => {
    const r = parseSurvey(
      form({
        plan_fit: 'ja',
        easy_to_use: 'ja',
        panel: 'ja',
        plan_fit_note: 'x'.repeat(2001),
        easy_note: '🥕'.repeat(2000),
        missing: 'ø'.repeat(2001),
        other_feedback: 'y'.repeat(2001),
      }),
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors).toEqual({ planFitNote: 'too-long', missing: 'too-long', otherFeedback: 'too-long' })
  })

  it('a file where a value belongs counts as not answered', () => {
    const f = form({ easy_to_use: 'ja', panel: 'nej' })
    f.set('plan_fit', new Blob(['ja']), 'x.txt')
    const r = parseSurvey(f)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors).toEqual({ planFit: 'missing' })
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

  it('the form: greeting without a comma, heading, lead, five questions in order, one button, the privacy link', () => {
    const html = renderSurveyScreen(SCREENS[0])

    expect(html).toContain('<p class="hello">Hej Anna</p>')
    expect(html).toContain('<h1>Hvordan gik de første dage med Altid&nbsp;Mad?</h1>')
    expect(html).toContain(
      '<p class="lead">Vi har fem korte spørgsmål til dig. Det tager cirka to minutter, og dine svar går direkte til holdet bag Altid&nbsp;Mad.</p>',
    )
    // The greeting sits above the heading, the heading above the lead.
    expect(html.indexOf('class="hello"')).toBeLessThan(html.indexOf('<h1>'))
    expect(html.indexOf('<h1>')).toBeLessThan(html.indexOf('class="lead"'))

    const questions = [
      ...html.matchAll(/<(?:legend|label for="[a-z_]+" class="qlabel")><span class="qn" aria-hidden="true">(\d)<\/span>([^<]+?)(?: <span class="optional">Valgfrit<\/span>)?<\/(?:legend|label)>/g),
    ].map((m) => [m[1], m[2]])
    expect(questions).toEqual([
      ['1', 'Passede madplanen til jeres behov?'],
      ['2', 'Var Altid&nbsp;Mad nem at bruge?'],
      ['3', 'Var der noget, du manglede i Altid&nbsp;Mad?'],
      ['4', 'Er der andet fra din oplevelse, som du synes, vi bør vide?'],
      ['5', 'Vil du være en del af vores brugerpanel?'],
    ])
    // All five on one page, in one form.
    expect(html.match(/<form /g)).toHaveLength(1)
    expect(html).toContain('<form method="POST" action="/api/mad-testen/survey?t=tok" class="survey"')
    expect(html.match(/<fieldset id="q-[a-z_]+" class="q"/g)).toHaveLength(3)
    expect(html.match(/<textarea/g)).toHaveLength(4)
    expect(html.match(/<button/g)).toHaveLength(1)
    expect(html).toContain('<button type="submit" class="primary">Send mine svar</button>')
    // The button comes after question 5, the privacy link after the form.
    expect(html.indexOf('id="q-panel"')).toBeLessThan(html.indexOf('<button'))
    expect(html).toMatch(/<\/form>\n<p class="small"><a href="\/privatlivspolitik">Sådan behandler vi dine data<\/a><\/p>/)
    expect(html).not.toContain('class="err-top"')
    expect(html).not.toContain('class="err"')
    // No element starts disabled (the base stylesheet has a button:disabled rule).
    expect(html).not.toMatch(/<[a-z]+ [^>]*\bdisabled\b/)
    expect(html).not.toContain(' checked')
  })

  it('questions 1, 2 and 5 use the same option card, values as stored, every radio required', () => {
    const html = renderSurveyScreen(SCREENS[0])
    const opts = (name: string) =>
      [...html.matchAll(new RegExp(`<label class="opt"><input type="radio" name="${name}" value="([^"]+)" required/><span>([^<]+)</span></label>`, 'g'))]
        .map((m) => [m[1], m[2]])
    const rating = [
      ['ja', 'Ja'],
      ['delvist', 'Delvist'],
      ['nej', 'Nej'],
    ]
    expect(opts('plan_fit')).toEqual(rating)
    expect(opts('easy_to_use')).toEqual(rating)
    expect(opts('panel')).toEqual([
      ['ja', 'Ja'],
      ['nej', 'Nej'],
    ])
    // No other kind of radio on the page.
    expect(html.match(/type="radio"/g)).toHaveLength(8)
    expect(html.match(/<label class="opt">/g)).toHaveLength(8)
  })

  it('the elaborations under questions 1 and 2: optional, labelled, inside their question, after the options', () => {
    const html = renderSurveyScreen(SCREENS[0])
    for (const [q, id, label] of [
      ['plan_fit', 'plan_fit_note', 'Uddyb gerne hvorfor'],
      ['easy_to_use', 'easy_note', 'Var der noget, der var svært eller uklart?'],
    ]) {
      const fieldset = html.slice(html.indexOf(`<fieldset id="q-${q}"`), html.indexOf('</fieldset>', html.indexOf(`<fieldset id="q-${q}"`)))
      expect(fieldset).toContain(
        `<div class="sub">\n    <label for="${id}" class="sublabel">${label} <span class="optional">Valgfrit</span></label>\n    <textarea id="${id}" name="${id}" rows="3" maxlength="2000"></textarea>\n  </div>`,
      )
      expect(fieldset.indexOf('class="opts"')).toBeLessThan(fieldset.indexOf('class="sub"'))
    }
    // Quieter than the options: a smaller, muted label and a lighter, lower field.
    expect(html).toContain('.sublabel{display:block;margin:0 0 8px;font-size:15px;line-height:1.45;color:#6f6a61}')
    expect(html).toContain('.sub textarea{min-height:88px;border-color:rgba(22,50,35,.2);border-radius:14px}')
  })

  it('questions 3 and 4: the question labels a multiline field with "Skriv dit svar", marked Valgfrit', () => {
    const html = renderSurveyScreen(SCREENS[0])
    for (const [id, n, q] of [
      ['missing', '3', 'Var der noget, du manglede i Altid&nbsp;Mad?'],
      ['other_feedback', '4', 'Er der andet fra din oplevelse, som du synes, vi bør vide?'],
    ]) {
      expect(html).toContain(
        `<div id="q-${id}" class="q">\n  <label for="${id}" class="qlabel"><span class="qn" aria-hidden="true">${n}</span>${q} <span class="optional">Valgfrit</span></label>\n  <textarea id="${id}" name="${id}" rows="4" maxlength="2000" placeholder="Skriv dit svar"></textarea>\n</div>`,
      )
    }
    // Every optional field says so, the required questions do not.
    expect(html.match(/<span class="optional">Valgfrit<\/span>/g)).toHaveLength(4)
    expect(html).toContain('.optional{display:inline-block;')
  })

  it('question 5: the explanation directly under the question, and the fieldset described by it', () => {
    const html = renderSurveyScreen(SCREENS[0])
    expect(html).toContain(
      '<fieldset id="q-panel" class="q" aria-describedby="panel-help">\n  <legend><span class="qn" aria-hidden="true">5</span>Vil du være en del af vores brugerpanel?</legend>\n  <p id="panel-help" class="qhelp">Så kan vi invitere dig til at teste nye funktioner og dele feedback med os igen.</p>\n  <div class="opts">',
    )
  })

  it('the options stack at every width (no row layout that could overflow 375 px)', () => {
    const html = renderSurveyScreen(SCREENS[0])
    expect(html).toContain('.opts{display:flex;flex-direction:column;gap:8px}')
    expect(html).not.toMatch(/\.opts\{[^}]*flex-direction:row/)
  })

  it('the form with errors: the summary sentence, a link per question in page order, errors in place, answers kept', () => {
    const html = renderSurveyScreen(ERRORS)

    expect(html).toContain('<div class="err-top" role="alert"><p>Tjek de markerede spørgsmål, og send igen.</p><ul>')
    const links = [...html.matchAll(/<li><a href="#(q-[a-z_]+)">Spørgsmål (\d)<\/a><\/li>/g)].map((m) => [m[1], m[2]])
    expect(links).toEqual([['q-plan_fit', '1'], ['q-other_feedback', '4'], ['q-panel', '5']])
    for (const [id] of links) expect(html).toContain(`id="${id}"`)
    expect(html).toContain('<p id="plan_fit-err" class="err">Vælg et svar.</p>')
    expect(html).toContain('<p id="panel-err" class="err">Vælg et svar.</p>')
    expect(html).toContain('<p id="other_feedback-err" class="err">Svaret er for langt. Skriv højst 2.000 tegn.</p>')
    expect(html.match(/class="err"/g)).toHaveLength(3)
    expect(html).not.toContain('id="easy_to_use-err"')
    expect(html.match(/name="plan_fit"[^>]*aria-invalid="true" aria-describedby="plan_fit-err"/g)).toHaveLength(3)
    expect(html.match(/name="panel"[^>]*aria-invalid="true" aria-describedby="panel-err"/g)).toHaveLength(2)
    expect(html).toContain(
      '<textarea id="other_feedback" name="other_feedback" rows="4" maxlength="2000" placeholder="Skriv dit svar" aria-invalid="true" aria-describedby="other_feedback-err">x</textarea>',
    )
    // Q2's answer and its elaboration are kept.
    expect(html).toContain('<input type="radio" name="easy_to_use" value="delvist" required checked/>')
    expect(html.match(/ checked/g)).toHaveLength(1)
    expect(html).toContain('<textarea id="easy_note" name="easy_note" rows="3" maxlength="2000">Indkøbslisten</textarea>')
    expect(html.match(/<fieldset id="q-[a-z_]+" class="q has-err"/g)).toHaveLength(2)
    expect(html).toContain('<fieldset id="q-easy_to_use" class="q">')
    // Question 5's error sits under its explanation, above the options.
    const q5 = html.slice(html.indexOf('id="q-panel"'))
    expect(q5.indexOf('panel-help')).toBeLessThan(q5.indexOf('panel-err'))
    expect(q5.indexOf('panel-err')).toBeLessThan(q5.indexOf('class="opts"'))
  })

  it('an elaboration that is too long: its error under its own label, the summary names its question', () => {
    const html = renderSurveyScreen({
      kind: 'form',
      firstName: null,
      token: 'tok',
      values: { ...EMPTY_VALUES, planFit: 'ja', planFitNote: 'y', easyToUse: 'nej', panel: 'ja' },
      errors: { planFitNote: 'too-long' },
    })
    expect([...html.matchAll(/<li><a href="#(q-[a-z_]+)">/g)].map((m) => m[1])).toEqual(['q-plan_fit'])
    expect(html).toContain(
      '<label for="plan_fit_note" class="sublabel">Uddyb gerne hvorfor <span class="optional">Valgfrit</span></label>\n    <p id="plan_fit_note-err" class="err">Svaret er for langt. Skriv højst 2.000 tegn.</p>\n    <textarea id="plan_fit_note" name="plan_fit_note" rows="3" maxlength="2000" aria-invalid="true" aria-describedby="plan_fit_note-err">y</textarea>',
    )
    // The options were answered: question 1 is not marked as unanswered.
    expect(html).toContain('<fieldset id="q-plan_fit" class="q">')
    expect(html).not.toMatch(/name="plan_fit"[^>]*aria-invalid/)
  })

  it('both elaborations too long and Q1 unanswered: question 1 is named once', () => {
    const html = renderSurveyScreen({
      kind: 'form',
      firstName: null,
      token: 'tok',
      values: EMPTY_VALUES,
      errors: { planFit: 'missing', planFitNote: 'too-long', easyNote: 'too-long' },
    })
    expect([...html.matchAll(/<li><a href="#(q-[a-z_]+)">Spørgsmål (\d)/g)].map((m) => m[2])).toEqual(['1', '2'])
  })

  it('escapes the token in the form action, and greets without a name', () => {
    const odd = `a"b'c<d>&e`
    const html = renderSurveyScreen({ kind: 'form', firstName: null, token: odd })
    expect(html).toContain(`action="/api/mad-testen/survey?t=${encodeURIComponent(odd).replace(/'/g, '&#39;')}"`)
    expect(html).not.toContain('a"b')
    expect(html).toContain('<p class="hello">Hej</p>')
  })

  it('escapes every kept text answer', () => {
    const html = renderSurveyScreen({
      kind: 'form',
      firstName: '<b>Bo</b>',
      token: 'tok',
      values: {
        ...EMPTY_VALUES,
        planFitNote: '</textarea><script>1</script>',
        easyNote: '"&\'',
        missing: '<i>',
        otherFeedback: '&amp;',
      },
      errors: { planFit: 'missing' },
    })
    expect(html).not.toContain('<script>1')
    expect(html).toContain('>&lt;/textarea&gt;&lt;script&gt;1&lt;/script&gt;</textarea>')
    expect(html).toContain('>&quot;&amp;&#39;</textarea>')
    expect(html).toContain('>&lt;i&gt;</textarea>')
    expect(html).toContain('>&amp;amp;</textarea>')
    expect(html).toContain('<p class="hello">Hej &lt;b&gt;Bo&lt;/b&gt;</p>')
  })

  it('thanks: the check mark, the heading, "Vi læser dem alle." and Feedback in Altid Mad with the mail address as a link', () => {
    const html = renderSurveyScreen({ kind: 'thanks' })
    expect(html).toContain('<title>Tak for dine svar | Altid Mad</title>')
    expect(html).toContain('<div class="mark" aria-hidden="true">')
    expect(html).toContain(
      '<h1>Tak for dine svar</h1>\n<p class="lead">Vi læser dem alle.</p>\n<p class="note">Har du mere på hjerte, kan du altid trykke på Feedback i Altid&nbsp;Mad eller skrive til <a href="mailto:hej@altidmad.dk">hej@altidmad.dk</a>.</p>',
    )
    expect(html).not.toContain('<form')
    expect(html).not.toContain('<button')
  })

  it('already answered: the heading and "Du behøver ikke gøre mere.", no form', () => {
    const html = renderSurveyScreen({ kind: 'already' })
    expect(html).toContain('<title>Tak, vi har allerede dine svar | Altid Mad</title>')
    expect(html).toContain('<div class="mark" aria-hidden="true">')
    expect(html).toContain('<h1>Tak, vi har allerede dine svar</h1>\n<p class="lead">Du behøver ikke gøre mere.</p>\n</main>')
    expect(html).not.toContain('<form')
    expect(html).not.toContain('<button')
  })

  it('the wording version names the day and the survey', () => {
    expect(MAD_TEST_SURVEY_COPY_VERSION).toBe('2026-09-30-mad-test-survey-2')
  })
})
