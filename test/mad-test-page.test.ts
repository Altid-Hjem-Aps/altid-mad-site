import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  escapeHtml,
  isMadTestDevice,
  googleAccountPrefill,
  normalizeGoogleAccount,
  isMadTestEligible,
  isMadTestPage,
  renderMadTestScreen,
  androidSeatsLeft,
  withinAndroidSeats,
  MAD_TEST_ANDROID_PAGE_PLACES,
  MAD_TEST_ANDROID_PLACES,
  MAD_TEST_ANDROID_REFERRER_PLACES,
  MAD_TEST_ANDROID_TEAM_PLACES,
  MAD_TEST_ANDROID_TESTER_PLACES,
  MAD_TEST_PAGES,
  MAD_TEST_COPY_VERSION,
  type MadTestScreen,
} from '@/lib/mad-test'
import { bodyHandler, showPage } from './fake-browser'

const SCREENS: MadTestScreen[] = [
  { kind: 'form', firstName: 'Anna', token: 'tok', androidLeft: 90 },
  { kind: 'confirm', firstName: 'Anna', token: 'tok' },
  { kind: 'google', token: 'tok', value: 'anna@example.dk', retry: false, androidLeft: 90 },
  { kind: 'google', token: 'tok', value: 'anna', retry: true, androidLeft: 90 },
  { kind: 'thanks', device: 'iphone', firstName: 'Anna' },
  { kind: 'thanks', device: 'android', firstName: null },
  { kind: 'already', device: 'iphone' },
  { kind: 'already', device: 'android' },
  { kind: 'invalid' },
  { kind: 'error' },
  { kind: 'thanks-waitlist', firstName: 'Anna' },
  { kind: 'already-waitlist' },
]
// The screens that ask (and so report the open): the form, the iPhone route, the Google-account step.
const ASKING = SCREENS.slice(0, 4)

describe('isMadTestEligible', () => {
  const ok = { unsubscribed: false, consentMad: true, source: 'altid-mad' }

  it('admits both altidmad.dk forms with Mad consent', () => {
    expect(isMadTestEligible(ok)).toBe(true)
    expect(isMadTestEligible({ ...ok, source: 'altid-mad-exit' })).toBe(true)
  })

  it('refuses unsubscribed, no consent, Hjem-form and unknown sources', () => {
    expect(isMadTestEligible({ ...ok, unsubscribed: true })).toBe(false)
    expect(isMadTestEligible({ ...ok, consentMad: false })).toBe(false)
    expect(isMadTestEligible({ ...ok, source: 'altid-hjem' })).toBe(false)
    expect(isMadTestEligible({ ...ok, source: null })).toBe(false)
    expect(isMadTestEligible({ ...ok, source: 'ALTID-MAD' })).toBe(false)
  })
})

describe('isMadTestDevice', () => {
  it('accepts exactly iphone and android', () => {
    expect(isMadTestDevice('iphone')).toBe(true)
    expect(isMadTestDevice('android')).toBe(true)
    for (const v of ['IPHONE', 'ios', '', null, undefined, 1]) expect(isMadTestDevice(v)).toBe(false)
  })
})

describe('isMadTestPage', () => {
  it('accepts exactly optin and survey', () => {
    expect(MAD_TEST_PAGES).toEqual(['optin', 'survey'])
    expect(isMadTestPage('optin')).toBe(true)
    expect(isMadTestPage('survey')).toBe(true)
    for (const v of ['OPTIN', 'thanks', '', null, undefined, 1]) expect(isMadTestPage(v)).toBe(false)
  })
})

describe('Android places', () => {
  it('100 places in Google Play\'s internal test, 4 held by the team, so 96 for testers; 6 held back, so the page promises 90', () => {
    expect(MAD_TEST_ANDROID_PLACES).toBe(100)
    expect(MAD_TEST_ANDROID_TEAM_PLACES).toBe(4)
    expect(MAD_TEST_ANDROID_TESTER_PLACES).toBe(96)
    expect(MAD_TEST_ANDROID_REFERRER_PLACES).toBe(6)
    expect(MAD_TEST_ANDROID_PAGE_PLACES).toBe(90)
  })

  it.each([
    [0, 90],
    [1, 89],
    [88, 2],
    [89, 1],
    [90, 0],
    [91, 0],
    [96, 0],
    [500, 0],
  ])('%i Android answers leave %i places, never fewer than 0', (yesSoFar, left) => {
    expect(androidSeatsLeft(yesSoFar)).toBe(left)
  })

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('a count of %s is not a count: throws', (n) => {
    expect(() => androidSeatsLeft(n)).toThrow('androidSeatsLeft: not a count')
  })

  it('places 1 to 90 are promised, 91 and on (also the export\'s 91 to 96) are the waiting list on the page', () => {
    expect(withinAndroidSeats(1)).toBe(true)
    expect(withinAndroidSeats(90)).toBe(true)
    expect(withinAndroidSeats(91)).toBe(false)
    expect(withinAndroidSeats(96)).toBe(false)
    expect(withinAndroidSeats(97)).toBe(false)
    for (const n of [0, -3, 2.5, Number.NaN]) expect(() => withinAndroidSeats(n)).toThrow('withinAndroidSeats: not a place')
  })
})

