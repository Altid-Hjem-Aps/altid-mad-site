/**
 * Mad-testen yes-page (ALT-345): who may answer, and the screens.
 *
 * The screens are plain server-rendered HTML (the /api/unsubscribe pattern):
 * no React, no Amplitude, no cookie, no third-party request. The page is reached
 * from a link that carries the person's unsub_token, so nothing on it may leak
 * that URL: no external font or image, and Referrer-Policy: no-referrer.
 *
 * The look is the Altid Mad mail shell (mad-batch-rollout, emails/BRAND.md): a
 * deep green header with the white Altid Mad logo, cream body, Onest, and the
 * khaki button of the mad-referral-welcome template. Onest is self-hosted from /fonts so no request reaches Google.
 *
 * The invitation mail is the gate: it has one button per phone, and each opens
 * its own route here (?d=iphone or ?d=android), with as few steps as possible
 * (Thor 30/9). The iPhone route needs no second tap: the page sends its own
 * form as soon as a real browser shows it, so the tester lands on the
 * thank-you screen. Opening the link still writes nothing on the server: a mail
 * scanner that only fetches the page cannot say yes, and an automated browser
 * (navigator.webdriver) is left at the button. Without JavaScript the button is
 * there to press. The Android route asks for the Google account on the phone, because Google Play only lets listed Google accounts
 * install an internal test build (up to 100, no review; read on
 * support.google.com/googleplay/android-developer/answer/9845334, 29/9).
 */

/**
 * Stored on every yes row. Bump it whenever the form screen's wording changes,
 * so each row resolves to the exact text the person said yes to.
 */
export const MAD_TEST_COPY_VERSION = '2026-10-01-mad-test-6'

/** The two altidmad.dk signup forms. Hjem-form signups are not in the test. */
export const MAD_TEST_SOURCES: readonly string[] = ['altid-mad', 'altid-mad-exit']

/**
 * Same audience as the invitation send: an active altidmad.dk signup with Altid
 * Mad marketing consent. Anyone else sees the invalid-link screen, whatever the
 * reason, so the page never tells a stranger who is on the list.
 */
export function isMadTestEligible(s: {
  unsubscribed: boolean
  consentMad: boolean
  source: string | null
}): boolean {
  return !s.unsubscribed && s.consentMad && s.source !== null && MAD_TEST_SOURCES.includes(s.source)
}

/** The two answers on the form. */
export const MAD_TEST_DEVICES = ['iphone', 'android'] as const
export type MadTestDevice = (typeof MAD_TEST_DEVICES)[number]

export function isMadTestDevice(value: unknown): value is MadTestDevice {
  return typeof value === 'string' && (MAD_TEST_DEVICES as readonly string[]).includes(value)
}

/**
 * The Google account an Android tester typed, normalised (trimmed, lower-cased),
 * or null when it is not one address. Letters, digits and . _ % + - only: the
 * Android login mail prints it raw ({{{google_account}}} in Resend), so it may
 * hold no character that means anything in HTML. Gmail and Google Workspace
 * addresses fit. Same pattern as GOOGLE_ACCOUNT_RE in altid-dashboard's
 * madtest_common.py. Longer than 254 is not an address either (RFC 5321).
 */
export function normalizeGoogleAccount(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  if (v.length === 0 || v.length > 254) return null
  return /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(v) ? v : null
}

/**
 * What the Google-account field starts with: the signup email when it is a
 * Gmail address (then it is a Google account), else empty. A Hotmail or work
 * address is usually not the account on the phone, and a person who taps Send
 * without reading would land on the tester list with an address that can
 * never install the build.
 */
export function googleAccountPrefill(signupEmail: string): string {
  const v = normalizeGoogleAccount(signupEmail)
  return v !== null && /@(gmail|googlemail)\.com$/.test(v) ? v : ''
}

