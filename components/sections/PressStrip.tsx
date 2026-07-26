// Press-mention banner, rendered INSIDE the hero section (see Hero.tsx) so the
// hero's cream ground stays continuous and the phone mockup's drop shadow isn't
// cut by a section seam. Modelled on the Altid Energi hero press citation.
const ARTICLE = {
  headline: 'Spar stort på dine dagligvarer: Ny app sammenligner priser',
  url: 'https://ekstrabladet.dk/forbrug/Teknologi/spar-stort-paa-dine-dagligvarer-ny-app-sammenligner-priser/11232767',
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
