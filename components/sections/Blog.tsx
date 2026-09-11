'use client'

import Link from 'next/link'
import { useAutoCarousel, useCarouselReveal, CarouselPagination } from '@/components/useAutoCarousel'
import { H2, EYEBROW } from '@/lib/typography'

// Blog strip — the "read more" section linking to altidhjem.dk's SEO pages
// (the Mad site has no local blog routes).
// A centred snap carousel of large post cards (like the Figma frame, where the
// cards overflow the viewport with dots below — on desktop too). Several cards
// can point at the same SEO page from different angles; the chip icon matches
// the post's topic. Loop/autoplay/pagination live in useAutoCarousel.

type Post = {
  href: string
  icon: string
  category: string
  title: string
  excerpt: string
  meta: string
}

const POSTS: Post[] = [
  {
    href: '/billigste-supermarked',
    icon: '/services/icon-mad.svg',
    category: 'Mad',
    title: 'Hvilket supermarked er billigst?',
    excerpt: 'Vi sammenlignede den samme kurv med 23 varer hos 13 kæder. Se hvem der var billigst, hvad forskellen betyder på et år, og hvordan analysen er lavet.',
    meta: '5 min læsning · 26. jul 2026',
  },
  {
    href: '/madpakker-paa-budget',
    icon: '/services/icon-mad.svg',
    category: 'Mad',
    title: 'Madpakker på budget til skolestart',
    excerpt: 'Skolestart betyder 5 madpakker om ugen pr. barn. Få billige madpakke-idéer, en enkel ugeplan og råd til at planlægge efter ugens tilbud.',
    meta: '4 min læsning · 26. jul 2026',
  },
  {
    href: '/madbudget',
    icon: '/services/icon-mad.svg',
    category: 'Mad',
    title: 'Hvad er et normalt madbudget?',
    excerpt: 'Danmarks Statistik har tallene for, hvad husstande faktisk bruger på mad. Se benchmark for jeres husstandstype, og hvorfor tallene i forældrefora ofte er højere.',
    meta: '6 min læsning · 26. jul 2026',
  },
  {
    href: '/beregn-dit-madbudget',
    icon: '/services/icon-mad.svg',
    category: 'Mad',
    title: 'Beregn jeres madbudget på et minut',
    excerpt: 'Vælg husstand, indtast hvad I bruger i dag, og se jeres benchmark plus et estimat på, hvad smartere indkøb kan betyde. Intet gemmes.',
    meta: 'Beregner · 26. jul 2026',
  },
  {
    href: '/madplan-efter-tilbud',
    icon: '/services/icon-mad.svg',
    category: 'Mad',
    title: 'Madplan efter ugens tilbud',
    excerpt: 'Tilbud først, madplan bagefter, indkøbsliste til sidst. Den rækkefølge er den enkeltvane, der flytter mest i madbudgettet. Sådan gør du i praksis.',
    meta: '5 min læsning · 26. jul 2026',
  },
  {
    href: '/madbudget-familie-paa-4',
    icon: '/services/icon-mad.svg',
    category: 'Mad',
    title: 'Madbudget for en familie på 4',
    excerpt: 'Hvad er normalt for en børnefamilie? Se tallene fra Danmarks Statistik, hvad vores egen kurvanalyse viser, og de tre vaner der flytter mest.',
    meta: '5 min læsning · 26. jul 2026',
  },
  {
    href: '/mad-for-3000-om-maaneden',
    icon: '/services/icon-mad.svg',
    category: 'Mad',
    title: 'Kan man leve for 3.000 kr. mad om måneden?',
    excerpt: 'Det ærlige svar med regnestykket: hvad 3.000 kr. betyder pr. uge, hvem der realistisk kan ramme det, og hvordan I kommer tættest på.',
    meta: '5 min læsning · 26. jul 2026',
  },
  {
    href: '/spar-penge-paa-dagligvarer',
    icon: '/services/icon-mad.svg',
    category: 'Mad',
    title: 'Spar penge på dagligvarer',
    excerpt: 'Ingen kupon-tricks, bare vaner der virker: vælg hovedbutik med omhu, planlæg efter tilbud, og køb rigtigt ind. Den samlede gevinst kan mærkes.',
    meta: '6 min læsning · 26. jul 2026',
  },
  {
    href: '/graensehandel-beregner',
    icon: '/services/icon-mad.svg',
    category: 'Mad',
    title: 'Kan grænsehandel betale sig?',
    excerpt: 'Regn det efter, før I kører: brændstof, break-even og de udgifter folk glemmer. Beregneren giver det ærlige svar for netop jeres tur.',
    meta: 'Beregner · 26. jul 2026',
  },
  {
    href: '/jul-paa-budget',
    icon: '/services/icon-mad.svg',
    category: 'Mad',
    title: 'Jul på budget uden panik-uge',
    excerpt: 'Spred juleindkøbene over ugerne op til jul i stedet for én dyr uge i december. Sådan planlægger I julemaden efter tilbuddene.',
    meta: '5 min læsning · 26. jul 2026',
  },
  {
    href: 'https://altidhjem.dk/hvad-koster-forsikring',
    icon: '/services/icon-forsikring.svg',
    category: 'Forsikring',
    title: 'Hvad koster forsikring i 2026?',
    excerpt: 'Se vejledende priser på de mest almindelige forsikringer, og find ud af, om du betaler for meget – eller er dækket dobbelt uden at vide det.',
    meta: '5 min læsning · 17. jun 2026',
  },
  {
    href: 'https://altidhjem.dk/hvornar-er-strommen-billigst',
    icon: '/services/icon-strom.svg',
    category: 'Energi',
    title: 'Lad Altid Hjem holde øje med elprisen for dig',
    excerpt: 'Det kræver tid at holde øje med elprisen hver dag. Det er netop én af de ting, vi bygger Altid Hjem-appen til. Appen følger elprisen for dig og giver konkrete råd.',
    meta: '5 min læsning · 25. jun 2026',
  },
  {
    href: 'https://altidhjem.dk/spiir-alternativ',
    icon: '/app-badge.png',
    category: 'Overblik',
    title: 'Spiir lukker – hvad bruger du nu?',
    excerpt: 'Spiir lukkede 8. juni 2026. Altid Hjem giver dig overblik over hjemmets faste udgifter – el, mobil og forsikring samlet ét sted, i én app.',
    meta: '4 min læsning · 10. jun 2026',
  },
  {
    href: 'https://altidhjem.dk/hvad-koster-forsikring',
    icon: '/services/icon-forsikring.svg',
    category: 'Forsikring',
    title: 'Er du forsikret dobbelt uden at vide det?',
    excerpt: 'Mange danskere betaler for den samme dækning to gange – fx en rejseforsikring, der allerede er inkluderet i indboforsikringen. Se, hvordan du tjekker det.',
    meta: '4 min læsning · 17. jun 2026',
  },
  {
    href: 'https://altidhjem.dk/hvornar-er-strommen-billigst',
    icon: '/services/icon-strom.svg',
    category: 'Energi',
    title: 'Hvornår er strømmen billigst?',
    excerpt: 'Følg elpriserne time for time i DK1 og DK2, og se hvornår strømmen er billigst i dag og i morgen – så du kan lægge forbruget, når prisen er lav.',
    meta: '4 min læsning · 14. jun 2026',
  },
  {
    href: 'https://altidhjem.dk/spiir-alternativ',
    icon: '/app-badge.png',
    category: 'Overblik',
    title: 'Få ro på hjemmets faste udgifter',
    excerpt: 'Regninger, vilkår og aftaler spredt på mail, papir og e-Boks stjæler overblikket. Saml dem ét sted, og se præcis hvad du betaler for – og hvorfor.',
    meta: '3 min læsning · 10. jun 2026',
  },
]

