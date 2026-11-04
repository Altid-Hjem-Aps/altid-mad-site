// The two store links on altidmad.dk (ALT-895), written out in full so a test
// can pin them as literal strings. Browser safe: client components import this.
export const APP_STORE_LINK =
  'https://apps.apple.com/dk/app/altid-hjem/id6794330094?pt=129212732&ct=ah_1_altidmad_dk&mt=8'
export const PLAY_STORE_LINK =
  'https://play.google.com/store/apps/details?id=dk.altidhjem.app&referrer=utm_source%3Daltidmad_dk%26utm_campaign%3Dah_1_altidmad_dk'

export const STORES = ['appstore', 'play'] as const
export type Store = (typeof STORES)[number]
export const STORE_POSITIONS = ['hero', 'bottom'] as const
export type StorePosition = (typeof STORE_POSITIONS)[number]

/** The in-page target of every "Hent appen" link. One per page. */
export const STORE_ANCHOR = 'hent-appen'
