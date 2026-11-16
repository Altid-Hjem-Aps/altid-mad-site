// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import sitemap from '@/app/sitemap'
import nextConfig from '@/next.config'
import { config as proxyConfig, proxy } from '@/proxy'
import { POST as waitlistPost } from '@/app/api/waitlist/route'
import { MOVED, REDIRECT_CACHE_CONTROL, assertRetiredFlag, isRetired, keepsServing, retiredDestination } from '@/lib/retire'

// The retirement of altidmad.dk into www.altidhjem.dk (lib/retire.ts): one switch, SITE_RETIRED=1.
// Both states are pinned here, because "off" is how the site is put back.

const ORIGINAL_FLAG = process.env.SITE_RETIRED
afterEach(() => {
  if (ORIGINAL_FLAG === undefined) delete process.env.SITE_RETIRED
  else process.env.SITE_RETIRED = ORIGINAL_FLAG
})

const req = (path: string) => new NextRequest(`https://altidmad.dk${path}`)

// Every page in this site's sitemap and where it lives on altidhjem.dk. Each target exists there.
const EXPECTED: Record<string, string> = {
  '/': 'https://www.altidhjem.dk/',
  '/billigste-supermarked': 'https://www.altidhjem.dk/billigste-supermarked',
  '/madpakker-paa-budget': 'https://www.altidhjem.dk/madpakker-paa-budget',
  '/madbudget': 'https://www.altidhjem.dk/madbudget',
  '/beregn-dit-madbudget': 'https://www.altidhjem.dk/madbudget',
  '/madplan-efter-tilbud': 'https://www.altidhjem.dk/madplan-efter-tilbud',
  '/madbudget-familie-paa-4': 'https://www.altidhjem.dk/madbudget-familie-paa-4',
  '/mad-for-3000-om-maaneden': 'https://www.altidhjem.dk/mad-for-3000-om-maaneden',
  '/spar-penge-paa-dagligvarer': 'https://www.altidhjem.dk/spar-penge-paa-dagligvarer',
  '/graensehandel-beregner': 'https://www.altidhjem.dk/graensehandel-beregner',
  '/jul-paa-budget': 'https://www.altidhjem.dk/jul-paa-budget',
  '/kontakt': 'https://www.altidhjem.dk/kontakt',
  '/presse': 'https://www.altidhjem.dk/presse',
  '/privatlivspolitik': 'https://www.altidhjem.dk/privatlivspolitik',
  '/slet-konto': 'https://www.altidhjem.dk/slet-konto',
}

// Linked from mails already sent, from altidhjem.dk, or read by Google: served here as today.
const KEPT = [
  '/api/bekraeft',
  '/api/unsubscribe',
  '/api/mad-testen/open',
  '/api/mad-testen/survey',
  '/api/waitlist',
  '/bekraeft',
  '/_next/static/chunks/main.js',
  '/altid-mad-kvartalsrapport-q3.pdf',
  '/altid-mad-kvartalsrapport-q2.pdf',
  '/presse/altid-mad-pressefoto-1-tryk.jpg',
  '/press/ekstra-bladet.png',
  '/altid-hjem-logo-dark.svg',
  '/robots.txt',
  '/sitemap.xml',
]

describe('the switch', () => {
  it('is on only for exactly "1"', () => {
    expect(isRetired('1')).toBe(true)
    for (const v of [undefined, '', '0', 'true', 'yes', ' 1']) expect(isRetired(v)).toBe(false)
  })

  it('fails the build on any value that is neither on nor off', () => {
    for (const v of [undefined, '', '0', '1']) expect(() => assertRetiredFlag(v)).not.toThrow()
    for (const v of ['true', 'yes', ' 1', '1 ', 'on']) expect(() => assertRetiredFlag(v)).toThrow(/SITE_RETIRED/)
  })
})

describe('kept paths, as Next sees them', () => {
  it('keeps an encoded file name, which Next serves decoded', () => {
    expect(keepsServing('/robots%2Etxt')).toBe(true)
    expect(retiredDestination('/robots%2Etxt', '')).toBeNull()
  })

  it('keeps an encoded API path and a file with a trailing slash, as Next routes them', () => {
    expect(retiredDestination('/api%2Fbekraeft', '?t=x')).toBeNull()
    expect(retiredDestination('/robots.txt/', '')).toBeNull()
    expect(retiredDestination('/bekraeft/', '')).toBeNull()
  })

  it('keeps the bare /_next prefix', () => {
    expect(keepsServing('/_next')).toBe(true)
  })

  it('redirects a path that does not decode, like any page', () => {
    expect(keepsServing('/%E0%A4%A')).toBe(false)
    expect(retiredDestination('/%E0%A4%A', '')).toBe('https://www.altidhjem.dk/%E0%A4%A')
  })

  it('runs the proxy on every path but static chunks, images and files', () => {
    expect(proxyConfig.matcher).toEqual(['/((?!_next/static|_next/image|.*\\.[A-Za-z0-9]+$).*)'])
  })

  it('never runs the proxy on a file, but does on pages and kept page paths', async () => {
    // Next's own matcher, so the test matches what Next matches. It ships without types.
    const PATH_TO_REGEXP = 'next/dist/compiled/path-to-regexp'
    const { pathToRegexp } = (await import(/* @vite-ignore */ PATH_TO_REGEXP)) as { pathToRegexp: (source: string) => RegExp }
    const re = pathToRegexp(proxyConfig.matcher[0])
    for (const p of ['/robots.txt', '/presse/x-tryk.jpg', '/a.pdf', '/_next/static/x.js']) expect(re.test(p), p).toBe(false)
    for (const p of ['/', '/madbudget', '/kontakt/', '/api/waitlist', '/bekraeft']) expect(re.test(p), p).toBe(true)
  })
})

