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
export const MAD_TEST_SURVEY_COPY_VERSION = '2026-09-29-mad-test-survey-1'

/** Question 1: days with Altid Mad in the last week. */
export const SURVEY_DAYS = ['0', '1', '2-3', '4+'] as const
export type SurveyDays = (typeof SURVEY_DAYS)[number]

/** Question 2: how far they got. 'shopped' implies a plan; only one value is stored. */
export const SURVEY_PROGRESS = ['plan', 'shopped', 'none'] as const
export type SurveyProgress = (typeof SURVEY_PROGRESS)[number]

/** Longest text answer, in characters (code points, as Postgres length() counts). */
export const SURVEY_TEXT_MAX = 2000

export type SurveyAnswers = {
  daysUsed: SurveyDays
  progress: SurveyProgress
  /** 0 to 10, the recommend question. */
  recommend: number
  /** Trimmed, line breaks kept, null when empty. */
  workedBest: string | null
  fixFirst: string | null
}

export function isSurveyDays(value: unknown): value is SurveyDays {
  return typeof value === 'string' && (SURVEY_DAYS as readonly string[]).includes(value)
}

export function isSurveyProgress(value: unknown): value is SurveyProgress {
  return typeof value === 'string' && (SURVEY_PROGRESS as readonly string[]).includes(value)
}

export function isSurveyRecommend(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 10
}

/** A text answer that may be stored: null, or a trimmed non-empty string of at most SURVEY_TEXT_MAX characters. */
export function isSurveyText(value: unknown): value is string | null {
  if (value === null) return true
  if (typeof value !== 'string') return false
  return value.length > 0 && value === normalizeText(value) && textLength(value) <= SURVEY_TEXT_MAX
}

/**
 * A text answer as it is stored: line endings as \n, NUL removed (Postgres text
 * cannot hold it; only a hand-made request can send one), trimmed.
 */
function normalizeText(value: string): string {
  return value.replace(/\r\n?/g, '\n').replace(/\u0000/g, '').trim()
}

function textLength(value: string): number {
  return [...value].length
}

// The field names in the form. They are also the keys of the error map.
const FIELD = {
  daysUsed: 'days_used',
  progress: 'progress',
  recommend: 'recommend',
  workedBest: 'worked_best',
  fixFirst: 'fix_first',
} as const
type Field = keyof typeof FIELD

/** What the form shows: the given answers as raw strings ('' = none). */
export type SurveyValues = Record<Field, string>
export type SurveyErrors = Partial<Record<Field, 'missing' | 'too-long'>>

const EMPTY: SurveyValues = { daysUsed: '', progress: '', recommend: '', workedBest: '', fixFirst: '' }

// A text answer over the limit is shown again so it can be shortened. Anything
// longer than this was not typed into our form (maxlength stops it), so the
// page does not echo it whole.
const ECHO_MAX = 10 * SURVEY_TEXT_MAX

export type SurveyParse =
  | { ok: true; answers: SurveyAnswers }
  | { ok: false; values: SurveyValues; errors: SurveyErrors }

function field(form: FormData, name: string): string | null {
  const v = form.get(name)
  return typeof v === 'string' ? v : null
}

/**
 * Validate a submitted form. A radio value outside its list counts as not
 * answered (the form cannot send it; the value is not shown again).
 */
