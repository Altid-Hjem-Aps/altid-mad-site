import type { Metadata } from 'next'
import { Onest, Afacad } from 'next/font/google'
import './globals.css'
import ResetScrollOnLoad from '@/components/ResetScrollOnLoad'
import ExitIntentModal from '@/components/ExitIntentModal'

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

export const metadata: Metadata = {
  // Domain not final — altidmad.dk is the working assumption until Thor
  // confirms DNS ownership; swap here + robots/sitemap when decided.
  metadataBase: new URL('https://altidmad.dk'),
  alternates: { canonical: './' },
  title: 'Altid Mad – Skriv dig på ventelisten',
  description: 'Altid Mad samler automatisk din madplan, finder de bedste tilbud og genererer indkøbslisten – så familien sparer penge på dagligvarer. Altid.',
  openGraph: {
    title: 'Altid Mad – Skriv dig på ventelisten',
    description: 'Altid Mad samler automatisk din madplan, finder de bedste tilbud og genererer indkøbslisten – så familien sparer penge på dagligvarer. Altid.',
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
    <html lang="da" data-scroll-behavior="smooth" className={`${onest.variable} ${afacad.variable}`}>
      <body>
        <ResetScrollOnLoad />
        {children}
        <ExitIntentModal />
      </body>
    </html>
  )
}
