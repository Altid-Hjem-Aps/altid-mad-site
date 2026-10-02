import { NextRequest, NextResponse } from 'next/server'
import { getMadTestSurvey, recordMadTestSurvey } from '@/lib/db'
import { tester } from '@/lib/mad-test-access'
import {
  MAD_TEST_SURVEY_COPY_VERSION,
  SURVEY_BODY_MAX,
  SURVEY_FIELD_NAMES,
  parseSurvey,
  renderSurveyScreen,
  type SurveyAnswers,
  type SurveyScreen,
} from '@/lib/mad-test-survey'

// Mad-testen day-5 survey (ALT-345). The survey mail links here with
// ?t=<unsub_token>. GET only SHOWS the five questions and writes nothing, so a
// mail scanner opening the link cannot answer for anyone. POST (the form)
// writes, once per person. Same rules as the yes-page (../route.ts): no cookie,
// the token rides in the form action's query string.
//
// Who may answer: an eligible signup (same test as the yes-page) that said yes
// to the test (a mad_test_optin row), checked in lib/mad-test-access.ts.
// Everyone else gets the invalid-link screen. The form tells
// /api/mad-testen/open that a real browser showed it (see reportOpen in
// lib/mad-test.ts); this route itself records no visit.

function respond(screen: SurveyScreen, status: number) {
  return new NextResponse(renderSurveyScreen(screen), {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Per-person page behind a secret link: never cached, never indexed, and
      // the link itself must not leak onward in a Referer header.
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'Referrer-Policy': 'no-referrer',
    },
  })
}

// One screen and one status for every reason a link is refused (no token, not
// a uuid, unknown token, unsubscribed, no Mad consent, Hjem-form signup, never
// said yes to the test), so the page never reveals who is on the list or in
// the test.
const invalid = () => respond({ kind: 'invalid' }, 400)
const failed = () => respond({ kind: 'error' }, 500)

function sameAnswers(a: SurveyAnswers, b: SurveyAnswers): boolean {
  return (
    a.planFit === b.planFit &&
    a.planFitNote === b.planFitNote &&
    a.easyToUse === b.easyToUse &&
    a.easyNote === b.easyNote &&
    a.missing === b.missing &&
    a.otherFeedback === b.otherFeedback &&
    a.panel === b.panel
  )
}

export async function GET(req: NextRequest) {
  try {
    const found = await tester(req)
    if (!found) return invalid()
    if (await getMadTestSurvey(found.signup.publicId)) return respond({ kind: 'already' }, 200)
    return respond({ kind: 'form', firstName: found.signup.firstName, token: found.token }, 200)
  } catch (e) {
    console.error('mad-testen survey GET failed', e)
    return failed()
  }
}

export async function POST(req: NextRequest) {
  try {
    const found = await tester(req)
    if (!found) return invalid()
    // The body is only read when it declares a size we accept: formData()
    // buffers and parses all of it. A browser always sends content-length with
    // a form post; a body without one, or bigger than any real answer, is a
    // hand-made request and refused unread.
    const size = req.headers.get('content-length')
    if (size === null || !/^\d+$/.test(size) || Number(size) > SURVEY_BODY_MAX) return invalid()
    // A body that is not form data at all (JSON, text/plain, no content type)
    // makes formData() throw; that is a refusal, not a server error.
    let form: FormData
    try {
      form = await req.formData()
    } catch {
      return invalid()
    }
    // Our form sends each field at most once. A repeated field is a hand-made
    // request: refused like any other, never a first-or-last guess.
    if (SURVEY_FIELD_NAMES.some((name) => form.getAll(name).length > 1)) return invalid()
    // Our form sends text only. A file under a survey field's name would read as
    // "not answered" and be stored as such, and the first-answer rule would then
    // block the real answer: refused before anything is parsed.
    if (SURVEY_FIELD_NAMES.some((name) => form.getAll(name).some((v) => typeof v !== 'string'))) return invalid()

    if (await getMadTestSurvey(found.signup.publicId)) return respond({ kind: 'already' }, 200)

    const parsed = parseSurvey(form)
    if (!parsed.ok) {
      // Missing or out-of-range answers: the form again with what was given,
      // nothing written.
      return respond(
        { kind: 'form', firstName: found.signup.firstName, token: found.token, values: parsed.values, errors: parsed.errors },
        200,
      )
    }

    await recordMadTestSurvey(found.signup.publicId, MAD_TEST_SURVEY_COPY_VERSION, parsed.answers)
    // Read back what is stored: if two answers raced, the first row won and the
    // screen must describe that row, not the losing request.
    const stored = await getMadTestSurvey(found.signup.publicId)
    if (!stored) throw new Error('mad_test_survey row missing right after insert')
    if (stored.copyVersion !== MAD_TEST_SURVEY_COPY_VERSION || !sameAnswers(stored, parsed.answers)) {
      return respond({ kind: 'already' }, 200)
    }
    return respond({ kind: 'thanks' }, 200)
  } catch (e) {
    console.error('mad-testen survey POST failed', e)
    return failed()
  }
}
