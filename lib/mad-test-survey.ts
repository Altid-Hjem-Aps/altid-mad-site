/**
 * Mad-testen day-5 survey (ALT-345): the five questions, their validation and
 * the screens.
 *
 * Same rules as the yes-page (lib/mad-test.ts), whose page shell this reuses:
 * plain server-rendered HTML, no React, no Amplitude, no cookie, no
 * third-party request, Onest self-hosted. The link carries the person's
 * unsub_token, so nothing on the page may leak that URL.
 *
 * Works without JavaScript: native radios and textareas in one POST form. A
 * submission with a missing or out-of-range answer shows the form again with
 * what was given kept (escaped) and an error under each question it concerns.
 *
 * Questions and copy: Thor, 30/9; the heading with the greeting in it, no
 * intro paragraph and Q5's explanation: Thor, 1/10. Q1, Q2 and Q5 are required
 * choices (one option component for all three); Q1 and Q2 carry an optional
 * elaboration; Q3 and Q4 are optional free text.
 */
import {
  CHECK,
  COLOR,
  ON_SUBMIT,
  SUPPORT_MAIL,
  escapeHtml,
  greeting,
  renderMadTestScreen,
  renderMadTestShell,
} from '@/lib/mad-test'

/**
 * Stored on every survey row. Bump it whenever a question or an answer's
 * wording changes, so each row resolves to the exact text the person answered.
 */
export const MAD_TEST_SURVEY_COPY_VERSION = '2026-10-01-mad-test-survey-3'

/** Questions 1 and 2: yes, partly, no. */
export const SURVEY_RATINGS = ['ja', 'delvist', 'nej'] as const
export type SurveyRating = (typeof SURVEY_RATINGS)[number]

/** Question 5, the user panel, as the form sends it. Stored as a boolean. */
export const SURVEY_PANEL = ['ja', 'nej'] as const
type SurveyPanel = (typeof SURVEY_PANEL)[number]

/** Longest text answer, in characters (code points, as Postgres length() counts). */
export const SURVEY_TEXT_MAX = 2000

/**
 * Largest request body the survey reads, in bytes (the content-length header).
 * The route refuses a bigger one before reading it, so a hand-made request
 * cannot make the server buffer and parse megabytes. A browser posts the form
 * urlencoded: a Danish answer at the 2000-character limit is at most 12 KB even
 * if every letter is æ, ø or å (6 bytes each), so four of them stay under 50 KB;
 * four answers of letters that take 3 bytes in UTF-8 (9 bytes encoded) come to
 * 72 KB, which the cap still lets through.
 */
export const SURVEY_BODY_MAX = 96 * 1024

export type SurveyAnswers = {
  /** Q1: did the meal plan fit the household's needs. */
  planFit: SurveyRating
  /** Q1's optional "why". Every text answer: trimmed, line breaks kept, null when empty. */
  planFitNote: string | null
  /** Q2: was Altid Mad easy to use. */
  easyToUse: SurveyRating
  /** Q2's optional "what was hard or unclear". */
  easyNote: string | null
  /** Q3: what was missing. */
  missing: string | null
  /** Q4: anything else. */
  otherFeedback: string | null
  /** Q5: true = invite me to future tests (the user panel). */
  panel: boolean
}

export function isSurveyRating(value: unknown): value is SurveyRating {
  return typeof value === 'string' && (SURVEY_RATINGS as readonly string[]).includes(value)
}

function isSurveyPanel(value: unknown): value is SurveyPanel {
  return typeof value === 'string' && (SURVEY_PANEL as readonly string[]).includes(value)
}

/** A text answer that may be stored: null, or a trimmed non-empty string of at most SURVEY_TEXT_MAX characters. */
export function isSurveyText(value: unknown): value is string | null {
  if (value === null) return true
  if (typeof value !== 'string') return false
  return value.length > 0 && value === normalizeText(value) && textLength(value) <= SURVEY_TEXT_MAX
}

/**
 * A text answer as it is stored: line endings as \n, NUL removed (Postgres text
 * cannot hold it; only a hand-made request can send one), and spaces, tabs and
 * line breaks trimmed from both ends. Exactly the set the table's
 * btrim(x, E' \t\n\r') check uses, not String.trim()'s wider Unicode set: a
 * leading no-break space, say, is kept on the way in just as the table keeps
 * it, so what the page writes and what the table holds follow one rule.
 */