describe('retiredDestination', () => {
  it('covers every page in the sitemap, plus the merged page', () => {
    const paths = sitemap().map((e) => new URL(e.url).pathname)
    for (const p of paths) expect(Object.keys(EXPECTED)).toContain(p)
    for (const [from, to] of Object.entries(EXPECTED)) expect(retiredDestination(from, '')).toBe(to)
  })

  it('keeps the query string, so waitlist referral and campaign links keep their parameters', () => {
    expect(retiredDestination('/', '?ref=abc&utm_source=x')).toBe('https://www.altidhjem.dk/?ref=abc&utm_source=x')
    expect(retiredDestination('/inviter', '?ref=abc')).toBe('https://www.altidhjem.dk/inviter?ref=abc')
  })

  it('sends an unknown address to the same path, where altidhjem.dk answers with its real 404', () => {
    expect(retiredDestination('/findes-ikke', '')).toBe('https://www.altidhjem.dk/findes-ikke')
  })

  it('treats a trailing slash like the bare path', () => {
    expect(retiredDestination('/madbudget/', '')).toBe('https://www.altidhjem.dk/madbudget')
    expect(retiredDestination('/beregn-dit-madbudget/', '')).toBe('https://www.altidhjem.dk/madbudget')
  })

  it('never redirects what mails, altidhjem.dk and Google still need here', () => {
    for (const p of KEPT) {
      expect(keepsServing(p), p).toBe(true)
      expect(retiredDestination(p, ''), p).toBeNull()
    }
  })

  it('maps moved pages only to paths altidhjem.dk has', () => {
    expect(MOVED).toEqual({ '/beregn-dit-madbudget': '/madbudget', '/elpriser': '/hvornar-er-strommen-billigst' })
  })
})

describe('proxy', () => {
  it('lets every request through while the switch is off', () => {
    delete process.env.SITE_RETIRED
    for (const p of [...Object.keys(EXPECTED), ...KEPT]) {
      const res = proxy(req(p))
      expect(res.headers.get('location'), p).toBeNull()
      expect(res.headers.get('x-middleware-next'), p).toBe('1')
    }
  })

  it('answers every page with one 301 and a one-hour browser cache while on', () => {
    process.env.SITE_RETIRED = '1'
    for (const [from, to] of Object.entries(EXPECTED)) {
      const res = proxy(req(from))
      expect(res.status, from).toBe(301)
      expect(res.headers.get('location'), from).toBe(to)
      expect(res.headers.get('cache-control'), from).toBe(REDIRECT_CACHE_CONTROL)
    }
  })

  it('lets the kept paths through while on', () => {
    process.env.SITE_RETIRED = '1'
    for (const p of KEPT) expect(proxy(req(p)).headers.get('location'), p).toBeNull()
  })
})

describe('next.config redirects', () => {
  it('keeps its own rules while the switch is off', async () => {
    delete process.env.SITE_RETIRED
    const rules = await nextConfig.redirects!()
    expect(rules.some((r) => r.has?.some((h) => h.type === 'host' && h.value === 'www.altidmad.dk'))).toBe(true)
  })

  it('has none while on, so www.altidmad.dk is one hop too (config rules run before the proxy)', async () => {
    process.env.SITE_RETIRED = '1'
    expect(await nextConfig.redirects!()).toEqual([])
  })
})

// next.config and the /bekraeft metadata are read when their module loads, as on a deploy.
async function freshImport<T>(path: string, flag: string | undefined): Promise<T> {
  if (flag === undefined) delete process.env.SITE_RETIRED
  else process.env.SITE_RETIRED = flag
  vi.resetModules()
  return (await import(path)) as T
}

describe('next.config while retired', () => {
  it('lets the proxy see the path as requested (no trailing-slash hop, no URL normalising)', async () => {
    const on = (await freshImport<{ default: Record<string, unknown> }>('@/next.config', '1')).default
    expect(on.skipTrailingSlashRedirect).toBe(true)
    expect(on.skipProxyUrlNormalize).toBe(true)
    const off = (await freshImport<{ default: Record<string, unknown> }>('@/next.config', undefined)).default
    expect(off.skipTrailingSlashRedirect).toBeUndefined()
    expect(off.skipProxyUrlNormalize).toBeUndefined()
  })

  it('refuses to build with a mistyped switch', async () => {
    await expect(freshImport('@/next.config', 'true')).rejects.toThrow(/SITE_RETIRED/)
  })
})

describe('/bekraeft', () => {
  it('is noindex only while retired, so switching off restores the page exactly', async () => {
    const on = await freshImport<{ metadata: { robots?: unknown } }>('@/app/bekraeft/page', '1')
    expect(on.metadata.robots).toEqual({ index: false, follow: false })
    const off = await freshImport<{ metadata: { robots?: unknown } }>('@/app/bekraeft/page', undefined)
    expect(off.metadata.robots).toBeUndefined()
  })
})

describe('waitlist', () => {
  it('is closed (410) while on', async () => {
    process.env.SITE_RETIRED = '1'
    const res = await waitlistPost(
      new NextRequest('https://altidmad.dk/api/waitlist', { method: 'POST', body: JSON.stringify({ step: 1, email: 'a@b.dk' }) }),
    )
    expect(res.status).toBe(410)
  })
})

describe('moved pages, encoded', () => {
  it('finds the merged page also when its path came percent-encoded', () => {
    expect(retiredDestination('/beregn-dit-madbudge%74', '')).toBe('https://www.altidhjem.dk/madbudget')
  })
})
