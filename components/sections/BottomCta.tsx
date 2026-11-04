import NewsletterForm from '@/components/NewsletterForm'
import StoreBadges from '@/components/StoreBadges'
import { H2, EYEBROW, BODY } from '@/lib/typography'

interface BottomCtaProps {
  /** Small line above the heading: the front page uses the default text. */
  eyebrow?: string
  /** Subtitle under the heading: the front page uses the default text. */
  subtitle?: string
}

// The end of every page: the store pills first, the quieter newsletter signup
// under them. The SEO pages wrap this in the #hent-appen anchor; the front page
// has that anchor on the hero's badges.
export default function BottomCta({
  eyebrow = 'Klar til at komme i gang?',
  subtitle = 'Altid Mad finder du i appen Altid Hjem. Du henter den i App Store og Google Play.',
}: BottomCtaProps) {
  return (
    <section className="relative" style={{ background: '#163223' }}>
      {/* The app badge sits ON the seam to the section above. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/app-badge.png"
        alt=""
        aria-hidden
        className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 z-10"
        style={{ width: 'clamp(68px,5.5vw,105px)', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.3))' }}
      />
      <div className="max-w-[640px] mx-auto px-6 sm:px-10 py-[clamp(72px,7vw,130px)] text-center">
        <p className={`${EYEBROW} mb-5`} style={{ color: '#90ff7c' }}>
          {eyebrow}
        </p>
        <h2 className={`${H2} text-white mb-6 mx-auto text-balance`}>Hent appen Altid Hjem</h2>
        <p className={`${BODY} mx-auto text-balance`} style={{ color: '#fff', maxWidth: 480 }}>
          {subtitle}
        </p>
        <StoreBadges position="bottom" variant="dark" className="mt-8 justify-center" />

        <div className="mt-12 pt-10 mx-auto max-w-[520px] text-left" style={{ borderTop: '1px solid rgba(255,255,255,0.14)' }}>
          <NewsletterForm />
        </div>
      </div>
    </section>
  )
}