// The track renders the posts three times so the carousel can loop seamlessly
// (see useAutoCarousel).
const N = POSTS.length
const LOOP = [...POSTS, ...POSTS, ...POSTS]

// Autoplay interval — the active dot's progress fill loads over this time,
// then the carousel slides to the next card (Apple-gallery pagination).
const AUTO_MS = 5000

function PostCard({ post, clone = false }: { post: Post; clone?: boolean }) {
  return (
    <Link
      tabIndex={clone ? -1 : undefined}
      href={post.href}
      className="flex flex-col w-full bg-white transition-shadow hover:shadow-[0_14px_34px_rgba(15,55,30,0.12)]"
      style={{
        borderRadius: 20,
        border: '1px solid rgba(22,50,35,0.12)',
        boxShadow: '0 6px 18px rgba(0,0,0,0.05)',
        padding: 'clamp(24px,1.8vw,34px)',
      }}
    >
      {/* Category chip */}
      <div className="flex items-center gap-3 mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.icon} alt="" loading="lazy" decoding="async" className="shrink-0" style={{ width: 'clamp(34px,2.3vw,44px)', height: 'clamp(34px,2.3vw,44px)', borderRadius: 10 }} />
        <span className="text-[13px] font-medium uppercase" style={{ color: '#163223', letterSpacing: '1.2px' }}>
          {post.category}
        </span>
      </div>

      <h3 className="font-normal leading-snug text-[clamp(19px,1.5vw,27px)] mb-3.5" style={{ color: '#163223' }}>
        {post.title}
      </h3>
      <p className="font-normal text-[clamp(14px,0.85vw,16px)] leading-[1.7] mb-7" style={{ color: '#6f6a61' }}>
        {post.excerpt}
      </p>

      {/* Footer — meta left, "read more" pill right */}
      <div className="mt-auto flex items-center justify-between gap-4">
        <span className="text-[clamp(13px,0.8vw,15px)]" style={{ color: '#6f6a61' }}>{post.meta}</span>
        <span
          className="shrink-0 inline-flex items-center gap-2 rounded-full text-[clamp(13px,0.85vw,16px)] font-medium"
          style={{ background: '#90ff7c', color: '#163223', padding: 'clamp(9px,0.7vw,13px) clamp(18px,1.3vw,25px)' }}
        >
          Læs mere
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M2 7h10M8 3l4 4-4 4" stroke="#163223" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </Link>
  )
}