export function parseSurvey(form: FormData): SurveyParse {
  const values: SurveyValues = { ...EMPTY }
  const errors: SurveyErrors = {}

  const days = field(form, FIELD.daysUsed)
  if (isSurveyDays(days)) values.daysUsed = days
  else errors.daysUsed = 'missing'

  const progress = field(form, FIELD.progress)
  if (isSurveyProgress(progress)) values.progress = progress
  else errors.progress = 'missing'

  const recommend = field(form, FIELD.recommend)
  if (recommend !== null && /^(?:[0-9]|10)$/.test(recommend)) values.recommend = recommend
  else errors.recommend = 'missing'

  for (const key of ['workedBest', 'fixFirst'] as const) {
    const text = normalizeText(field(form, FIELD[key]) ?? '')
    values[key] = [...text].slice(0, ECHO_MAX).join('')
    if (textLength(text) > SURVEY_TEXT_MAX) errors[key] = 'too-long'
  }

  if (Object.keys(errors).length > 0) return { ok: false, values, errors }
  return {
    ok: true,
    answers: {
      daysUsed: values.daysUsed as SurveyDays,
      progress: values.progress as SurveyProgress,
      recommend: Number(values.recommend),
      workedBest: values.workedBest || null,
      fixFirst: values.fixFirst || null,
    },
  }
}

export type SurveyScreen =
  | { kind: 'form'; firstName: string | null; token: string; values?: SurveyValues; errors?: SurveyErrors }
  | { kind: 'thanks' }
  | { kind: 'already' }
  | { kind: 'invalid' }
  | { kind: 'error' }

const DAYS_LABEL: Record<SurveyDays, string> = {
  '0': 'Ingen',
  '1': '1 dag',
  '2-3': '2-3 dage',
  '4+': '4 dage eller flere',
}

const PROGRESS_LABEL: Record<SurveyProgress, string> = {
  plan: 'Jeg lavede en madplan',
  shopped: 'Jeg handlede ind efter den',
  none: 'Ingen af delene',
}

const QUESTION: Record<Field, string> = {
  daysUsed: 'Hvor mange dage har du brugt Altid&nbsp;Mad den sidste uge?',
  progress: 'Hvor langt nåede du?',
  recommend: 'Hvor sandsynligt er det, at du vil anbefale Altid&nbsp;Mad til en ven eller kollega?',
  workedBest: 'Hvad virkede bedst?',
  fixFirst: 'Hvad skal vi rette først?',
}

const SCALE_LOW = 'Slet ikke sandsynligt'
const SCALE_HIGH = 'Meget sandsynligt'
const SEND_LABEL = 'Send svar'

const ERROR_TEXT: Record<'missing' | 'too-long', string> = {
  missing: 'Vælg et svar.',
  'too-long': `Svaret er for langt. Skriv højst ${SURVEY_TEXT_MAX} tegn.`,
}

// Back from the back/forward cache: the button says "Send svar" again and the
// form may be sent again (the server keeps only the first answer).
const RESET_SEND = `var f=document.querySelector('form');if(f){delete f.dataset.sent;f.querySelector('button').textContent='${SEND_LABEL}'}`

function actionFor(token: string): string {
  return escapeHtml(`/api/mad-testen/survey?t=${encodeURIComponent(token)}`)
}

function errorAttrs(key: Field, errors: SurveyErrors): string {
  return errors[key] ? ` aria-invalid="true" aria-describedby="${FIELD[key]}-err"` : ''
}

function errorLine(key: Field, errors: SurveyErrors): string {
  const e = errors[key]
  return e ? `\n  <p id="${FIELD[key]}-err" class="err">${ERROR_TEXT[e]}</p>` : ''
}

function legend(n: number, key: Field): string {
  return `<legend><span class="qn" aria-hidden="true">${n}</span>${QUESTION[key]}</legend>`
}

// The native radio stays in the page (keyboard, screen readers, no JavaScript);
// `required` on a group's radios makes the browser ask before sending.
function radio(key: Field, value: string, label: string, values: SurveyValues, errors: SurveyErrors): string {
  const checked = values[key] === value ? ' checked' : ''
  return `<label class="opt"><input type="radio" name="${FIELD[key]}" value="${value}" required${checked}${errorAttrs(key, errors)}/><span>${label}</span></label>`
}

