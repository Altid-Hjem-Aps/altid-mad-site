/**
 * Tilmeldingskilder — den fælles sandhed for både klient (props) og server
 * (allowlist). Nye kampagnesider tilføjes HER, ét sted, så klient og server
 * ikke kan drifte fra hinanden.
 */
export const SIGNUP_SOURCES = ['altid-mad'] as const

export type SignupSource = (typeof SIGNUP_SOURCES)[number]

// The Mad site tags every signup 'altid-mad' so the shared Supabase/Amplitude
// backend (same as altidhjem.dk) can tell the two sites apart.
export const DEFAULT_SIGNUP_SOURCE: SignupSource = 'altid-mad'

/**
 * Allowlist-normalisering af klientens `source`-felt, så vilkårlige værdier
 * aldrig når DB/Resend/Amplitude. Ukendte (men angivne) værdier logges, så en
 * glemt allowlist-tilføjelse opdages i stedet for stille at blive 'forside'.
 */
export function normalizeSignupSource(value: unknown): SignupSource {
  if (typeof value === 'string' && (SIGNUP_SOURCES as readonly string[]).includes(value)) {
    return value as SignupSource
  }
  if (value !== undefined && value !== null && value !== '') {
    console.warn('waitlist: unknown signup source, falling back to altid-mad:', String(value).slice(0, 64))
  }
  return DEFAULT_SIGNUP_SOURCE
}
