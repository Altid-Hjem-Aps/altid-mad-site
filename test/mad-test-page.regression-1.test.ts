import { afterEach, describe, expect, it } from 'vitest'
import { renderMadTestScreen } from '@/lib/mad-test'

// Regression: ISSUE-002 — the Mad test's "link does not work" screen said "Gå til altidmad.dk"
// and linked "/", which redirects to altidhjem.dk once the site is retired.
// Found by /qa on 2026-11-16
// Report: .gstack/qa-reports/qa-report-localhost-2026-11-16.md

const ORIGINAL = process.env.SITE_RETIRED
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.SITE_RETIRED
  else process.env.SITE_RETIRED = ORIGINAL
})

describe('mad-testen invalid-link screen', () => {
  it('names and links altidhjem.dk while retired', () => {
    process.env.SITE_RETIRED = '1'
    const html = renderMadTestScreen({ kind: 'invalid' })
    expect(html).toContain('<a href="https://www.altidhjem.dk/">Gå til altidhjem.dk</a>')
    expect(html).not.toContain('Gå til altidmad.dk')
  })

  it('is unchanged while live', () => {
    delete process.env.SITE_RETIRED
    expect(renderMadTestScreen({ kind: 'invalid' })).toContain('<a href="/">Gå til altidmad.dk</a>')
  })
})