/** HTML-escape a value for text content and double-quoted attributes. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export type MadTestScreen =
  // No phone chosen in the link (an old or hand-typed link): both answers.
  | { kind: 'form'; firstName: string | null; token: string }
  // The iPhone route from the mail: a form that sends itself (or one button).
  | { kind: 'confirm'; firstName: string | null; token: string }
  // Step two for Android: which Google account is on the phone. `value` is what
  // the field shows (the signup email first, then whatever was typed); `retry`
  // is true when the last submission was not an address.
  | { kind: 'google'; token: string; value: string; retry: boolean }
  | { kind: 'thanks'; device: MadTestDevice; firstName: string | null }
  | { kind: 'already'; device: MadTestDevice }
  | { kind: 'invalid' }
  | { kind: 'error' }

const COLOR = {
  forestDeep: '#163223',
  cream: '#fdfaf4',
  // Altid Mad accent, from the mad-referral-welcome Resend template.
  khaki: '#DCD799',
  khakiPressed: '#CFC985',
  muted: '#6f6a61',
  error: '#a33a1f',
} as const

const SUPPORT_MAIL = 'hej@altidmad.dk'

// What happens next, per answer. The thank-you and already-answered screens
// share it: the next step is the same whichever way the person got here.
const NEXT_STEP: Record<MadTestDevice, string> = {
  iphone: 'Du får en mail med dit login, så snart testversionen er klar i TestFlight.',
  android: 'Du får en mail med dit login, så snart testversionen er klar i Google&nbsp;Play.',
}

const QUESTIONS = `Har du spørgsmål, kan du skrive til <a href="mailto:${SUPPORT_MAIL}">${SUPPORT_MAIL}</a>.`

const CHECK = `<div class="mark" aria-hidden="true"><svg viewBox="0 0 48 48" width="48" height="48"><circle cx="24" cy="24" r="24" fill="${COLOR.khaki}"/><path d="M15 24.5l6 6 12-13" fill="none" stroke="${COLOR.forestDeep}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`

function greeting(firstName: string | null): string {
  const name = (firstName ?? '').trim()
  return name ? `Hej ${escapeHtml(name)}` : 'Hej'
}

const ANSWER_LABEL: Record<MadTestDevice, string> = {
  iphone: 'Jeg vil teste på iPhone',
  android: 'Jeg vil teste på Android',
}
// The Google-account step's button: the phone is already chosen in the mail.
const GOOGLE_LABEL = 'Fortsæt med Android'

// The pressed button says "Et øjeblik" and a second tap sends nothing. The
// buttons are NOT disabled: a disabled submitter drops its device=… value from
// the request. pageshow puts the labels back when the browser restores this page
// from its back/forward cache, so a person who comes back can answer again.
const ON_SUBMIT = `if(this.dataset.sent){return false}this.dataset.sent='1';if(event.submitter){event.submitter.textContent='Et øjeblik'}`
// Every button carries its own label in data-l, so one script serves all forms.
const RESET_BUTTONS = `var f=document.querySelector('form');if(f){delete f.dataset.sent;f.querySelectorAll('button').forEach(function(b){b.textContent=b.dataset.l})}`

// The iPhone route: send the form once when the page is first shown. A page
// restored from the back/forward cache (event.persisted) only gets its button
// back, so going back never answers twice.
const AUTO_SEND = `var f=document.querySelector('form');if(f){if(event.persisted){delete f.dataset.sent;f.querySelectorAll('button').forEach(function(b){b.textContent=b.dataset.l})}else if(!navigator.webdriver){if(f.requestSubmit){f.requestSubmit(f.querySelector('button'))}}}`

// The Google-account step: "Fortsæt med Android" is switched off until the field
// holds an address (same pattern as normalizeGoogleAccount). Set by script only,
// so without JavaScript the button works and the server does the check.
const GA_CHECK = `var i=document.getElementById('ga'),b=document.querySelector('form button');if(i){if(b){b.disabled=!/^[a-z0-9._%+-]+@[a-z0-9-]+(\\.[a-z0-9-]+)*\\.[a-z]{2,}$/.test(i.value.trim().toLowerCase())}}`

function answerButton(device: MadTestDevice, cls: 'primary' | 'secondary'): string {
  const label = ANSWER_LABEL[device]
  // aria-live: the label turns into "Et øjeblik" on submit, and a screen reader
  // should hear that.
  return `<button type="submit" name="device" value="${device}" class="${cls}" aria-live="polite" data-l="${label}">${label}</button>`
}

// The other route, for a person who pressed the wrong button in the mail.
// A relative link: opening it writes nothing. The iPhone route sends itself
// on arrival, so no in-page link may point at it: a mis-tap on a 15px link
// would be an irrevocable answer. The link to iPhone goes to the two-button
// form instead, where the answer is a deliberate tap on a 56px button.
function otherPhone(token: string, device: MadTestDevice, text: string): string {
  const target = device === 'iphone' ? actionFor(token) : `${actionFor(token)}&amp;d=${device}`
  return `<p class="small"><a href="${target}">${text}</a></p>`
}

// Raw text: the title is escaped where it is written (the <title> and the <h1>),
// never before, so a name with & or ' is escaped exactly once in both.
function thanksTitle(firstName: string | null): string {
  const name = (firstName ?? '').trim()
  return name ? `Tak ${name}, du er med` : 'Tak, du er med'
}

function answered(title: string, device: MadTestDevice): { title: string; body: string } {
  return {
    title,
    body: `${CHECK}
<h1>${escapeHtml(title)}</h1>
<p class="lead">${NEXT_STEP[device]}</p>
<p class="note">${QUESTIONS}</p>`,
  }
}

function actionFor(token: string): string {
  return escapeHtml(`/api/mad-testen?t=${encodeURIComponent(token)}`)
}

function content(screen: MadTestScreen): { title: string; body: string; onPageShow?: string } {
  switch (screen.kind) {
    case 'form':
      return {
        title: 'Vil du teste Altid Mad?',
        onPageShow: RESET_BUTTONS,
        body: `<h1>${greeting(screen.firstName)}, vil du teste Altid&nbsp;Mad før alle andre?</h1>
<p class="lead">Vælg, om du vil teste på iPhone eller Android.</p>
<p class="note">Vi opretter en testkonto på din <span class="nw">e-mailadresse</span> og sender dig dit personlige testlogin på mail.</p>
<form method="POST" action="${actionFor(screen.token)}" onsubmit="${ON_SUBMIT}">
  ${answerButton('iphone', 'primary')}
  ${answerButton('android', 'secondary')}
</form>
<p class="small"><a href="/privatlivspolitik">Sådan behandler vi dine data</a></p>`,
      }
    case 'confirm':
      return {
        title: 'Test Altid Mad på iPhone',
        onPageShow: AUTO_SEND,
        body: `<h1>${greeting(screen.firstName)}, vil du teste Altid&nbsp;Mad på din iPhone?</h1>
<p class="lead">Testen foregår gennem Apples gratis app TestFlight.</p>
<p class="note">Vi opretter en testkonto på din <span class="nw">e-mailadresse</span> og sender dig dit login på mail, så snart testversionen er klar i TestFlight.</p>
<form method="POST" action="${actionFor(screen.token)}" onsubmit="${ON_SUBMIT}">
  ${answerButton('iphone', 'primary')}
</form>
${otherPhone(screen.token, 'android', 'Jeg har Android')}
<p class="small"><a href="/privatlivspolitik">Sådan behandler vi dine data</a></p>`,
      }
    case 'google':
      return {
        title: 'Din Google-konto',
        onPageShow: `${RESET_BUTTONS};${GA_CHECK}`,
        body: `<h1>Hvilken Google-konto bruger du på din Android-telefon?</h1>
<p class="lead">For at give dig adgang til testen skal vi bruge den Google-konto, du er logget ind med i Google&nbsp;Play på din Android-telefon.</p>
<p class="lead">Det er ofte en Gmail-adresse.</p>
<form method="POST" action="${actionFor(screen.token)}" onsubmit="${ON_SUBMIT}" oninput="${GA_CHECK}">
  <input type="hidden" name="device" value="android"/>
  <label for="ga">Google-konto</label>
  <input id="ga" type="email" name="google_account" value="${escapeHtml(screen.value)}" autocomplete="email" inputmode="email" autocapitalize="none" spellcheck="false" placeholder="navn@gmail.com" required${screen.retry ? ' aria-invalid="true" aria-describedby="ga-err" autofocus' : ''}/>${screen.retry ? `\n  <p id="ga-err" class="err">Det ligner ikke en e-mailadresse. Skriv hele adressen, fx navn@gmail.com.</p>` : ''}
  <button type="submit" class="primary" aria-live="polite" data-l="${GOOGLE_LABEL}">${GOOGLE_LABEL}</button>
</form>
<p class="note pair">Vi bruger kun din Google-konto til at give dig adgang til testen i Google&nbsp;Play.</p>
<p class="note">Dit login til Altid&nbsp;Mad er stadig den <span class="nw">e-mailadresse</span>, du skrev dig på ventelisten med.</p>
${otherPhone(screen.token, 'iphone', 'Jeg har en iPhone')}
<p class="small"><a href="/privatlivspolitik">Sådan behandler vi dine data</a></p>`,
      }
    case 'thanks':
      return answered(thanksTitle(screen.firstName), screen.device)
    case 'already':
      return answered('Vi har allerede dit ja', screen.device)
    case 'invalid':
      return {
        title: 'Linket virker ikke',
        body: `<h1>Linket virker ikke</h1>
<p class="lead">Linket kan ikke bruges til testen af Altid&nbsp;Mad. Har du fået det i en mail fra os, så skriv til <a href="mailto:${SUPPORT_MAIL}">${SUPPORT_MAIL}</a>.</p>
<p class="small"><a href="/">Gå til altidmad.dk</a></p>`,
      }
    case 'error':
      return {
        title: 'Noget gik galt',
        body: `<h1>Noget gik galt</h1>
<p class="lead">Åbn linket i mailen igen om lidt.</p>
<p class="note">Virker det stadig ikke, så skriv til <a href="mailto:${SUPPORT_MAIL}">${SUPPORT_MAIL}</a>.</p>`,
      }
  }
}

const STYLE = `
@font-face{font-family:'Onest';src:url('/fonts/onest-latin.woff2') format('woff2');font-weight:100 900;font-style:normal;font-display:swap}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%}
body{margin:0;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;background:${COLOR.cream};color:${COLOR.forestDeep};font-family:'Onest',system-ui,-apple-system,'Helvetica Neue',Arial,sans-serif;font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased}
.bar{background:${COLOR.forestDeep}}
.bar-in,main,.foot-in{width:100%;max-width:560px;margin:0 auto;padding-left:24px;padding-right:24px}
.bar-in{padding-top:20px;padding-bottom:20px}
.bar img{display:block;width:88px;height:47px}
main{flex:1;padding-top:40px;padding-bottom:48px}
h1{font-size:clamp(1.875rem,7.4vw,2.375rem);font-weight:400;line-height:1.18;letter-spacing:-0.02em;margin:0 0 20px;text-wrap:balance;overflow-wrap:break-word}
p{margin:0}
.hello{color:${COLOR.muted};margin-bottom:8px;overflow-wrap:anywhere}
.lead{margin-bottom:16px;text-wrap:pretty}
.lead strong{font-weight:500}
.note{font-size:15px;line-height:1.55;color:${COLOR.muted};margin-bottom:28px;text-wrap:pretty}
.note.pair{margin-bottom:10px}
.small{font-size:15px}
.small a{display:inline-block;padding:10px 0}
.nw{white-space:nowrap}
a{color:${COLOR.forestDeep};text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1px}
a:focus-visible,button:focus-visible,input:focus-visible{outline:3px solid ${COLOR.forestDeep};outline-offset:3px;border-radius:4px}
form{display:flex;flex-direction:column;gap:12px;margin:0 0 20px}
label{font-size:15px;color:${COLOR.muted};margin-bottom:-6px}
input[type=email]{display:block;width:100%;min-height:56px;padding:14px 20px;border:1.5px solid rgba(22,50,35,.35);border-radius:16px;background:#fff;color:${COLOR.forestDeep};font:inherit;line-height:1.3}
input[type=email][aria-invalid=true]{border-color:${COLOR.error}}
input[type=email]:focus-visible{border-radius:16px}
.err{font-size:15px;line-height:1.5;color:${COLOR.error};margin-top:-4px}
button{display:block;width:100%;min-height:56px;padding:14px 24px;border-radius:999px;color:${COLOR.forestDeep};font:inherit;font-weight:500;line-height:1.3;cursor:pointer;transition:background-color .2s cubic-bezier(.25,1,.5,1),transform .2s cubic-bezier(.25,1,.5,1);-webkit-tap-highlight-color:transparent}
.primary{border:1.5px solid ${COLOR.khaki};background:${COLOR.khaki}}
.primary:hover{border-color:${COLOR.khakiPressed};background:${COLOR.khakiPressed}}
.secondary{border:1.5px solid ${COLOR.forestDeep};background:transparent}
.secondary:hover{background:rgba(22,50,35,.06)}
button:active{transform:scale(.98)}
button:disabled{opacity:.45;cursor:not-allowed;transform:none}
button:focus-visible{border-radius:999px}
.mark{margin-bottom:24px}
.mark svg{display:block}
.mark path{stroke-dasharray:32;stroke-dashoffset:0;animation:draw .45s cubic-bezier(.25,1,.5,1) both}
@keyframes draw{from{stroke-dashoffset:32}to{stroke-dashoffset:0}}
.foot{border-top:1px solid rgba(22,50,35,.1)}
.foot-in{padding-top:20px;padding-bottom:28px;font-size:13px;color:${COLOR.muted}}
@media (min-width:600px){main{padding-top:72px;padding-bottom:80px}form{flex-direction:row;flex-wrap:wrap}form:has(input[type=email]){flex-direction:column}button{width:auto;min-width:240px}form:has(input[type=email]) button{align-self:flex-start}}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
`

/** A complete HTML document for one screen. Every interpolated value is escaped. */
export function renderMadTestScreen(screen: MadTestScreen): string {
  const { title, body, onPageShow } = content(screen)
  return `<!doctype html>
<html lang="da"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
<meta name="robots" content="noindex, nofollow"/>
<meta name="referrer" content="no-referrer"/>
<meta name="theme-color" content="${COLOR.forestDeep}"/>
<title>${escapeHtml(title)} | Altid Mad</title>
<link rel="preload" href="/fonts/onest-latin.woff2" as="font" type="font/woff2" crossorigin/>
<style>${STYLE}</style>
</head>
<body${onPageShow ? ` onpageshow="${onPageShow}"` : ''}>
<header class="bar"><div class="bar-in"><img src="/email/mad/altid-mad-logo-white.png" alt="Altid Mad" width="88" height="47"/></div></header>
<main>
${body}
</main>
<footer class="foot"><div class="foot-in">Altid Hjem ApS · Danmark</div></footer>
</body></html>`
}
