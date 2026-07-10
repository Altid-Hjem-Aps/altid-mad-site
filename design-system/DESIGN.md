# Altid Mad — Design System

Extracted from the live codebase (`~/altid-mad-site`), 4 Jul 2026. The Mad site
inherits the Altid group frame (forest/cream/Onest) and adds the Mad brand
layer (teal/mint) on top. Open `index.html` for visual previews; each HTML
file carries a `@dsCard` marker for /design-sync upload.

## Colour

| Token | Value | Role |
|---|---|---|
| Forest | `#163223` | Group: nav, footer, bottom CTA, primary text |
| Forest 2 | `#193d23` | Group: trust/dark sections |
| Cream | `#fdfaf4` | Light canvas + flow-card surface |
| White | `#ffffff` | Cards, panels, alternating sections |
| **Mad Teal** | `#0f6e68` | Brand: sections, headings, highlights, winner-states |
| **Mint** | `#bfe6e0` | **The single CTA surface** (+ badges, logo "mad", nav dot) |
| Muted | `#6f6a61` | Secondary text (≥4.5:1 on cream/white) |
| Signal green | `#90ff7c` | Group accents ONLY (FAQ plus, blog pill, trust dots) |
| Hairline | `rgba(15,110,104,0.12)` on light · `#ece7db` on cream | Borders |

**Accents (semantic, never decorative):** amber `#e88b2f` (wash
`rgba(232,139,47,.15)`, ink `#7d430e`) = budget/promo · blue `#2f8fd0` (wash
`rgba(47,143,208,.13)`, ink `#1c567e`) = time/info · teal-wash = brand-positive.
**Red is reserved for danger/error and is unused** — savings are positive and
render mint/teal. Colour is never the sole cue; every dot/tag pairs with text.

## Type (lib/typography.ts)

Onest everywhere; Afacad only for the subbrand word in logo lockups.

- **H1** 400 · `clamp(32px → 80px)` · lh 1.08 · ls −0.02em
- **H2** 400 · `clamp(28px → 50px)` · lh 1.15
- **Eyebrow** 500 · 13px · uppercase · tracking 1.6px
- **Body** 400 · 16px · lh 1.8 · muted; closing "Altid." in forest 500
- **Button** 500 · 16px · **Fine print** 400 · 12px
- Fluid ramps anchor 390px → 1920px

## Surfaces & depth

White section → cream card (`radius 26`, `#ece7db` hairline, shadow
`0 18px 44px -18px rgba(22,50,35,.14)`) → white panel (`radius 16`, teal
hairline) → rows. Benefit cards: white on teal, `radius 20`, shadow
`0 6px 18px rgba(0,0,0,.08)`. No side-stripes, no gradient text, no glass.

## Components

- **CTA:** mint bg + forest text, `radius 20`, `py 23px`; identical on light
  and dark surfaces; hero variant pulses `rgba(143,203,194,.65)`.
- **Brand chip:** teal pill + mint star + "Altid Mad" — one per surface.
- **Tags:** 10px/700 on 6px radius washes (see accents above); TILBUD = mint.
- **Store chips:** teal-wash pill + brand dot (Netto amber, Bilka/føtex blue,
  REMA teal) + label.
- **Day chip:** 34×26 `rgba(191,230,224,.45)` + teal.
- **Pagination:** shared `CarouselPagination` — 9px dots, active stretches to
  52px pill filling over `autoMs`, + pause toggle. Used by every carousel and
  the animated flow cards.
- **Nav "Kommer snart":** muted 60% text + 9px uppercase sublabel, not a link.
- **Photos:** square, `radius 7–8` thumbs (24–30px) in rows, 64px banners in
  inspiration cards. Source: Unsplash (free commercial license), in
  `public/food/`.

## Motion (lib/motion.ts + conventions)

- `REVEAL_SPRING` `cubic-bezier(.34,1.2,.64,1)` — card/scroll reveals
- `EASE_EXPO` `cubic-bezier(.16,1,.3,1)` entrances · `EASE_QUINT`
  `cubic-bezier(.22,1,.36,1)` exits (~72% of entrance duration)
- Never bounce/elastic. Scroll reveals via IntersectionObserver
  (`rootMargin -20%`), play-only-in-view, banked-time pause.
- Icon micro-loops: coin-drop 4.5s, hand-press 3s, cloche 3.8s, clock 4.8s,
  checklist 4s, family 4.2s — deliberately unsynced periods.
- `prefers-reduced-motion` stills everything; static end-states remain.

## Hard rules

1. One CTA colour (mint). No secondary button colour.
2. Red = danger only.
3. Signal green belongs to the group patterns, not Mad UI.
4. Accents are semantic and labelled — never colour alone, never decoration.
5. Air first: cream/white layering, hairlines, colour in small doses.