describe('normalizeGoogleAccount', () => {
  it('trims and lower-cases one address', () => {
    expect(normalizeGoogleAccount('  Anna.Hansen@Gmail.COM ')).toBe('anna.hansen@gmail.com')
    expect(normalizeGoogleAccount('bo+test@firma.dk')).toBe('bo+test@firma.dk')
    expect(normalizeGoogleAccount('Ib_Ok-1%x@mail.firma-navn.co.uk')).toBe('ib_ok-1%x@mail.firma-navn.co.uk')
  })

  it('refuses anything that is not one address', () => {
    for (const v of ['', '  ', 'anna', 'anna@gmail', '@gmail.com', 'a b@gmail.com', 'a@gmail.com, b@gmail.com',
      '<b>@gmail.com', 'a"b@gmail.com', "a'b@gmail.com", 'a&b@gmail.com', 'anna@gmail.c', 'anna@-.dk.',
      `${'a'.repeat(250)}@gmail.com`, null, undefined, 1]) {
      expect(normalizeGoogleAccount(v)).toBeNull()
    }
  })
})

describe('googleAccountPrefill', () => {
  it('prefills Gmail addresses only, normalised', () => {
    expect(googleAccountPrefill(' Anna@Gmail.com ')).toBe('anna@gmail.com')
    expect(googleAccountPrefill('bo@googlemail.com')).toBe('bo@googlemail.com')
    // A plus tag is mail routing, not part of the Google account's name.
    expect(googleAccountPrefill('thor+madtest@gmail.com')).toBe('thor@gmail.com')
    expect(googleAccountPrefill('a.b+x+y@googlemail.com')).toBe('a.b@googlemail.com')
    for (const v of ['anna@hotmail.com', 'anna@live.dk', 'anna@firma.dk', 'anna@gmail.com.evil.dk', 'ikke en mail', '']) {
      expect(googleAccountPrefill(v)).toBe('')
    }
  })
})

describe('escapeHtml', () => {
  it('escapes all five HTML-significant characters', () => {
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe(
      '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;',
    )
  })
})

