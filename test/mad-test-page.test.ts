import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  escapeHtml,
  isMadTestDevice,
  googleAccountPrefill,
  normalizeGoogleAccount,
  isMadTestEligible,
  renderMadTestScreen,
  MAD_TEST_COPY_VERSION,
  type MadTestScreen,
} from '@/lib/mad-test'

const SCREENS: MadTestScreen[] = [
  { kind: 'form', firstName: 'Anna', token: 'tok' },
  { kind: 'confirm', firstName: 'Anna', token: 'tok' },
  { kind: 'google', token: 'tok', value: 'anna@example.dk', retry: false },
  { kind: 'google', token: 'tok', value: 'anna', retry: true },
  { kind: 'thanks', device: 'iphone', firstName: 'Anna' },
  { kind: 'thanks', device: 'android', firstName: null },
  { kind: 'already', device: 'iphone' },
  { kind: 'already', device: 'android' },
  { kind: 'invalid' },
  { kind: 'error' },
]

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
    const html = renderMadTestScreen({ kind: 'google', token: 'tok', value: 'anna@example.dk', retry: false })
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
    const html = renderMadTestScreen({ kind: 'google', token: 'tok', value: 'anna', retry: true })
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
    const html = renderMadTestScreen({ kind: 'form', firstName: null, token: odd })

    expect(html).toContain(`action="/api/mad-testen?t=${encodeURIComponent(odd).replace(/'/g, '&#39;')}"`)
    expect(html).not.toContain('a"b')
  })

  it('the wording version names today and the test', () => {
    expect(MAD_TEST_COPY_VERSION).toBe('2026-10-01-mad-test-6')
  })

  it('the self-hosted font file the pages point at exists', () => {
    const font = path.resolve(__dirname, '../public/fonts/onest-latin.woff2')
    expect(readFileSync(font).subarray(0, 4).toString('latin1')).toBe('wOF2')
  })
})