function choiceQuestion<V extends string>(
  n: number,
  key: Field,
  options: readonly V[],
  labels: Record<V, string>,
  values: SurveyValues,
  errors: SurveyErrors,
): string {
  return `<fieldset class="q${errors[key] ? ' has-err' : ''}">
  ${legend(n, key)}${errorLine(key, errors)}
  <div class="opts">
    ${options.map((v) => radio(key, v, labels[v], values, errors)).join('\n    ')}
  </div>
</fieldset>`
}

function scaleQuestion(n: number, values: SurveyValues, errors: SurveyErrors): string {
  const key: Field = 'recommend'
  const points = Array.from({ length: 11 }, (_, i) => {
    const v = String(i)
    const checked = values[key] === v ? ' checked' : ''
    // The end labels are part of the 0 and 10 radios' names for screen readers;
    // sighted readers get them in the line above the scale.
    const end = i === 0 ? `<span class="vh">, ${SCALE_LOW}</span>` : i === 10 ? `<span class="vh">, ${SCALE_HIGH}</span>` : ''
    return `<label class="pt"><input type="radio" name="${FIELD[key]}" value="${v}" required${checked}${errorAttrs(key, errors)}/><span>${v}${end}</span></label>`
  })
  return `<fieldset class="q${errors[key] ? ' has-err' : ''}">
  ${legend(n, key)}${errorLine(key, errors)}
  <p class="ends" aria-hidden="true"><span>0 = ${SCALE_LOW}</span><span>10 = ${SCALE_HIGH}</span></p>
  <div class="scale">
    ${points.join('\n    ')}
  </div>
</fieldset>`
}

function textQuestion(n: number, key: Field, values: SurveyValues, errors: SurveyErrors): string {
  const id = FIELD[key]
  return `<div class="q${errors[key] ? ' has-err' : ''}">
  <label for="${id}" class="qlabel"><span class="qn" aria-hidden="true">${n}</span>${QUESTION[key]} <span class="optional">(valgfrit)</span></label>${errorLine(key, errors)}
  <textarea id="${id}" name="${id}" rows="4" maxlength="${SURVEY_TEXT_MAX}"${errorAttrs(key, errors)}>${escapeHtml(values[key])}</textarea>
</div>`
}

function formBody(screen: Extract<SurveyScreen, { kind: 'form' }>): string {
  const values = screen.values ?? EMPTY
  const errors = screen.errors ?? {}
  const summary = Object.keys(errors).length
    ? `\n<p class="err-top" role="alert">Tjek de markerede spørgsmål, og send igen.</p>`
    : ''
  return `<p class="hello">${greeting(screen.firstName)},</p>
<h1>Hvordan gik de første dage med Altid&nbsp;Mad?</h1>
<p class="lead">Fem korte spørgsmål. Det tager to minutter, og dine svar går direkte til holdet bag appen.</p>${summary}
<form method="POST" action="${actionFor(screen.token)}" class="survey" onsubmit="${ON_SUBMIT}">
${choiceQuestion(1, 'daysUsed', SURVEY_DAYS, DAYS_LABEL, values, errors)}
${choiceQuestion(2, 'progress', SURVEY_PROGRESS, PROGRESS_LABEL, values, errors)}
${scaleQuestion(3, values, errors)}
${textQuestion(4, 'workedBest', values, errors)}
${textQuestion(5, 'fixFirst', values, errors)}
<button type="submit" class="primary">${SEND_LABEL}</button>
</form>
<p class="small"><a href="/privatlivspolitik">Sådan behandler vi dine data</a></p>`
}

const THANKS_LEAD = `Vi læser dem alle. Har du mere på hjerte, så tryk på Feedback i appen eller skriv til <a href="mailto:${SUPPORT_MAIL}">${SUPPORT_MAIL}</a>.`

function done(title: string): { title: string; body: string } {
  return {
    title,
    body: `${CHECK}
<h1>${title}</h1>
<p class="lead">${THANKS_LEAD}</p>`,
  }
}

