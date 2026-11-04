import type { Metadata } from 'next'
import { Onest, Afacad, DM_Sans } from 'next/font/google'
import './globals.css'
import ResetScrollOnLoad from '@/components/ResetScrollOnLoad'
import CookieBanner from '@/components/CookieBanner'

const onest = Onest({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-onest',
})

// Afacad is the brand font for the subbrand wordmarks ("energi", "mobil", …)
// in the service-card logo lockups.
const afacad = Afacad({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-afacad',
})

// The app's own font, for the data cards on the guide pages (seo/mockupKit). Not
// preloaded: most pages have no such card, and a browser fetches it only when used.
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  preload: false,
})

export const metadata: Metadata = {
  // Domain not final — altidmad.dk is the working assumption until Thor
  // confirms DNS ownership; swap here + robots/sitemap when decided.
  metadataBase: new URL('https://altidmad.dk'),
  alternates: { canonical: './' },
  title: 'Altid Mad: madplan og indkøbsliste i Altid Hjem-appen',
  description: 'Hent Altid Hjem, og få ugens madplan og en indkøbsliste, der viser, hvor varerne er billigst.',
  openGraph: {
    title: 'Altid Mad: madplan og indkøbsliste i Altid Hjem-appen',
    description: 'Hent Altid Hjem, og få ugens madplan og en indkøbsliste, der viser, hvor varerne er billigst.',
    url: 'https://altidmad.dk',
    siteName: 'Altid Mad',
    locale: 'da_DK',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: { url: '/icon.svg', type: 'image/svg+xml' },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-scroll-behavior: opt-in so Next keeps smooth scrolling for anchor
    // jumps but disables it during route transitions (silences the Next 15+
    // console warning).
    <html lang="da" data-scroll-behavior="smooth" className={`${onest.variable} ${afacad.variable} ${dmSans.variable}`}>
      <body>
        <ResetScrollOnLoad />
        {children}
        <CookieBanner />
      </body>
    </html>
  )
}
