/**
 * The Altid Hjem palette, verbatim from DESIGN.md (the group design system).
 *
 * These are the ONLY colours the consent screens and the confirmation email may
 * use. Both altidhjem.dk and altidmad.dk render the same consent flow, and it has
 * to look like one company: a person who signed up on one site and confirms from
 * the other must not see two different brands mid-flow.
 *
 * Do not copy hex codes out of an old email template — that is how three
 * different palettes ended up live at once.
 */
export const BRAND = {
  cream: '#FDFAF4',
  sand: '#E6E2D8',
  white: '#FFFFFF',
  forestDeep: '#163223',
  signal: '#90FF7C',
  textMutedWarm: '#6F6A61',
} as const
