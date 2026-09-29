import { NextRequest, NextResponse } from 'next/server'
import { getMadTestOptin, getMadTestSurvey, getSignupByUnsubToken, recordMadTestSurvey } from '@/lib/db'
import { isMadTestEligible } from '@/lib/mad-test'
import {
  MAD_TEST_SURVEY_COPY_VERSION,
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
// to the test (a mad_test_optin row). Everyone else gets the invalid-link
// screen.

// signup.unsub_token is a Postgres uuid column. Anything else never reaches the
// database: PostgREST answers a non-uuid filter with 22P02, which would turn a
// mangled link into a 500 instead of the invalid-link screen.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

async function tester(req: NextRequest) {
  const token = (req.nextUrl.searchParams.get('t') ?? '').trim()
  if (!UUID.test(token)) return null
  const signup = await getSignupByUnsubToken(token)
  if (!signup || !isMadTestEligible(signup)) return null
  if (!(await getMadTestOptin(signup.publicId))) return null
  return { token, signup }
}

function sameAnswers(a: SurveyAnswers, b: SurveyAnswers): boolean {
  return (
    a.daysUsed === b.daysUsed &&
    a.progress === b.progress &&
    a.recommend === b.recommend &&
    a.workedBest === b.workedBest &&
    a.fixFirst === b.fixFirst
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
    // A body that is not form data at all (JSON, text/plain, no content type)
    // makes formData() throw; that is a refusal, not a server error.
    let form: FormData
    try {
      form = await req.formData()
    } catch {
      return invalid()
    }

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
