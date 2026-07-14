// Press-mention banner, rendered INSIDE the hero section (see Hero.tsx) so the
// hero's cream ground stays continuous and the phone mockup's drop shadow isn't
// cut by a section seam. Modelled on the Altid Energi hero press citation.
//
// -------------------------------------------------------------------------
// PLACEHOLDER COPY — the EB article isn't published yet, so the exact headline
// and URL are unknown. `headline` + `url` below are stand-ins for design
// review only. Do NOT ship this: replace both with the real values once the
// article is live (Werner: "så snart artikel er ude"), then open the PR.
// -------------------------------------------------------------------------
const ARTICLE = {
  // Example headline — replace with the article's actual title.
  headline: 'Ny app kan spare en børnefamilie op til 15.000 kr. om året på maden',
  // Replace with the published Ekstra Bladet article URL.
  url: '#',
}

export default function PressStrip() {
  return (
    <a
      href={ARTICLE.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Omtale i pressen – Ekstra Bladet"
      className="group flex items-center justify-center gap-3 sm:gap-4 text-center"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/press/ekstra-bladet.png"
        alt="Ekstra Bladet"
        width={52}
        height={52}
        loading="lazy"
        decoding="async"
        className="h-11 sm:h-12 w-auto shrink-0"
      />
      <span className="text-[14px] sm:text-[15px] leading-snug font-light">
        <span style={{ color: '#6f6a61' }}>Ekstra Bladet: </span>
        <span
          className="font-normal underline-offset-4 group-hover:underline"
          style={{ color: '#163223' }}
        >
          {ARTICLE.headline}
        </span>
      </span>
      <span
        aria-hidden
        className="shrink-0 transition-transform group-hover:translate-x-0.5"
        style={{ color: '#3E6924' }}
      >
        →
      </span>
    </a>
  )
}