// Rules on top of the yes-page's STYLE, whose bare `label` rule (for the
// Google-account field) is reset here for the option labels. Fieldsets for the
// radio groups, option rows as large tap targets, the 0 to 10 scale in two rows
// on a phone (6 + 5, every point at least 44 px wide at 375 px) and one row
// from 600 px.
const SURVEY_STYLE = `
form.survey{display:block;margin:28px 0 20px}
.q{border:0;margin:0 0 32px;padding:0;min-width:0}
legend,.qlabel{display:block;padding:0;margin:0 0 12px;font-size:17px;font-weight:500;line-height:1.4;color:${COLOR.forestDeep};text-wrap:pretty}
.qn{display:inline-block;min-width:1.6em;color:${COLOR.muted};font-weight:400}
.optional{font-weight:400;color:${COLOR.muted};font-size:15px}
.q .err{margin:-4px 0 12px}
.err-top{font-size:15px;line-height:1.5;color:${COLOR.error};margin:0 0 8px}
.opts{display:flex;flex-direction:column;gap:8px}
.opt{display:flex;align-items:center;gap:12px;margin:0;min-height:52px;padding:12px 16px;border:1.5px solid rgba(22,50,35,.25);border-radius:16px;background:#fff;color:${COLOR.forestDeep};font-size:16px;line-height:1.35;cursor:pointer}
.opt input{flex:none;width:20px;height:20px;margin:0;accent-color:${COLOR.forestDeep}}
.opt:has(input:checked){border-color:${COLOR.forestDeep};background:rgba(220,215,153,.35)}
.has-err .opt,.has-err .pt span{border-color:${COLOR.error}}
.ends{display:flex;justify-content:space-between;gap:16px;font-size:13px;line-height:1.35;color:${COLOR.muted};margin:0 0 8px}
.ends span:last-child{text-align:right}
.scale{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px}
.pt{position:relative;display:block;margin:0;cursor:pointer}
.pt input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer}
.pt span{display:flex;align-items:center;justify-content:center;min-height:48px;border:1.5px solid rgba(22,50,35,.25);border-radius:12px;background:#fff;color:${COLOR.forestDeep};font-size:16px;font-weight:500;font-variant-numeric:tabular-nums}
.pt input:checked+span{border-color:${COLOR.forestDeep};background:${COLOR.khaki}}
.pt input:focus-visible+span,.opt:has(input:focus-visible){outline:3px solid ${COLOR.forestDeep};outline-offset:2px}
.vh{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
textarea{display:block;width:100%;min-height:112px;padding:12px 16px;border:1.5px solid rgba(22,50,35,.35);border-radius:16px;background:#fff;color:${COLOR.forestDeep};font:inherit;font-size:16px;line-height:1.5;resize:vertical}
textarea[aria-invalid=true]{border-color:${COLOR.error}}
textarea:focus-visible{outline:3px solid ${COLOR.forestDeep};outline-offset:3px}
form.survey button{margin-top:8px}
@media (min-width:600px){.scale{grid-template-columns:repeat(11,minmax(0,1fr))}form.survey button{width:auto;min-width:240px}}
`

/** A complete HTML document for one survey screen. Every interpolated value is escaped. */
export function renderSurveyScreen(screen: SurveyScreen): string {
  switch (screen.kind) {
    case 'form':
      return renderMadTestShell('Fem korte spørgsmål', formBody(screen), RESET_SEND, SURVEY_STYLE)
    case 'thanks': {
      const { title, body } = done('Tak for dine svar')
      return renderMadTestShell(title, body)
    }
    case 'already': {
      const { title, body } = done('Tak, vi har allerede dine svar')
      return renderMadTestShell(title, body)
    }
    // The yes-page's own screens, byte for byte: a refused survey link looks
    // exactly like a refused yes-link, and the mail script's preflight checks
    // for the same "Linket virker ikke".
    case 'invalid':
      return renderMadTestScreen({ kind: 'invalid' })
    case 'error':
      return renderMadTestScreen({ kind: 'error' })
  }
}
