/**
 * Mad-testen yes-page (ALT-345): who may answer, and the five screens.
 *
 * The screens are plain server-rendered HTML (the /api/unsubscribe pattern):
 * no React, no Amplitude, no cookie, no third-party request. The page is reached
 * from a link that carries the person's unsub_token, so nothing on it may leak
 * that URL: no external font or image, and Referrer-Policy: no-referrer.
 *
 * The look is the Altid Mad mail shell (mad-batch-rollout, emails/BRAND.md): a
 * deep green header with the white Altid Mad logo, cream body, Onest, and the
 * khaki button of the mad-referral-welcome template. Onest is self-hosted from /fonts so no request reaches Google.
 */

/**
 * Stored on every yes row. Bump it whenever the form screen's wording changes,
 * so each row resolves to the exact text the person said yes to.
 */
export const MAD_TEST_COPY_VERSION = '2026-09-25-mad-test-2'

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

/** The two answers on the form: the test runs on iPhone only. */
export const MAD_TEST_DEVICES = ['iphone', 'android'] as const
export type MadTestDevice = (typeof MAD_TEST_DEVICES)[number]

export function isMadTestDevice(value: unknown): value is MadTestDevice {
  return typeof value === 'string' && (MAD_TEST_DEVICES as readonly string[]).includes(value)
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
  | { kind: 'form'; firstName: string | null; token: string }
  | { kind: 'thanks'; device: MadTestDevice }
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
} as const

const SUPPORT_MAIL = 'hej@altidmad.dk'

// What happens next, per answer. The thank-you and already-answered screens
// share it: the next step is the same whichever way the person got here.
const NEXT_STEP: Record<MadTestDevice, string> = {
  iphone: 'Du får en mail med dit login, så snart Apple har godkendt testversionen.',
  android: 'Testen kører kun på iPhone, så du er ikke med denne gang. Du står stadig på ventelisten til Altid&nbsp;Mad.',
}

const QUESTIONS = `Har du spørgsmål, så skriv til <a href="mailto:${SUPPORT_MAIL}">${SUPPORT_MAIL}</a>.`

const CHECK = `<div class="mark" aria-hidden="true"><svg viewBox="0 0 48 48" width="48" height="48"><circle cx="24" cy="24" r="24" fill="${COLOR.khaki}"/><path d="M15 24.5l6 6 12-13" fill="none" stroke="${COLOR.forestDeep}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`

function greeting(firstName: string | null): string {
  const name = (firstName ?? '').trim()
  return name ? `Hej ${escapeHtml(name)}` : 'Hej'
}

const ANSWER_LABEL: Record<MadTestDevice, string> = {
  iphone: 'Ja, jeg har en iPhone',
  android: 'Ja, men jeg har Android',
}

// The pressed button says "Et øjeblik" and a second tap sends nothing. The
// buttons are NOT disabled: a disabled submitter drops its device=… value from
// the request. pageshow puts the labels back when the browser restores this page
// from its back/forward cache, so a person who comes back can answer again.
const ON_SUBMIT = `if(this.dataset.sent){return false}this.dataset.sent='1';if(event.submitter){event.submitter.textContent='Et øjeblik'}`
const RESET_BUTTONS = `var f=document.querySelector('form');if(f){delete f.dataset.sent;f.querySelector('[value=iphone]').textContent='${ANSWER_LABEL.iphone}';f.querySelector('[value=android]').textContent='${ANSWER_LABEL.android}'}`

function answered(title: string, device: MadTestDevice): { title: string; body: string } {
  return {
    title,
    body: `${CHECK}
<h1>${title}</h1>
<p class="lead">${NEXT_STEP[device]}</p>${device === 'iphone' ? `\n<p class="note">${QUESTIONS}</p>` : ''}`,
  }
}

function content(screen: MadTestScreen): { title: string; body: string; onPageShow?: string } {
  switch (screen.kind) {
    case 'form': {
      const action = `/api/mad-testen?t=${encodeURIComponent(screen.token)}`
      return {
        title: 'Vil du teste Altid Mad?',
        onPageShow: RESET_BUTTONS,
        body: `<p class="hello">${greeting(screen.firstName)},</p>
<h1>Vil du teste Altid&nbsp;Mad før alle andre?</h1>
<p class="lead">Vi åbner for 300 testere. <strong>Testen foregår på iPhone</strong> gennem Apples gratis app TestFlight.</p>
<p class="note">Siger du ja, opretter vi en testkonto på din <span class="nw">e-mailadresse</span> og sender dig dit login på mail, så snart Apple har godkendt testversionen.</p>
<form method="POST" action="${escapeHtml(action)}" onsubmit="${ON_SUBMIT}">
  <button type="submit" name="device" value="iphone" class="primary">${ANSWER_LABEL.iphone}</button>
  <button type="submit" name="device" value="android" class="secondary">${ANSWER_LABEL.android}</button>
</form>
<p class="small"><a href="/privatlivspolitik">Sådan behandler vi dine data</a></p>`,
      }
    }
    case 'thanks':
      return answered(screen.device === 'iphone' ? 'Tak, du er med' : 'Tak for dit svar', screen.device)
    case 'already':
      return answered(screen.device === 'iphone' ? 'Vi har allerede dit ja' : 'Vi har allerede dit svar', screen.device)
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
h1{font-size:clamp(1.875rem,7.4vw,2.375rem);font-weight:400;line-height:1.18;letter-spacing:-0.02em;margin:0 0 20px;text-wrap:balance}
p{margin:0}
.hello{color:${COLOR.muted};margin-bottom:8px;overflow-wrap:anywhere}
.lead{margin-bottom:16px;text-wrap:pretty}
.lead strong{font-weight:500}
.note{font-size:15px;line-height:1.55;color:${COLOR.muted};margin-bottom:28px;text-wrap:pretty}
.small{font-size:15px}
.small a{display:inline-block;padding:10px 0}
.nw{white-space:nowrap}
a{color:${COLOR.forestDeep};text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1px}
a:focus-visible,button:focus-visible{outline:3px solid ${COLOR.forestDeep};outline-offset:3px;border-radius:4px}
form{display:flex;flex-direction:column;gap:12px;margin:0 0 20px}
button{display:block;width:100%;min-height:56px;padding:14px 24px;border-radius:999px;color:${COLOR.forestDeep};font:inherit;font-weight:500;line-height:1.3;cursor:pointer;transition:background-color .2s cubic-bezier(.25,1,.5,1),transform .2s cubic-bezier(.25,1,.5,1);-webkit-tap-highlight-color:transparent}
.primary{border:1.5px solid ${COLOR.khaki};background:${COLOR.khaki}}
.primary:hover{border-color:${COLOR.khakiPressed};background:${COLOR.khakiPressed}}
.secondary{border:1.5px solid ${COLOR.forestDeep};background:transparent}
.secondary:hover{background:rgba(22,50,35,.06)}
button:active{transform:scale(.98)}
button:focus-visible{border-radius:999px}
.mark{margin-bottom:24px}
.mark svg{display:block}
.mark path{stroke-dasharray:32;stroke-dashoffset:0;animation:draw .45s cubic-bezier(.25,1,.5,1) both}
@keyframes draw{from{stroke-dashoffset:32}to{stroke-dashoffset:0}}
.foot{border-top:1px solid rgba(22,50,35,.1)}
.foot-in{padding-top:20px;padding-bottom:28px;font-size:13px;color:${COLOR.muted}}
@media (min-width:600px){main{padding-top:72px;padding-bottom:80px}form{flex-direction:row;flex-wrap:wrap}button{width:auto;min-width:240px}}
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
