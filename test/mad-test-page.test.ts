import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  escapeHtml,
  isMadTestDevice,
  isMadTestEligible,
  renderMadTestScreen,
  MAD_TEST_COPY_VERSION,
  type MadTestScreen,
} from '@/lib/mad-test'

const SCREENS: MadTestScreen[] = [
  { kind: 'form', firstName: 'Anna', token: 'tok' },
  { kind: 'thanks', device: 'iphone' },
  { kind: 'thanks', device: 'android' },
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
    ['thanks', 'iphone', 'Tak, du er med'],
    ['already', 'iphone', 'Vi har allerede dit ja'],
  ] as const)('%s iphone: promises the login mail, mentions no referrers', (kind, device, heading) => {
    const html = renderMadTestScreen({ kind, device })
    expect(html).toContain(`<h1>${heading}</h1>`)
    expect(html).toContain('<p class="lead">Du får en mail med dit login, så snart Apple har godkendt testversionen.</p>')
    expect(html).toContain('Har du spørgsmål, så skriv til <a href="mailto:hej@altidmad.dk">hej@altidmad.dk</a>.')
    expect(html.toLowerCase()).not.toContain('henvis')
  })

  it.each([
    ['thanks', 'android', 'Tak for dit svar'],
    ['already', 'android', 'Vi har allerede dit svar'],
  ] as const)('%s android: iPhone only, still on the waitlist, no login promise', (kind, device, heading) => {
    const html = renderMadTestScreen({ kind, device })
    expect(html).toContain(`<h1>${heading}</h1>`)
    expect(html).toContain(
      '<p class="lead">Testen kører kun på iPhone, så du er ikke med denne gang. Du står stadig på ventelisten til Altid&nbsp;Mad.</p>',
    )
    expect(html.toLowerCase()).not.toContain('login')
    expect(html.toLowerCase()).not.toContain('henvis')
  })

  it('the form offers exactly the two answers in one POST form, iPhone first', () => {
    const html = renderMadTestScreen(SCREENS[0])
    const buttons = [...html.matchAll(/<button type="submit" name="device" value="(\w+)" class="(\w+)">([^<]+)<\/button>/g)]
    expect(buttons.map((m) => [m[1], m[2], m[3]])).toEqual([
      ['iphone', 'primary', 'Ja, jeg har en iPhone'],
      ['android', 'secondary', 'Ja, men jeg har Android'],
    ])
    expect(html.match(/<form /g)).toHaveLength(1)
    expect(html).toContain(
      'Siger du ja, opretter vi en testkonto på din <span class="nw">e-mailadresse</span> og sender dig dit login på mail, så snart Apple har godkendt testversionen.',
    )
    expect(html).not.toContain('Har du ikke en iPhone')
    // A disabled submitter drops its device value from the request.
    expect(html).not.toContain('disabled')
  })

  it('uses the Altid Mad template khaki, no mint left', () => {
    const html = renderMadTestScreen(SCREENS[0]) + renderMadTestScreen(SCREENS[1])
    expect(html).toContain('#DCD799')
    expect(html.toLowerCase()).not.toContain('#bfe6e0')
  })

  it('never splits the brand name in the form heading', () => {
    expect(renderMadTestScreen(SCREENS[0])).toContain('<h1>Vil du teste Altid&nbsp;Mad før alle andre?</h1>')
  })

  it('escapes the token in the form action', () => {
    const odd = `a"b'c<d>&e`
    const html = renderMadTestScreen({ kind: 'form', firstName: null, token: odd })

    expect(html).toContain(`action="/api/mad-testen?t=${encodeURIComponent(odd).replace(/'/g, '&#39;')}"`)
    expect(html).not.toContain('a"b')
  })

  it('the wording version names today and the test', () => {
    expect(MAD_TEST_COPY_VERSION).toBe('2026-09-25-mad-test-2')
  })

  it('the self-hosted font file the pages point at exists', () => {
    const font = path.resolve(__dirname, '../public/fonts/onest-latin.woff2')
    expect(readFileSync(font).subarray(0, 4).toString('latin1')).toBe('wOF2')
  })
})