export default function Blog() {
  const carousel = useAutoCarousel(N, AUTO_MS)
  const { trackRef, onScroll, cancelGlide } = carousel
  const reveal = useCarouselReveal(trackRef, carousel.reduced, N, carousel.demoNudge)

  return (
    <section className="py-20 sm:py-28" style={{ background: '#ffffff' }}>

      <div className="text-center mb-12 sm:mb-14 px-6">
        <p className={`${EYEBROW} mb-4`} style={{ color: '#6f6a61' }}>
          Blog
        </p>
        <h2 className={H2} style={{ color: '#163223' }}>
          Læs mere om, hvordan Altid Hjem skaber ro i hverdagen
        </h2>
      </div>

      {/* Snap carousel — large cards (≈720px @1920) that overflow the viewport,
          on all breakpoints, like the Figma. snap-center + symmetric edge
          padding = the active card always sits centered on the page, with its
          neighbours peeking in from both sides. */}
      <div
        ref={trackRef}
        onScroll={onScroll}
        onPointerDown={cancelGlide}
        onWheel={cancelGlide}
        onTouchStart={cancelGlide}
        className="flex gap-[clamp(16px,2.5vw,48px)] overflow-x-auto snap-x snap-mandatory pt-4 pb-14 px-[max(7vw,calc((100vw-520px)/2))] lg:px-[calc((100vw-clamp(560px,37.5vw,760px))/2)]"
        style={{ scrollbarWidth: 'none' }}
      >
        {LOOP.map((p, i) => {
          // Only the middle set lives in the accessibility tree — the clone
          // sets exist purely for the seamless loop and would otherwise give
          // keyboard/screen-reader users every post three times.
          const clone = i < N || i >= 2 * N
          return (
            <div key={`${p.href}-${i}`} aria-hidden={clone || undefined} className="snap-center shrink-0 flex w-[86vw] max-w-[520px] lg:max-w-none lg:w-[clamp(560px,37.5vw,760px)]" style={reveal(i)}>
              <PostCard post={p} clone={clone} />
            </div>
          )
        })}
      </div>

      {/* Apple-gallery pagination: active dot = loading pill + pause toggle */}
      <div className="mt-1">
        <CarouselPagination count={N} carousel={carousel} itemLabel={(i) => `Gå til indlæg ${i + 1}`} />
      </div>

    </section>
  )
}
