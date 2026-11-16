import { NextResponse, type NextRequest } from 'next/server'
import { REDIRECT_CACHE_CONTROL, isRetired, retiredDestination } from '@/lib/retire'

// While SITE_RETIRED=1, every page answers with one 301 to www.altidhjem.dk (lib/retire.ts says
// what keeps being served and why). Here and not in next.config redirects: Next drops extra
// headers on config redirects, and the short browser cache is what makes a reversal quick.
export function proxy(req: NextRequest) {
  if (!isRetired()) return NextResponse.next()
  const destination = retiredDestination(req.nextUrl.pathname, req.nextUrl.search)
  if (!destination) return NextResponse.next()
  return NextResponse.redirect(destination, { status: 301, headers: { 'Cache-Control': REDIRECT_CACHE_CONTROL } })
}

export const config = {
  // Files (anything with an extension) never reach the proxy: they are always served here, and a
  // mail opening its images should not cost a function call. Encoded names (/file%2Epdf) still do,
  // and lib/retire.ts keeps them.
  matcher: ['/((?!_next/static|_next/image|.*\\.[A-Za-z0-9]+$).*)'],
}