function normalizeText(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/^[ \t\n\r]+|[ \t\n\r]+$/g, '')
}

function textLength(value: string): number {
  return [...value].length
}

// The field names in the form. They are also the keys of the error map.
const FIELD = {
  planFit: 'plan_fit',
  planFitNote: 'plan_fit_note',
  easyToUse: 'easy_to_use',
  easyNote: 'easy_note',
  missing: 'missing',
  otherFeedback: 'other_feedback',
  panel: 'panel',
} as const
type Field = keyof typeof FIELD

const TEXT_FIELDS = ['planFitNote', 'easyNote', 'missing', 'otherFeedback'] as const
type TextField = (typeof TEXT_FIELDS)[number]

/** Every field name the form sends, each at most once. */
export const SURVEY_FIELD_NAMES: readonly string[] = Object.values(FIELD)

/** What the form shows: the given answers as raw strings ('' = none). */
export type SurveyValues = Record<Field, string>
export type SurveyErrors = Partial<Record<Field, 'missing' | 'too-long'>>

const EMPTY: SurveyValues = {
  planFit: '',
  planFitNote: '',
  easyToUse: '',
  easyNote: '',
  missing: '',
  otherFeedback: '',
  panel: '',
}

// A text answer over the limit is shown again so it can be shortened. Anything
// longer than this was not typed into our form (maxlength stops it), so the
// page does not echo it whole.
const ECHO_MAX = 10 * SURVEY_TEXT_MAX

export type SurveyParse =
  | { ok: true; answers: SurveyAnswers }
  | { ok: false; values: SurveyValues; errors: SurveyErrors }

// Exactly one string value, or null. A repeated field (only a hand-made request
// can send one) counts as not answered, so no first-or-last guess is stored.
function field(form: FormData, name: string): string | null {
  const all = form.getAll(name)
  return all.length === 1 && typeof all[0] === 'string' ? all[0] : null
}

/**
 * Validate a submitted form. A radio value outside its list counts as not
 * answered (the form cannot send it; the value is not shown again).
 */
export function parseSurvey(form: FormData): SurveyParse {
  const values: SurveyValues = { ...EMPTY }
  const errors: SurveyErrors = {}

  for (const key of ['planFit', 'easyToUse'] as const) {
    const v = field(form, FIELD[key])
    if (isSurveyRating(v)) values[key] = v
    else errors[key] = 'missing'
  }

  const panel = field(form, FIELD.panel)
  if (isSurveyPanel(panel)) values.panel = panel
  else errors.panel = 'missing'

  for (const key of TEXT_FIELDS) {
    const text = normalizeText(field(form, FIELD[key]) ?? '')
    // A code point is at most two UTF-16 units, so a text this many units long
    // is over the limit for sure: refused without splitting it into code
    // points first, which costs far more memory than the string itself.
    if (text.length > 4 * SURVEY_TEXT_MAX) {
      values[key] = text.slice(0, ECHO_MAX)
      errors[key] = 'too-long'
      continue
    }
    values[key] = [...text].slice(0, ECHO_MAX).join('')
    if (textLength(text) > SURVEY_TEXT_MAX) errors[key] = 'too-long'
  }

  if (Object.keys(errors).length > 0) return { ok: false, values, errors }
  return {
    ok: true,
    answers: {
      planFit: values.planFit as SurveyRating,
      planFitNote: values.planFitNote || null,
      easyToUse: values.easyToUse as SurveyRating,
      easyNote: values.easyNote || null,
      missing: values.missing || null,
      otherFeedback: values.otherFeedback || null,
      panel: values.panel === 'ja',
    },
  }
}

export type SurveyScreen =
  | { kind: 'form'; firstName: string | null; token: string; values?: SurveyValues; errors?: SurveyErrors }
  | { kind: 'thanks' }
  | { kind: 'already' }
  | { kind: 'invalid' }
  | { kind: 'error' }

const RATING_LABEL: Record<SurveyRating, string> = { ja: 'Ja', delvist: 'Delvist', nej: 'Nej' }
const PANEL_LABEL: Record<SurveyPanel, string> = { ja: 'Ja', nej: 'Nej' }

