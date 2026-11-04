// Central type scale for the CVI rebuild.
//
// Each constant is a verified Tailwind className string for a text role
// that's used identically across multiple sections. Import it instead of
// retyping the size/weight/line-height/tracking combo at each call site, so
// sections sharing a role can't quietly drift apart again — that's exactly
// how the old signup form's light and dark variants ended up with two different
// treatments for the same "form step heading" and "primary button" roles
// before this file existed.
//
// Colour, margin, text-align, and layout width are intentionally NOT
// included — those vary legitimately per section/background and stay on
// the call site. Compose like: `${H2} mb-6` with `style={{ color }}`.

// Fluid ramps are two-point interpolations anchored at 390px → min and
// 1920px → max (slope = (max−min)/1530). The earlier pure-vw slopes hit
// their minimum as early as ~1077px, so every iPad/phone width rendered the
// same flattened scale while desktop stayed fluid — that's why the page felt
// inconsistent off-desktop. The 1920px values are unchanged.

/** Hero headline only (Hero.tsx). Pair with the instance's own optical
 *  alignment tweaks (e.g. `lg:-ml-[0.05em]`) — those aren't part of the type role. */
export const H1 = 'font-normal leading-[1.08] max-lg:leading-[1.2] tracking-[-0.02em] text-[clamp(32px,calc(19.76px+3.137vw),80px)] max-sm:text-[clamp(28px,calc(10.28vw-5px),40px)] lg:text-[clamp(40px,calc(29.8px+2.61vw),80px)]'

/** Every section heading — WhatIs, Services, HowItWorks, Trust, Faq, Blog,
 *  BottomCta, SavingsCounter, FounderVideo. */
export const H2 = 'font-normal leading-[1.15] text-[clamp(28px,calc(22.4px+1.44vw),50px)]'

/** The small uppercase label that sits above a section heading. */
export const EYEBROW = 'text-[13px] font-medium uppercase tracking-[1.6px]'

/** Standard body copy, fixed 16px. */
export const BODY = 'font-normal leading-[1.8] text-[16px]'

/** Body copy that scales with viewport — used for the one or two sections
 *  with a slightly larger lead paragraph (e.g. WhatIs.tsx). */

/** Primary CTA button type + geometry (background/colour set per call site).
 *  Used by the HowItWorks button. */
export const BUTTON_PRIMARY = 'py-[23px] rounded-[20px] text-[16px] font-medium leading-tight text-center'

/** Legal links, disclaimers, fine print. */
export const FINE_PRINT = 'text-xs font-normal leading-relaxed'
