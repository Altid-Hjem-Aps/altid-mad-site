// The privacy policy text is owned by altidhjem.dk (Altid-Hjem-Aps/landing-page,
// lib/privacyPolicy.ts) and served as JSON. This site renders that text, so all
// Altid sites show the same policy. Only the cookie section is this site's own.
//
// The JSON shape is a contract with altidhjem.dk. Inline links are written
// [label](url) inside any text; url is https://..., mailto:... or the special
// COOKIE_SETTINGS_URL.

export const PRIVACY_POLICY_URL = 'https://www.altidhjem.dk/privatlivspolitik.json'
export const COOKIE_SETTINGS_URL = 'cookie-settings'

export interface PolicyListItem {
  /** Bold run-in label. Plain text, no links. */
  label?: string
  text: string
}

export type PolicyBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'label'; text: string }
  | { type: 'list'; items: PolicyListItem[] }
  /** First line is the name (bold). Other lines may hold inline links. */
  | { type: 'address'; lines: string[] }

export interface PolicySection {
  /** Keeps its number, e.g. "5. Deling af oplysninger". */
  title: string
  blocks: PolicyBlock[]
}

export interface PrivacyPolicy {
  /** ISO date, YYYY-MM-DD. */
  updated: string
  sections: PolicySection[]
}

export type InlineSegment = { text: string } | { text: string; url: string }

const INLINE_LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g

/** Splits text with [label](url) links into plain and link segments. */
export function parseInline(text: string): InlineSegment[] {
  const segments: InlineSegment[] = []
  let last = 0
  for (const match of text.matchAll(INLINE_LINK)) {
    if (match.index > last) segments.push({ text: text.slice(last, match.index) })
    segments.push({ text: match[1], url: match[2] })
    last = match.index + match[0].length
  }
  if (last < text.length) segments.push({ text: text.slice(last) })
  return segments
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

function isPolicyListItem(value: unknown): value is PolicyListItem {
  return isRecord(value) && typeof value.text === 'string' && (value.label === undefined || typeof value.label === 'string')
}

function isPolicyBlock(value: unknown): value is PolicyBlock {
  if (!isRecord(value)) return false
  switch (value.type) {
    case 'paragraph':
    case 'label':
      return typeof value.text === 'string'
    case 'list':
      return Array.isArray(value.items) && value.items.every(isPolicyListItem)
    case 'address':
      return isStringArray(value.lines) && value.lines.length > 0
    default:
      return false
  }
}

function isPolicySection(value: unknown): value is PolicySection {
  return isRecord(value) && typeof value.title === 'string' && Array.isArray(value.blocks) && value.blocks.every(isPolicyBlock)
}

function isPrivacyPolicy(value: unknown): value is PrivacyPolicy {
  return isRecord(value) && typeof value.updated === 'string' && Array.isArray(value.sections) && value.sections.every(isPolicySection)
}

/**
 * Fetches the policy from altidhjem.dk, cached for an hour. Throws on a failed
 * request or an unknown shape: there is no bundled copy to fall back to, so a
 * bad response fails the build or the revalidation and the last good page stays.
 */
export async function fetchPrivacyPolicy(): Promise<PrivacyPolicy> {
  const response = await fetch(PRIVACY_POLICY_URL, { next: { revalidate: 3600 } })
  if (!response.ok) throw new Error(`Privacy policy fetch failed: ${response.status} ${PRIVACY_POLICY_URL}`)
  const body: unknown = await response.json()
  if (!isPrivacyPolicy(body)) throw new Error(`Privacy policy from ${PRIVACY_POLICY_URL} has an unknown shape`)
  return body
}