// The five questions, in page order. Each text field belongs to one question:
// its error sends the reader to that question.
const QUESTION = {
  planFit: 'Passede madplanen til jeres behov?',
  easyToUse: 'Var Altid&nbsp;Mad nem at bruge?',
  missing: 'Var der noget, du manglede i Altid&nbsp;Mad?',
  otherFeedback: 'Er der andet fra din oplevelse, som du synes, vi bør vide?',
  panel: 'Vil du være en del af vores brugerpanel?',
} as const
type Question = keyof typeof QUESTION
const QUESTION_ORDER: readonly Question[] = ['planFit', 'easyToUse', 'missing', 'otherFeedback', 'panel']
const QUESTION_OF: Record<Field, Question> = {
  planFit: 'planFit',
  planFitNote: 'planFit',
  easyToUse: 'easyToUse',
  easyNote: 'easyToUse',
  missing: 'missing',
  otherFeedback: 'otherFeedback',
  panel: 'panel',
}

// The optional elaboration under Q1 and Q2.
const NOTE_LABEL = {
  planFitNote: 'Uddyb gerne hvorfor',
  easyNote: 'Var der noget, der var svært eller uklart?',
} as const
type NoteField = keyof typeof NOTE_LABEL

const PANEL_HELP =
  'Som en del af brugerpanelet er du med til at forme Altid&nbsp;Mad sammen med os. Du får mulighed for at teste nye funktioner, dele dine idéer og fortælle os, hvad der fungerer, og hvad vi kan gøre bedre.'
const TEXT_PLACEHOLDER = 'Skriv dit svar'
const OPTIONAL = '<span class="optional">Valgfrit</span>'
const SEND_LABEL = 'Send mine svar'

// 2000 written the Danish way, with a thousands separator.
const TEXT_MAX_DA = String(SURVEY_TEXT_MAX).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

const ERROR_TEXT: Record<'missing' | 'too-long', string> = {
  missing: 'Vælg et svar.',
  'too-long': `Svaret er for langt. Skriv højst ${TEXT_MAX_DA} tegn.`,
}

// Back from the back/forward cache: the button says "Send mine svar" again and
// the form may be sent again (the server keeps only the first answer).
const RESET_SEND = `var f=document.querySelector('form');if(f){delete f.dataset.sent;f.querySelector('button').textContent='${SEND_LABEL}'}`

function actionFor(token: string): string {
  return escapeHtml(`/api/mad-testen/survey?t=${encodeURIComponent(token)}`)
}

function errorAttrs(key: Field, errors: SurveyErrors): string {
  return errors[key] ? ` aria-invalid="true" aria-describedby="${FIELD[key]}-err"` : ''
}

function errorLine(key: Field, errors: SurveyErrors, indent = '  '): string {
  const e = errors[key]
  return e ? `\n${indent}<p id="${FIELD[key]}-err" class="err">${ERROR_TEXT[e]}</p>` : ''
}

// Read aloud with the question: the error summary sends the reader to
// "Spørgsmål N", so the number must be findable by ear too.
function number(q: Question): string {
  return `<span class="qn">${QUESTION_ORDER.indexOf(q) + 1}</span>`
}

// One pill per choice. The native radio stays in the page, only visually hidden
// (class "sr", never display:none), so Tab, the arrow keys, screen readers and
// the no-JavaScript form all work as with a plain radio; the span after it is
// what shows. `required` on a group's radios makes the browser ask before sending.
function radio(key: Field, value: string, label: string, values: SurveyValues, errors: SurveyErrors): string {
  const checked = values[key] === value ? ' checked' : ''
  return `<label class="pill"><input class="sr" type="radio" name="${FIELD[key]}" value="${value}" required${checked}${errorAttrs(key, errors)}/><span>${label}</span></label>`
}

function textarea(key: TextField, rows: number, values: SurveyValues, errors: SurveyErrors, placeholder?: string): string {
  const id = FIELD[key]
  const ph = placeholder ? ` placeholder="${placeholder}"` : ''
  return `<textarea id="${id}" name="${id}" rows="${rows}" maxlength="${SURVEY_TEXT_MAX}"${ph}${errorAttrs(key, errors)}>${escapeHtml(values[key])}</textarea>`
}

// The optional elaboration under Q1's and Q2's options: a smaller, quieter
// label and field than the question and its options.
function note(key: NoteField, values: SurveyValues, errors: SurveyErrors): string {
  return `
  <div class="sub">
    <label for="${FIELD[key]}" class="sublabel">${NOTE_LABEL[key]} ${OPTIONAL}</label>${errorLine(key, errors, '    ')}
    ${textarea(key, 3, values, errors)}
  </div>`
}

