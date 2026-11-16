// Retiring altidmad.dk into altidhjem.dk (16 Nov 2026). Every page moved to www.altidhjem.dk at
// the same path, so search rankings carry over; the switch is one environment variable so the
// site can be put back exactly as it was.
//
//   SITE_RETIRED=1  →  proxy.ts answers every page with a 301 to www.altidhjem.dk
//   unset           →  the site runs as before (reversal: unset it in Vercel and redeploy)
//
// A reversal only restores this site. The same articles also live on www.altidhjem.dk with
// their own canonicals (landing-page PR 157), so a real reversal also reverts those pages there,
// or Google sees the same text on two domains.
//
// What keeps being served while retired, because mails already sent and other sites depend on it:
//   /api/*      confirmation (/api/bekraeft), unsubscribe, mad-testen beacons
//   /bekraeft   the confirmation page reads a cookie set on this domain's /bekraeft path
//   /_next/*    the scripts and fonts /bekraeft needs
//   files       anything with an extension: the quarterly report PDFs (altidhjem.dk/madrapport
//               points at the Q3 one), the press photos altidhjem.dk/presse links, robots.txt
//               and sitemap.xml (Google keeps crawling the old addresses and sees the 301s)
//
// Old addresses not in MOVED go to the same path on altidhjem.dk, which has a page for every one
// of them; anything else gets altidhjem.dk's real 404 instead of a soft 404 on the front page.

export const RETIRED_ORIGIN = 'https://www.altidhjem.dk'

/** Browsers remember the 301 for an hour only, so a reversal reaches people quickly. Google
 * reads the status, not this header. */
export const REDIRECT_CACHE_CONTROL = 'public, max-age=3600'

/** Where the pages this site still serves (/bekraeft, kept API pages) send people "home" while
 * retired: straight to altidhjem.dk, named as such, since this domain's own front page redirects. */
/** The expired-link text on /bekraeft while retired: the old text told people to sign up again,
 * and the waitlist is closed. */
export const RETIRED_EXPIRED_BODY =
  'Linket kan være udløbet. Ventelisten er lukket, men du kan hente Altid Hjem-appen gratis i App Store og Google Play.'

export const RETIRED_HOME = { href: `${RETIRED_ORIGIN}/`, label: 'Gå til altidhjem.dk' } as const

/** Old paths whose page lives under another path on altidhjem.dk. */
export const MOVED: Readonly<Record<string, string>> = {
  // Merged into /madbudget: same search ("madbudget") and the same figures.
  '/beregn-dit-madbudget': '/madbudget',
  // An old rule from this repo's next.config, which pointed at a page this site never had.
  '/elpriser': '/hvornar-er-strommen-billigst',
}

export function isRetired(flag: string | undefined = process.env.SITE_RETIRED): boolean {
  return flag === '1'
}

/** Fails the build on a value that is neither on nor off ("true", "yes", "1 "), so a typo in
 * Vercel can never leave the site silently unretired. Called from next.config. */
export function assertRetiredFlag(flag: string | undefined = process.env.SITE_RETIRED): void {
  if (flag === undefined || flag === '' || flag === '0' || flag === '1') return
  throw new Error(`SITE_RETIRED must be "1" (retired) or "0"/unset (live), got ${JSON.stringify(flag)}`)
}

export function keepsServing(pathname: string): boolean {
  // Classify the path as Next will route it: decoded (/api%2Fbekraeft is /api/bekraeft,
  // /file%2Epdf is /file.pdf) and without a trailing slash (/file.pdf/ is /file.pdf). A path
  // that does not decode is nothing Next could serve; it is redirected like any other page.
  let decoded: string
  try {
    decoded = decodeURIComponent(pathname)
  } catch (e) {
    if (e instanceof URIError) return false
    throw e
  }
  const path = decoded.length > 1 ? decoded.replace(/\/+$/, '') : decoded
  if (path === '/api' || path.startsWith('/api/')) return true
  if (path === '/bekraeft' || path.startsWith('/bekraeft/')) return true
  if (path === '/_next' || path.startsWith('/_next/')) return true
  const last = path.slice(path.lastIndexOf('/') + 1)
  return /\.[a-z0-9]+$/i.test(last)
}

/** The 301 target for a page while retired, or null when the path keeps being served here. */
export function retiredDestination(pathname: string, search: string): string | null {
  if (keepsServing(pathname)) return null
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') || '/' : '/'
  return `${RETIRED_ORIGIN}${MOVED[decodedOrSelf(path)] ?? path}${search}`
}

/** A moved page is found also when its path came percent-encoded. */
function decodedOrSelf(path: string): string {
  try {
    return decodeURIComponent(path)
  } catch (e) {
    if (e instanceof URIError) return path
    throw e
  }
}
