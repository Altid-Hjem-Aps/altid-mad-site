import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { FINE_PRINT } from '@/lib/typography'

const SEP = ' · '

const footerLinks = [
  { href: '/kontakt', label: 'Support' },
  { href: '/privatlivspolitik', label: 'Privatlivspolitik' },
]

// Official profiles (LinkedIn from the published Resend template, Instagram
// verified @altidhjem, Facebook page id from Thor).
const socialLinks = [
  { href: 'https://www.linkedin.com/company/altid-hjem/', label: 'LinkedIn' },
  { href: 'https://www.instagram.com/altidhjem/', label: 'Instagram' },
  { href: 'https://www.facebook.com/profile.php?id=61590767814024', label: 'Facebook' },
]

// The six subbrand icons shown as a row next to the logo, like the Figma footer.
const SUBBRAND_ICONS = [
  '/services/icon-strom.svg',
  '/services/icon-mad.svg',
  '/services/icon-forsikring.svg',
  '/services/icon-alarm.svg',
  '/services/icon-mobil.svg',
  '/services/icon-opladning.svg',
]

const linkStyle: React.CSSProperties = { color: 'rgba(255,255,255,0.85)' }

const InternalLink = ({ href, label }: { href: string; label: string }) => (
  <Link href={href} className="underline-offset-2 hover:underline" style={linkStyle}>
    {label}
  </Link>
)

const SocialLink = ({ href, label }: { href: string; label: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline" style={linkStyle}>
    {label}
  </a>
)

const Copyright = () => (
  <>
    © 2026 Altid Mad · En del af{' '}
    {/* Always underlined — colour alone can't distinguish the link from the
        surrounding copyright text (Lighthouse link-in-text-block). */}
    <a
      href="https://www.altidhjem.dk"
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2"
      style={linkStyle}
    >
      Altid Hjem
    </a>
  </>
)

export default function Footer() {
  return (
    <footer
      className="flex flex-wrap items-center justify-between gap-y-4 gap-x-8 px-6 sm:px-10 lg:px-[clamp(48px,3.7vw,72px)] py-6 sm:py-7"
      style={{ background: '#163223', borderTop: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Left — wordmark + subbrand icon row (sized to the Figma footer).
          On phones the row spans the full width (logo left, icons right) and
          everything shrinks so all six icons fit without cropping. */}
      <div className="flex items-center gap-8 max-lg:w-full max-lg:justify-between max-lg:gap-4">
        <Logo className="h-9 sm:h-12 w-auto shrink-0" variant="forest" />
        <div className="flex items-center gap-2 sm:gap-5" aria-hidden>
          {SUBBRAND_ICONS.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="" className="w-7 h-7 sm:w-10 sm:h-10 rounded-full" />
          ))}
        </div>
      </div>

      {/* Right — one inline run on desktop; three fixed, centred lines on
          phones (socials / legal / ©). The two layouts group the links
          differently, so each breakpoint renders its own block. */}
      <p className={`${FINE_PRINT} hidden lg:block`} style={{ color: 'rgba(255,255,255,0.6)' }}>
        <Copyright />
        {SEP}
        {footerLinks.map(({ href, label }, i) => (
          <span key={href}>
            {i > 0 && SEP}
            <InternalLink href={href} label={label} />
          </span>
        ))}
        {socialLinks.map(({ href, label }) => (
          <span key={href}>
            {SEP}
            <SocialLink href={href} label={label} />
          </span>
        ))}
        {SEP}
        <InternalLink href="/slet-konto" label="Slet konto" />
      </p>

      <p className={`${FINE_PRINT} lg:hidden flex flex-col gap-1.5 w-full text-center`} style={{ color: 'rgba(255,255,255,0.6)' }}>
        <span>
          {socialLinks.map(({ href, label }, i) => (
            <span key={href}>
              {i > 0 && SEP}
              <SocialLink href={href} label={label} />
            </span>
          ))}
        </span>
        <span>
          {footerLinks.map(({ href, label }, i) => (
            <span key={href}>
              {i > 0 && SEP}
              <InternalLink href={href} label={label} />
            </span>
          ))}
          {SEP}
          <InternalLink href="/slet-konto" label="Slet konto" />
        </span>
        <span>
          <Copyright />
        </span>
      </p>
    </footer>
  )
}