// Q1, Q2 and Q5: a fieldset with a row of pills, one component for all three.
// `help` sits directly under the question; `extra` after the options.
function choiceQuestion<V extends string>(
  key: 'planFit' | 'easyToUse' | 'panel',
  options: readonly V[],
  labels: Record<V, string>,
  values: SurveyValues,
  errors: SurveyErrors,
  more: { help?: string; extra?: string } = {},
): string {
  const id = FIELD[key]
  const described = more.help ? ` aria-describedby="${id}-help"` : ''
  const help = more.help ? `\n  <p id="${id}-help" class="qhelp">${more.help}</p>` : ''
  return `<fieldset id="q-${id}" class="q${errors[key] ? ' has-err' : ''}"${described}>
  <legend>${number(key)}${QUESTION[key]}</legend>${help}${errorLine(key, errors)}
  <div class="pills">
    ${options.map((v) => radio(key, v, labels[v], values, errors)).join('\n    ')}
  </div>${more.extra ?? ''}
</fieldset>`
}

// Q3 and Q4: the question is the textarea's label.
function textQuestion(key: 'missing' | 'otherFeedback', values: SurveyValues, errors: SurveyErrors): string {
  const id = FIELD[key]
  return `<div id="q-${id}" class="q${errors[key] ? ' has-err' : ''}">
  <label for="${id}" class="qlabel">${number(key)}${QUESTION[key]} ${OPTIONAL}</label>${errorLine(key, errors)}
  ${textarea(key, 4, values, errors, TEXT_PLACEHOLDER)}
</div>`
}

function formBody(screen: Extract<SurveyScreen, { kind: 'form' }>): string {
  const values = screen.values ?? EMPTY
  const errors = screen.errors ?? {}
  // Names each question that needs attention, as a link to it, so a reader who
  // lands at the top knows where to go (the page works without JavaScript).
  const failedFields = Object.keys(errors) as Field[]
  const failed = QUESTION_ORDER.filter((q) => failedFields.some((k) => QUESTION_OF[k] === q))
  const summary = failed.length
    ? `\n<div class="err-top" role="alert"><p>Tjek de markerede spørgsmål, og send igen.</p><ul>${failed
        .map((q) => `<li><a href="#q-${FIELD[q]}">Spørgsmål ${QUESTION_ORDER.indexOf(q) + 1}</a></li>`)
        .join('')}</ul></div>`
    : ''
  // One heading with the greeting in it: "Hej Mette, hvordan …", or "Hej,
  // hvordan …" without a name. greeting() escapes the name.
  return `<h1>${greeting(screen.firstName)}, hvordan gik de første dage med Altid&nbsp;Mad?</h1>${summary}
<form method="POST" action="${actionFor(screen.token)}" class="survey" onsubmit="${ON_SUBMIT}">
${choiceQuestion('planFit', SURVEY_RATINGS, RATING_LABEL, values, errors, { extra: note('planFitNote', values, errors) })}
${choiceQuestion('easyToUse', SURVEY_RATINGS, RATING_LABEL, values, errors, { extra: note('easyNote', values, errors) })}
${textQuestion('missing', values, errors)}
${textQuestion('otherFeedback', values, errors)}
${choiceQuestion('panel', SURVEY_PANEL, PANEL_LABEL, values, errors, { help: PANEL_HELP })}
<button type="submit" class="primary">${SEND_LABEL}</button>
</form>
<p class="small"><a href="/privatlivspolitik">Sådan behandler vi dine data</a></p>`
}

function done(title: string, lines: string): { title: string; body: string } {
  return {
    title,
    body: `${CHECK}
<h1>${title}</h1>
${lines}`,
  }
}

const THANKS = done(
  'Tak for dine svar',
  `<p class="lead">Vi læser dem alle.</p>
<p class="note">Har du mere på hjerte, kan du altid trykke på Feedback i Altid&nbsp;Mad eller skrive til <a href="mailto:${SUPPORT_MAIL}">${SUPPORT_MAIL}</a>.</p>`,
)
const ALREADY = done('Tak, vi har allerede dine svar', '<p class="lead">Du behøver ikke gøre mere.</p>')