describe('renderMadTestScreen', () => {
  it.each(SCREENS)('$kind $device: Danish, Altid Mad header, no third-party request, no dashes as punctuation', (screen) => {
    const html = renderMadTestScreen(screen)

    expect(html).toContain('<html lang="da">')
    expect(html).toContain('src="/email/mad/altid-mad-logo-white.png" alt="Altid Mad"')
    expect(html).toContain('<meta name="referrer" content="no-referrer"/>')
    // The token rides in this page's URL; any absolute URL would be a request
    // (or a Referer) leaving our origin.
    expect(html).not.toMatch(/https?:\/\//)
    expect(html).not.toMatch(/[–—]/)
    expect(html).not.toContain('<script')
  })

  it.each([
    ['iphone', 'Du får en mail med dit login, så snart testversionen er klar i TestFlight.'],
    ['android', 'Du får en mail med dit login, så snart testversionen er klar i Google&nbsp;Play.'],
  ] as const)('thanks and already for %s: the name in the heading, the login mail, the support address', (device, next) => {
    const thanks = renderMadTestScreen({ kind: 'thanks', device, firstName: ' Anna ' })
    expect(thanks).toContain('<h1>Tak Anna, du er med</h1>')
    expect(renderMadTestScreen({ kind: 'thanks', device, firstName: null })).toContain('<h1>Tak, du er med</h1>')
    const marked = renderMadTestScreen({ kind: 'thanks', device, firstName: "<b> & O'Neill" })
    expect(marked).toContain('<h1>Tak &lt;b&gt; &amp; O&#39;Neill, du er med</h1>')
    // Escaped once in the <title> too, not twice.
    expect(marked).toContain('<title>Tak &lt;b&gt; &amp; O&#39;Neill, du er med | Altid Mad</title>')
    const already = renderMadTestScreen({ kind: 'already', device })
    expect(already).toContain('<h1>Vi har allerede dit ja</h1>')
    for (const html of [thanks, already]) {
      expect(html).toContain(`<p class="lead">${next}</p>`)
      expect(html).toContain('Har du spørgsmål, kan du skrive til <a href="mailto:hej@altidmad.dk">hej@altidmad.dk</a>.')
      expect(html.toLowerCase()).not.toContain('henvis')
    }
  })

  it('the Google-account step: one field prefilled, a hidden android answer, one button, the privacy link', () => {
    const html = renderMadTestScreen({ kind: 'google', token: 'tok', value: 'anna@example.dk', retry: false, androidLeft: 90 })
    expect(html).toContain('<h1>Hvilken Google-konto bruger du på din Android-telefon?</h1>')
    expect(html.match(/<form /g)).toHaveLength(1)
    expect(html.match(/<button/g)).toHaveLength(1)
    expect(html).toContain('<input type="hidden" name="device" value="android"/>')
    expect(html).toContain('<label for="ga">Google-konto</label>')
    expect(html).toMatch(/<input id="ga" type="email" name="google_account" value="anna@example.dk" autocomplete="email"[^>]* required\/>/)
    expect(html).toContain('href="/privatlivspolitik"')
    expect(html).toContain('<p class="lead">For at give dig adgang til testen skal vi bruge den Google-konto, du er logget ind med i Google&nbsp;Play på din Android-telefon.</p>')
    expect(html).toContain('<p class="lead">Det er ofte en Gmail-adresse.</p>')
    expect(html).toContain('Vi bruger kun din Google-konto til at give dig adgang til testen i Google&nbsp;Play.')
    expect(html).toContain('Dit login til Altid&nbsp;Mad er stadig den <span class="nw">e-mailadresse</span>, du skrev dig på ventelisten med.')
    expect(html).toContain('<button type="submit" class="primary" aria-live="polite" data-l="Fortsæt med Android">Fortsæt med Android</button>')
    // The button is switched off by script only (never in the markup), on load and on every keystroke.
    expect(html).not.toMatch(/<button[^>]* disabled/)
    expect(html).toContain('oninput="var i=document.getElementById(')
    expect(html.match(/b\.disabled=!\/\^\[a-z0-9\._%\+-\]\+@/g)).toHaveLength(2)
    expect(html).not.toContain('aria-invalid="true"')
  })

  it('the Google-account retry points the field at its error text', () => {
    const html = renderMadTestScreen({ kind: 'google', token: 'tok', value: 'anna', retry: true, androidLeft: 90 })
    expect(html).toContain('aria-invalid="true" aria-describedby="ga-err" autofocus')
    expect(html).toContain('<p id="ga-err" class="err">Det ligner ikke en e-mailadresse. Skriv hele adressen, fx navn@gmail.com.</p>')
  })

  it('the form offers exactly the two answers in one POST form, iPhone first', () => {
    const html = renderMadTestScreen(SCREENS[0])
    const buttons = [...html.matchAll(/<button type="submit" name="device" value="(\w+)" class="(\w+)" aria-live="polite" data-l="[^"]+">([^<]+)<\/button>/g)]
    expect(buttons.map((m) => [m[1], m[2], m[3]])).toEqual([
      ['iphone', 'primary', 'Jeg vil teste på iPhone'],
      ['android', 'secondary', 'Jeg vil teste på Android'],
    ])
    expect(html.match(/<form /g)).toHaveLength(1)
    expect(html).toContain('<p class="lead">Vælg, om du vil teste på iPhone eller Android.</p>')
    expect(html).toContain(
      'Vi opretter en testkonto på din <span class="nw">e-mailadresse</span> og sender dig dit personlige testlogin på mail.',
    )
    expect(html).not.toContain('Har du ikke en iPhone')
    // A disabled submitter drops its device value from the request.
    expect(html).not.toMatch(/<button[^>]* disabled/)
    expect(html).not.toContain('b.disabled=')
  })

  it('uses the Altid Mad template khaki, no mint left', () => {
    const html = renderMadTestScreen(SCREENS[0]) + renderMadTestScreen(SCREENS[1])
    expect(html).toContain('#DCD799')
    expect(html.toLowerCase()).not.toContain('#bfe6e0')
  })

  it('never splits the brand name in the form heading', () => {
    expect(renderMadTestScreen(SCREENS[0])).toContain('<h1>Hej Anna, vil du teste Altid&nbsp;Mad før alle andre?</h1>')
  })

  it('escapes the token in the form action', () => {
    const odd = `a"b'c<d>&e`
    const html = renderMadTestScreen({ kind: 'form', firstName: null, token: odd, androidLeft: 90 })

    expect(html).toContain(`action="/api/mad-testen?t=${encodeURIComponent(odd).replace(/'/g, '&#39;')}"`)
    expect(html).not.toContain('a"b')
  })

  it.each(ASKING)('$kind (retry $retry): the beacon is its own onload handler, apart from the form\'s onpageshow', (screen) => {
    const html = renderMadTestScreen(screen)
    const onload = bodyHandler(html, 'onload') ?? ''
    expect(onload).toBe(
      "if(!navigator.webdriver){if(navigator.sendBeacon){navigator.sendBeacon('/api/mad-testen/open?t=tok',new URLSearchParams('page=optin'))}}",
    )
    expect(bodyHandler(html, 'onpageshow')).not.toContain('sendBeacon')
    // Inline handlers in double-quoted attributes: no bare ampersand.
    expect(html.match(/<body[^>]*>/)?.[0]).not.toContain('&')
    // A handler, never a <script>, and nothing that waits for the answer.
    expect(html).not.toContain('<script')
    expect(onload).not.toContain('fetch(')
  })

  it.each(ASKING)('$kind (retry $retry): a real browser sends one beacon for page optin', (screen) => {
    const run = showPage(renderMadTestScreen(screen))
    expect(run.beacons).toEqual([{ url: '/api/mad-testen/open?t=tok', body: 'page=optin' }])
    expect(run.errors).toEqual([])
  })

  it.each(ASKING)('$kind (retry $retry): an automated browser (navigator.webdriver) sends no beacon', (screen) => {
    const run = showPage(renderMadTestScreen(screen), { webdriver: true })
    expect(run.beacons).toEqual([])
    expect(run.events).toEqual([])
    expect(run.errors).toEqual([])
  })

  it('the iPhone route in a real browser: the beacon first, then the form sends itself once', () => {
    expect(showPage(renderMadTestScreen(SCREENS[1])).events).toEqual([
      'beacon /api/mad-testen/open?t=tok page=optin',
      'submit Jeg vil teste på iPhone',
    ])
  })

  it.each(['missing', 'throws'] as const)('the iPhone route when sendBeacon is %s: no beacon, the form still sends itself', (mode) => {
    const run = showPage(renderMadTestScreen(SCREENS[1]), { sendBeacon: mode })
    expect(run.beacons).toEqual([])
    expect(run.events).toEqual(['submit Jeg vil teste på iPhone'])
    // The throwing beacon is reported in its own handler, nowhere else.
    expect(run.errors).toHaveLength(mode === 'throws' ? 1 : 0)
  })

  it.each(['ok', 'missing', 'throws'] as const)('the iPhone route in an automated browser (sendBeacon %s): no beacon, no answer', (mode) => {
    const run = showPage(renderMadTestScreen(SCREENS[1]), { webdriver: true, sendBeacon: mode })
    expect(run.events).toEqual([])
    expect(run.errors).toEqual([])
  })

  it.each(ASKING.flatMap((screen) => (['ok', 'missing', 'throws'] as const).map((mode) => ({ ...screen, mode }))))(
    '$kind (retry $retry), sendBeacon $mode, back/forward restore: no beacon, no answer, the buttons are back',
    ({ mode, ...screen }) => {
      const run = showPage(renderMadTestScreen(screen as MadTestScreen), { sendBeacon: mode, restore: true })
      expect(run.events).toEqual([])
      expect(run.errors).toEqual([])
      expect(run.form?.dataset.sent).toBeUndefined()
      expect(run.buttons.length).toBeGreaterThan(0)
      for (const b of run.buttons) expect(b.textContent).toBe(b.dataset.l)
    },
  )

  it.each(['missing', 'throws'] as const)('the Google-account step when sendBeacon is %s: its own handler still checks the field', (mode) => {
    const empty = showPage(renderMadTestScreen({ kind: 'google', token: 'tok', value: '', retry: false, androidLeft: 90 }), { sendBeacon: mode })
    expect(empty.buttons.map((b) => b.disabled)).toEqual([true])
    const filled = showPage(renderMadTestScreen(SCREENS[2]), { sendBeacon: mode })
    expect(filled.buttons.map((b) => b.disabled)).toEqual([false])
  })

  it.each(SCREENS.filter((s) => !ASKING.includes(s)))(
    '$kind $device: no open reported (an answer or a refusal, not an asking screen)',
    (screen) => {
      const html = renderMadTestScreen(screen)
      expect(html).not.toContain('sendBeacon')
      expect(bodyHandler(html, 'onload')).toBeNull()
      expect(showPage(html).beacons).toEqual([])
    },
  )

  it('the token in the beacon cannot leave its string or the attribute', () => {
    const odd = `a"b'c<d>&e`
    const screens: MadTestScreen[] = [
      { kind: 'form', firstName: null, token: odd, androidLeft: 90 },
      { kind: 'confirm', firstName: null, token: odd },
    ]
    for (const screen of screens) {
      const html = renderMadTestScreen(screen)
      expect(html).toContain(`onload="if(!navigator.webdriver){if(navigator.sendBeacon){navigator.sendBeacon('/api/mad-testen/open?t=a%22b%27c%3Cd%3E%26e',`)
      expect(html.match(/<body[^>]*>/)?.[0]).not.toContain('&')
      expect(showPage(html).beacons).toEqual([{ url: '/api/mad-testen/open?t=a%22b%27c%3Cd%3E%26e', body: 'page=optin' }])
    }
  })

  const LEFT = (n: number) => `<p class="note">Der er ${n} af 100 pladser tilbage til Android.</p>`
  const FULL =
    '<p class="note">Alle 100 Android-pladser er taget lige nu. Du kan stadig skrive dig op, så kommer du på ventelisten til Android og får besked, hvis der bliver en plads.</p>'

  it.each([90, 2, 1])('the form with %i places left: the counter right under the buttons', (left) => {
    const html = renderMadTestScreen({ kind: 'form', firstName: 'Anna', token: 'tok', androidLeft: left })
    expect(html).toContain(`</form>\n${LEFT(left)}\n<p class="small"><a href="/privatlivspolitik">`)
    expect(html).not.toContain('Alle 100 Android-pladser')
  })

  it('the counter counts out of 100 with the team\'s 4 and the 6 held back taken: never more than 90 of 100, never negative', () => {
    const shown: number[] = []
    for (let yesSoFar = 0; yesSoFar <= 300; yesSoFar++) {
      for (const html of [
        renderMadTestScreen({ kind: 'form', firstName: null, token: 'tok', androidLeft: androidSeatsLeft(yesSoFar) }),
        renderMadTestScreen({ kind: 'google', token: 'tok', value: '', retry: false, androidLeft: androidSeatsLeft(yesSoFar) }),
      ]) {
        const n = html.match(/Der er (-?\d+) af (\d+) pladser tilbage til Android\./)
        if (yesSoFar < 90) {
          expect(n?.[2]).toBe('100')
          shown.push(Number(n?.[1]))
          expect(html).not.toContain('Android-pladser er taget')
        } else {
          expect(n).toBeNull()
          expect(html).toContain(FULL)
        }
        expect(html).not.toMatch(/af (90|96)\b/)
      }
    }
    expect(Math.max(...shown)).toBe(90)
    expect(Math.min(...shown)).toBe(1)
    expect(shown.every((n) => n >= 1 && n <= 90)).toBe(true)
    // The start, and the start with Thor's own test row.
    expect(androidSeatsLeft(0)).toBe(90)
    expect(androidSeatsLeft(1)).toBe(89)
  })

  it('the form with no place left: says all places are taken and how the waiting list works', () => {
    const html = renderMadTestScreen({ kind: 'form', firstName: 'Anna', token: 'tok', androidLeft: 0 })
    expect(html).toContain(`</form>\n${FULL}\n<p class="small">`)
    expect(html).not.toContain('Der er')
    expect(html.match(/<button/g)).toHaveLength(2)
  })

  it.each([
    [90, false],
    [1, true],
    [0, false],
    [0, true],
  ])('the Google-account step with %i places left (retry %s): the counter under the button', (left, retry) => {
    const html = renderMadTestScreen({ kind: 'google', token: 'tok', value: 'anna', retry, androidLeft: left })
    expect(html).toContain(`</button>\n</form>\n${left === 0 ? FULL : LEFT(left)}\n<p class="note pair">`)
    expect(html.match(/<button/g)).toHaveLength(1)
  })

  it.each([-1, 91, 96, 97, 1.5])('a number of places left that was not counted (%s) is never printed: throws', (left) => {
    expect(() => renderMadTestScreen({ kind: 'form', firstName: null, token: 'tok', androidLeft: left })).toThrow(
      'androidSeats: not a number of places left',
    )
    expect(() => renderMadTestScreen({ kind: 'google', token: 'tok', value: '', retry: false, androidLeft: left })).toThrow(
      'androidSeats: not a number of places left',
    )
  })

  it('the waiting-list thanks: the name in the heading like the thanks, the waiting-list line, no place number', () => {
    const html = renderMadTestScreen({ kind: 'thanks-waitlist', firstName: ' Anna ' })
    expect(html).toContain('<h1>Tak Anna, du står på ventelisten til Android</h1>')
    expect(html).toContain('<p class="lead">Alle Android-pladser er taget lige nu. Vi skriver til dig, hvis der bliver en plads.</p>')
    expect(html).toContain('Har du spørgsmål, kan du skrive til <a href="mailto:hej@altidmad.dk">hej@altidmad.dk</a>.')
    expect(html).not.toContain('Du får en mail med dit login')
    expect(renderMadTestScreen({ kind: 'thanks-waitlist', firstName: null })).toContain(
      '<h1>Tak, du står på ventelisten til Android</h1>',
    )
    const marked = renderMadTestScreen({ kind: 'thanks-waitlist', firstName: "<b> & O'Neill" })
    expect(marked).toContain('<h1>Tak &lt;b&gt; &amp; O&#39;Neill, du står på ventelisten til Android</h1>')
    expect(marked).toContain('<title>Tak &lt;b&gt; &amp; O&#39;Neill, du står på ventelisten til Android | Altid Mad</title>')
  })

  it('the waiting-list already screen: "Vi har allerede dit ja" and the waiting-list line', () => {
    const html = renderMadTestScreen({ kind: 'already-waitlist' })
    expect(html).toContain('<h1>Vi har allerede dit ja</h1>\n<p class="lead">Alle Android-pladser er taget lige nu. Vi skriver til dig, hvis der bliver en plads.</p>')
    expect(html).not.toContain('<form')
  })

  // sha256 of each screen as origin/main rendered it before the Android places
  // (5c79c02, 2/10): the iPhone screens and an Android answer within the
  // places must not change by one byte.
  it.each([
    [{ kind: 'confirm', firstName: 'Anna', token: 'tok' }, 'df3209f1535c662f8927e2033810f1dbae1fbaa2a057632f507f5f6a16b8575e'],
    [
      { kind: 'confirm', firstName: null, token: '9b2f7c4e-1d3a-4e5b-8c6d-0a1b2c3d4e5f' },
      'b8563602a9b89aea46859e0e41f4e13b967118e1793977201545f590fba22b9c',
    ],
    [{ kind: 'thanks', device: 'iphone', firstName: 'Anna' }, '4769ebbef19298d5bbdcbd189580215570380dfa91b5942159088cfeaf85423a'],
    [{ kind: 'thanks', device: 'iphone', firstName: null }, 'd3e66786f6e2e30754ac1134fe8170ead2f22fed9cda606b787e80583c0c8582'],
    [{ kind: 'already', device: 'iphone' }, '53c200a82271e8cb17847a0668ccf95112dbbda96b447e5a7941fb7502d926a6'],
    [{ kind: 'thanks', device: 'android', firstName: 'Anna' }, '3a7cbe1178d28eda145d33e800d50c97a7e989b11cb46574cc12b8c79f73d320'],
    [{ kind: 'thanks', device: 'android', firstName: null }, '3dda9bb210d1538e25f1a20dccc79843ecb38b3e640328d3f77fa8b7e4d41349'],
    [{ kind: 'already', device: 'android' }, 'e1ac321227e0032118fe4b4f6c9152f0f6e34a689ab56d53f0823720f87483a6'],
  ] as Array<[MadTestScreen, string]>)('unchanged byte for byte: %o', (screen, sha256) => {
    expect(createHash('sha256').update(renderMadTestScreen(screen)).digest('hex')).toBe(sha256)
  })

  it('the wording version names today and the test', () => {
    expect(MAD_TEST_COPY_VERSION).toBe('2026-10-02-mad-test-8')
  })

  it('the self-hosted font file the pages point at exists', () => {
    const font = path.resolve(__dirname, '../public/fonts/onest-latin.woff2')
    expect(readFileSync(font).subarray(0, 4).toString('latin1')).toBe('wOF2')
  })
})
