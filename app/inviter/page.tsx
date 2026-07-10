import type { Metadata } from 'next'
import InviterShare from '@/components/InviterShare'

export const metadata: Metadata = {
  title: 'Inviter venner – Altid Mad',
  description: 'Del dit personlige link og ryk frem i køen til Altid Mad.',
  openGraph: {
    title: 'Kom med på Altid Mad',
    description: 'Bedre råd til mad. Tilmeld dig ventelisten med mit link.',
    url: 'https://altidmad.dk/inviter',
    siteName: 'Altid Mad',
    type: 'website',
  },
}

// The six category icons already live in the repo for the email templates —
// same lockup as the welcome mail's header.
const CATEGORY_ICONS: [string, string][] = [
  ['icon-strom', 'Energi'],
  ['icon-mad', 'Mad'],
  ['icon-forsikring', 'Forsikring'],
  ['icon-alarm', 'Alarm'],
  ['icon-mobil', 'Mobil'],
  ['icon-opladning', 'Opladning'],
]

export default async function InviterPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const { ref } = await searchParams
  return (
    <main
      style={{
        background: '#fdfaf4',
        minHeight: '100vh',
        fontFamily: 'var(--font-onest), "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* Header — matches the email templates: dark-green bar + white Mad logo */}
      <header style={{ background: '#163223' }}>
        <div className="mx-auto flex max-w-xl items-center justify-between px-6 py-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/email/mad/altid-mad-logo-white.png"
            alt="Altid Mad"
            width={88}
            height={47}
            style={{ display: 'block' }}
          />
          <div className="hidden items-center gap-1.5 sm:flex">
            {CATEGORY_ICONS.map(([file, alt]) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={file}
                src={`/email/mad/${file}.svg`}
                alt={alt}
                width={34}
                height={34}
                style={{ display: 'inline-block' }}
              />
            ))}
          </div>
        </div>
      </header>

      <div className="px-6 py-12 sm:py-16">
        <InviterShare code={ref ?? ''} />
      </div>
    </main>
  )
}
