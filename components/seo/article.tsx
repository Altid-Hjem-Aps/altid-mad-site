import Link from 'next/link'

/**
 * Shared building blocks for the SEO article pages (billigste-supermarked,
 * madbudget cluster). Keeps the article scaffolding — headings, body text,
 * FAQ accordion + schema, mid-article CTA, mockup frame — identical across
 * the cluster so the pages only carry their own copy and page components.
 */

export const FOREST = '#163223'
export const MUTED = '#6f6a61'
export const BODY_INK = 'rgba(22,50,35,0.8)'
export const FAINT_INK = 'rgba(22,50,35,0.5)'

export type FaqItem = { q: string; a: string[] }

export function faqSchema(faq: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a.join(' ') },
    })),
  }
}

/** FAQPage JSON-LD script tag. '<' escapes as <: JSON.stringify does not
 * escape '<', so a future FAQ text containing '</script>' could break out. */
export function FaqSchemaScript({ faq }: { faq: FaqItem[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(faq)).replace(/</g, '\\u003c') }}
    />
  )
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl sm:text-2xl font-normal mt-12 mb-4 text-balance" style={{ color: FOREST }}>
      {children}
    </h2>
  )
}

export function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-base leading-relaxed mb-4 text-pretty" style={{ color: BODY_INK }}>
      {children}
    </p>
  )
}

export function A({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith('http') || href.endsWith('.pdf')
  const cls = 'underline underline-offset-4 hover:opacity-70'
  return external ? (
    <a href={href} className={cls} style={{ color: FOREST }}>
      {children}
    </a>
  ) : (
    <Link href={href} className={cls} style={{ color: FOREST }}>
      {children}
    </Link>
  )
}

export function BackLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 text-sm mb-10 transition-opacity hover:opacity-70"
      style={{ color: MUTED }}
    >
      <span aria-hidden="true">←</span> Tilbage
    </Link>
  )
}

export function MidCta({ label }: { label: string }) {
  return (
    <div className="my-8 flex justify-center">
      <a
        href="#venteliste"
        className="inline-flex items-center justify-center rounded-full px-7 py-4 text-[16px] font-medium transition-opacity hover:opacity-85"
        style={{ background: '#DCD799', color: FOREST }}
      >
        {label}
      </a>
    </div>
  )
}

/** Gradient frame around a page mockup/tool, with the caption underneath. */
export function MockupFrame({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <div className="max-w-2xl mx-auto px-6 pb-20">
      <div
        className="rounded-3xl flex justify-center py-10 px-4"
        style={{ background: 'linear-gradient(160deg, rgba(168,224,99,0.12) 0%, rgba(22,50,35,0.05) 100%)' }}
      >
        {children}
      </div>
      <p className="text-xs mt-3 text-center" style={{ color: FAINT_INK }}>
        {caption}
      </p>
    </div>
  )
}

export function FaqAccordion({ faq }: { faq: FaqItem[] }) {
  return (
    <div className="max-w-2xl mx-auto px-6 pb-20">
      <H2>Ofte stillede spørgsmål</H2>
      <div className="space-y-3">
        {faq.map((f) => (
          <details
            key={f.q}
            className="group rounded-xl overflow-hidden transition-colors"
            style={{ background: '#ffffff', border: '1px solid rgba(22,50,35,0.1)', boxShadow: '0 1px 3px rgba(22,50,35,0.06)' }}
          >
            <summary
              className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <h3 className="font-medium text-sm" style={{ color: FOREST }}>{f.q}</h3>
              <span
                aria-hidden="true"
                className="shrink-0 text-lg leading-none transition-transform duration-200 group-open:rotate-45"
                style={{ color: FOREST }}
              >
                +
              </span>
            </summary>
            <div className="px-5 pb-5 pt-0 space-y-3">
              {f.a.map((paragraph) => (
                <p key={paragraph} className="text-base leading-relaxed" style={{ color: BODY_INK }}>
                  {paragraph}
                </p>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