// Rules on top of the yes-page's STYLE, whose bare `label` rule (for the
// Google-account field) is reset here for the survey's labels. Fieldsets for
// the radio groups, each a wrapping row of pills (Ja, Delvist and Nej fit on one
// line at 375 px): the radio is visually hidden and the pill after it shows the
// choice, filled khaki when chosen and ringed like a button when focused from
// the keyboard; and the elaborations under Q1 and Q2 quieter than the pills
// above them. The heading carries the first name, so a long one breaks inside
// the word rather than widening the page.
const SURVEY_STYLE = `
h1{overflow-wrap:break-word}
form.survey{display:block;margin:28px 0 20px}
.q{border:0;margin:0 0 36px;padding:0;min-width:0}
legend,.qlabel{display:block;padding:0;margin:0 0 12px;font-size:17px;font-weight:500;line-height:1.4;color:${COLOR.forestDeep};text-wrap:pretty}
.qn{display:inline-block;min-width:1.6em;color:${COLOR.muted};font-weight:400}
.optional{display:inline-block;margin-left:6px;padding:1px 8px;border-radius:999px;background:rgba(22,50,35,.07);color:${COLOR.muted};font-size:13px;font-weight:400;line-height:1.5;vertical-align:1px;white-space:nowrap}
.qhelp{font-size:15px;line-height:1.5;color:${COLOR.muted};margin:-6px 0 12px;text-wrap:pretty}
.q .err{margin:-4px 0 12px}
.err-top{font-size:15px;line-height:1.5;color:${COLOR.error};margin:0 0 8px}
.err-top ul{margin:4px 0 0;padding-left:20px}
.err-top a{color:${COLOR.error}}
.pills{display:flex;flex-wrap:wrap;gap:10px}
.pill{position:relative;display:inline-flex;margin:0}
.sr{position:absolute;width:1px;height:1px;margin:0;padding:0;border:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.pill span{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 22px;border-radius:999px;border:1.5px solid rgba(22,50,35,.25);background:transparent;color:${COLOR.forestDeep};font:inherit;font-size:16px;font-weight:500;line-height:1.3;cursor:pointer;transition:background-color 120ms,border-color 120ms;-webkit-tap-highlight-color:transparent}
@media (hover:hover){.pill:hover span{background:rgba(220,215,153,.35)}}
.has-err .pill span{border-color:${COLOR.error}}
.pill input:checked+span{background:${COLOR.khaki};border-color:${COLOR.khaki};color:${COLOR.forestDeep}}
.pill input:focus-visible+span{outline:3px solid ${COLOR.forestDeep};outline-offset:2px}
.sub{margin-top:16px}
.sublabel{display:block;margin:0 0 8px;font-size:15px;line-height:1.45;color:${COLOR.muted}}
.sub .err{margin:-2px 0 8px}
textarea{display:block;width:100%;min-height:112px;padding:12px 16px;border:1.5px solid rgba(22,50,35,.35);border-radius:16px;background:#fff;color:${COLOR.forestDeep};font:inherit;font-size:16px;line-height:1.5;resize:vertical}
.sub textarea{min-height:88px;border-color:rgba(22,50,35,.2);border-radius:14px}
textarea::placeholder{color:${COLOR.muted};opacity:.8}
textarea[aria-invalid=true],.sub textarea[aria-invalid=true]{border-color:${COLOR.error}}
textarea:focus-visible{outline:3px solid ${COLOR.forestDeep};outline-offset:3px}
form.survey button{margin-top:4px}
@media (min-width:600px){form.survey button{width:auto;min-width:240px}}
`

/** A complete HTML document for one survey screen. Every interpolated value is escaped. */
export function renderSurveyScreen(screen: SurveyScreen): string {
  switch (screen.kind) {
    case 'form':
      return renderMadTestShell('Fem korte spørgsmål', formBody(screen), RESET_SEND, SURVEY_STYLE)
    case 'thanks':
      return renderMadTestShell(THANKS.title, THANKS.body)
    case 'already':
      return renderMadTestShell(ALREADY.title, ALREADY.body)
    // The yes-page's own screens, byte for byte: a refused survey link looks
    // exactly like a refused yes-link, and the mail script's preflight checks
    // for the same "Linket virker ikke".
    case 'invalid':
      return renderMadTestScreen({ kind: 'invalid' })
    case 'error':
      return renderMadTestScreen({ kind: 'error' })
  }
}
